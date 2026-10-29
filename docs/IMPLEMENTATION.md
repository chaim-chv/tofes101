# Implementation plan

> Status: **living document.** The architecture decisions are ADRs
> (`kb/decisions/`); this file is the build order and the contracts. If code and
> this document disagree, the document is wrong — fix it in the same PR.

## 0. What "good" means here

A person filling a legally consequential tax form, often on a phone, often
without confidence, must **never** be able to produce a wrong-but-plausible
document because of our UI. That single sentence drives every rule below:

1. **One source of truth per fact.** A field's label, required-ness, condition,
   validation and PDF position all hang off one `FieldDef`. No second copy in the
   template.
2. **Pure core, thin edges.** All logic (visibility, derived values, validation)
   is pure functions over plain data — no Vue, no DOM, no storage. UI, storage and
   PDF are adapters. This is what makes it testable and stable.
3. **No `eval`.** The reference implementation stores JavaScript expressions in
   its JSON and evaluates them. We do not. Conditions are typed predicates.
4. **Never lose an answer.** Changing an earlier answer may hide later fields; it
   must not delete them (the reference's `clearIrrelevant` is a data-loss bug).
5. **Accessibility is a build gate**, not a review step: axe in e2e, keyboard
   tests, and the a11y checklist in `kb/ux/checklists/`.
6. **No network at runtime.** Enforced by CSP + `scripts/check-privacy.ts`, which
   fails CI.
7. **Ship the smallest thing that is complete.** A half form is worse than no
   form: users will produce invalid 101s.

## 1. Layers

```
            ┌─────────────────────────────────────────────┐
  data      │ form/101/schema.ts   field defs, conditions │
            │ locales/{he,en}.ts   every visible string   │
            └───────────────────┬─────────────────────────┘
                                │  (types only)
            ┌───────────────────▼─────────────────────────┐
  core      │ form/engine.ts   visibility · compute ·     │  pure, no Vue
            │                  validate · summary · steps  │  unit-tested
            │ form/values.ts   defaults, coercion, ids     │
            └───────────────────┬─────────────────────────┘
                                │
            ┌───────────────────▼─────────────────────────┐
  state     │ stores/form.ts   reactive state + actions    │  one instance
            │ storage/draft.ts IndexedDB, versioned        │
            │ storage/export.ts JSON file export/import    │
            └───────────────────┬─────────────────────────┘
                                │
            ┌───────────────────▼─────────────────────────┐
  ui        │ components/form/*  one component per control │
            │ components/app/*   shell, progress, nav      │
            │ pages/form.vue     the only form route       │
            └───────────────────┬─────────────────────────┘
                                │
            ┌───────────────────▼─────────────────────────┐
  output    │ pdf/*  official overlay (lazy)  + print CSS  │
            └─────────────────────────────────────────────┘
```

Rules:

- `form/engine.ts` may not import Vue, Nuxt, or any component.
- Components may not contain business rules (no `v-if="maritalStatus === 'married'"`)
  — they render what the engine computed.
- Only `stores/form.ts` mutates state.
- Only `storage/*` touches IndexedDB / files.

## 2. Contracts

### 2.1 Field definition

```ts
type FieldId = string                       // stable, e.g. "employee.idNum"

interface BaseField {
  id: FieldId
  kind: "text" | "date" | "radio" | "checkbox" | "select" | "repeat" | "signature" | "consent"
  labelKey: MessageKey
  helpKey?: MessageKey
  /** Field is shown only if this returns true. Absent = always. */
  when?: (s: FormState) => boolean
  /** Field is required given the current state. */
  required?: boolean | ((s: FormState) => boolean)
  /** Runs after parse; returns typed issues. */
  validate?: (value: unknown, s: FormState) => Issue[]
  /** Contributes to the step's "you can move on" check. */
  blocking?: boolean                     // default true when required
  /** Where it lands in the PDF (view coordinates, page 1|2). */
  pdf?: { page: 1 | 2; x: number; y: number; size?: number; align?: "start" | "end" }
  /** Autofill + input hints */
  autoComplete?: string
  inputMode?: "text" | "numeric" | "tel" | "email" | "decimal"
  maxLength?: number
  options?: ReadonlyArray<{ value: string | number | boolean; labelKey: MessageKey }>
  /** Nested fields for `repeat`. */
  fields?: readonly FieldDef[]
}

type FieldDef = BaseField & {
  kind: "text" | "date" | "select" | "radio"
  // value type is implied by kind + options
}
```

Non-negotiables:
- `id` is stable forever — it is the storage key, the analytics-free export key,
  and the PDF mapping key. Renaming an `id` needs a migration.
- `labelKey` resolves in **both** locales; a missing key fails `bun test`
  (a test walks the schema and asserts `he` and `en` both define every key).
- `when` is total and side-effect free.

### 2.2 State

```ts
interface FormState {
  meta: {
    schema: 2                      // bump on breaking shape changes
    taxYear: 2026
    locale: "he" | "en"
    createdAt: string
    updatedAt: string
    step: number
    completed: Record<string, true>  // step id -> visited & valid once
  }
  values: Record<FieldId, unknown>
  hidden: Record<FieldId, true>     // answers kept but currently not visible
  prefill?: EmployerPrefill
  signature?: SignatureData
}
```

`values` is flat. Repeaters store `Array<Record<FieldId, unknown>>` under their
own id (`children: Child[]`), with each item carrying a local `_key`.

### 2.3 Issue

```ts
interface Issue {
  field: FieldId
  code: string                       // i18n key suffix, e.g. "id.checksum"
  severity: "error" | "warning"      // warnings never block
  messageKey: MessageKey
  params?: Record<string, string | number>
}
```

Validation returns **all** issues, ordered by field order. The UI groups them by
step, renders an error summary at the top of the step, and focuses the first
error field on submit.

### 2.4 Persistence adapter

```ts
interface DraftStore {
  load(): Promise<FormState | null>
  save(state: FormState): Promise<void>      // debounced by the caller
  clear(): Promise<void>
  export(state: FormState): Blob
  import(file: File): Promise<FormState>
}
```

Migrations live in `storage/migrations.ts` and are pure (`v1 -> v2 -> v3`), tested
with fixtures. A draft from a **newer** schema is refused with a readable message,
never silently dropped.

## 3. Components (and the anti-duplication rules)

| component | responsibility | may not |
| --- | --- | --- |
| `FormField.vue` | dispatch by `kind`, render label/help/error wrapper | contain rules |
| `FormText.vue` / `FormDate.vue` / `FormRadio.vue` / `FormCheckbox.vue` / `FormSelect.vue` | one control each, identical a11y wiring | know about steps |
| `FormRepeat.vue` | add/remove/reorder rows, focus management, live announcements | know which repeater it is |
| `FormSignature.vue` | canvas + typed alternative + date | validate the declaration |
| `ErrorSummary.vue` | list of issues with anchor links, focus target | compute issues |
| `StepNav.vue` | back/next, disabled reasons, progress text | decide validity |
| `ProgressSteps.vue` | `aria-current="step"`, jump-to-step | navigate directly |
| `ReviewList.vue` | read-only render of every visible field + "edit" links | format values itself |
| `PrivacyBanner.vue` | the "stays on device" message | — |

**One** control implementation per kind. If a screen needs a variant, it passes a
prop or uses a slot — it does not fork the component. Any duplicated markup in a
page is a bug.

## 4. Navigation & URL

- **Single route** `/form` (see ADR-0007). Steps are state, mirrored to
  `?step=<n>` via `history.replaceState`, so a reload keeps the user in place and
  the PWA's offline fallback has exactly one entry point.
- The employer payload stays in the fragment (`#e=…`), captured before hydration
  by an inline script (`window.__INITIAL_HASH`).
- Back/forward: the browser's back button must leave the form (not walk steps) —
  we use `replaceState`, not `pushState`. Explicit "back" is the step nav.
- Deep link `?step=6`: load draft, validate steps 1–5, and either land on 6 or
  send the user to the first invalid step with a notice.

## 5. Validation & errors

| when | what |
| --- | --- |
| on input | clear the field's error, do not add new ones |
| on blur | run that field's validators; show inline error |
| on "next" | run the step's validators; if errors → error summary + focus first |
| on submit | run everything; block on `severity: "error"` only |
| always | warnings are shown but never block |

Never disable the primary action silently. If it cannot proceed, say why
(`aria-describedby` on the button).

## 6. i18n

- Two catalogs, `he.ts` and `en.ts`, both `as const`, keys typed.
- A unit test walks `schema.ts` and asserts every `labelKey`/`helpKey`/`option`
  key exists in **both** catalogs (and that no catalog has orphan keys).
- Direction is per-locale, not per-page: `dir` on `<html>`, `unicode-bidi:
  isolate` for numbers/IDs/emails, logical CSS properties only.
- Legal terms: Hebrew canonical text, English translation + Hebrew in parentheses
  on first use (`kb/glossary/terms.md`).
- The declaration is versioned per locale; the signature records which wording
  version was signed.

## 7. Storage

- IndexedDB via a **thin typed wrapper** (`storage/idb.ts`, ~60 lines) — no
  dependency, no surprise migrations. One object store, one key (`draft`).
- Debounced autosave (400 ms after the last change) + immediate save on step
  change and on `visibilitychange`.
- Multi-tab: a `BroadcastChannel` "draft updated" ping; a tab that is not the
  writer shows a non-blocking "נפתח בטאב אחר — לרענן?" notice. Never silently
  overwrite.
- Export/import: `.json` with `{ app: "tofes101", schema, exportedAt, state }`.
  Import validates shape, refuses foreign/newer files, and previews what will be
  replaced ("3 ילדים, טופס 2026") before applying.
- Clear-all: one button, two-step confirm, also clears the signature.

## 8. PDF output

See `kb/eng/pdf-generation.md` + ADR-0002. Shape of the implementation:

- `pdf/official.ts` — overlay renderer (pdf-lib + fontkit + bidi-js), **lazy
  imported** (~516 KB gzip). Coordinates come from `pdf` on each `FieldDef`.
- `pdf/bidi.ts` — the tokeniser proven in the spike (RTL runs split into words,
  drawn right-to-left; LTR runs kept whole). Unit-tested against expected token
  order for 6 canonical strings.
- `pdf/fonts.ts` — self-hosted subset of a Hebrew font (OFL), loaded via
  `fetch` from `/fonts/...` on the same origin.
- Fallback: `PrintView.vue` + `window.print()` — always available, never
  downloads a library.
- Both paths must render the same A4 document; the review step shows exactly what
  will be printed.

## 9. Accessibility & keyboard (build gates)

- axe (via `@axe-core/playwright`) on every step + review, **0 violations**.
- Keyboard e2e: complete the form with `Tab`/`Enter`/arrows only.
- `kb/ux/checklists/a11y-pr-checklist.md` is copied into the PR template.
- Fast mode (opt-in single-key shortcuts) implemented in one composable
  (`useFastKeys`) that is inert inside inputs/comboboxes (WCAG 2.1.4).

## 10. Performance budget

| metric | budget | measured (spike) |
| --- | --- | --- |
| first-load JS gzip | ≤ 260 KB | 235 KB |
| LCP (slow 4G, mobile) | ≤ 2.0 s | 1.8 s |
| CLS | 0 | 0 |
| total page weight | ≤ 1.0 MB | 967 KB |
| PDF path (lazy) | only on export | 516 KB gzip |

Anything that blows the budget must be lazy-loaded, and the budget is asserted in
`tools/perf/budget.ts` (reads `.output/public` sizes; fails CI).

## 11. GitHub Pages

- `NUXT_APP_BASE_URL=/tofes101/` at build time → all assets and links are
  relative to the project site.
- `app.baseURL` is the single source for building the employer link
  (`useRuntimeConfig().app.baseURL`).
- No client-side routing beyond `/` and `/form` → no 404 fallback tricks needed.
- Deploy: `.github/workflows/deploy.yml` (verify → artifact → deploy-pages).
- The privacy gate runs **before** deploy, so a leaked CDN host can never ship.

## 12. Build order (each line = a commit that keeps `bun run verify` green)

1. **Contracts + engine** — types, `values.ts`, `engine.ts`, 40+ unit tests
   (visibility, compute, validate, summary). No UI.
2. **Schema part 1** — sections א–ג + employer; i18n key completeness test.
3. **UI primitives** — `FormField` + one control per kind + `ErrorSummary` +
   `StepNav`; a11y tests on a fixture schema.
4. **Store + storage** — autosave, migrations, export/import, multi-tab notice.
5. **Steps 1–4 wired** — first end-to-end fillable subset; e2e happy path.
6. **Schema part 2** — sections ד–ו (income, spouse) with the cross-section
   gate (other income blocking credits).
7. **Schema part 3** — section ח (16 credit items) + ט (coordination).
8. **Signature + declaration + review** — versioned declaration, re-sign rules.
9. **PDF** — overlay + bidi + fonts; golden-file test on 3 profiles.
10. **Polish** — fast mode, print view, PWA, perf budget, full a11y sweep.

## 13. Test matrix (what "stable" means concretely)

| layer | test | count target |
| --- | --- | --- |
| engine | unit, table-driven per rule | ≥ 60 |
| storage | unit + fake-indexeddb | ≥ 15 |
| i18n | key completeness both locales | 2 |
| pdf/bidi | token order fixtures | ≥ 8 |
| components | render + a11y snapshot (axe) | ≥ 10 |
| e2e | 6 canonical profiles × (fill → review → export) | 6 |
| e2e | keyboard-only happy path | 1 |
| e2e | reload/resume, import/export, wrong-version draft | 3 |

Canonical profiles (fixed fixtures, reused everywhere):
1. single, no children, resident
2. married, working spouse, 2 children
3. married, non-working spouse, 3 children (credit item 5 + 7)
4. new immigrant (item 4 + required certificate)
5. separated parent with custody (item 6/9/10 + assessor certificate)
6. passport holder (foreign worker) — children section hidden

## 14. Risks

| risk | mitigation |
| --- | --- |
| Legal drift (2026 values change) | every number in `law/_facts.json` with a source; a `rules/2026.ts` file generated from it; a test asserts the app's numbers match `_facts.json` |
| PDF coordinates wrong | golden-file visual diffs + a manual calibration screen behind `?calibrate=1` |
| Hebrew bidi regressions | token fixtures + screenshot diffs |
| Scope creep into employer side | ADR-0004 is explicit: link builder only |
| Storage eviction on iOS | export nudge + `navigator.storage.persist()` request + visible "last saved" |
| "I filled it but the employer rejected it" | the review step shows exactly the printed output; the checklist lists documents; nothing is claimed that we cannot produce |
