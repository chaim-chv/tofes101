# AGENTS.md — working agreement for AI agents

This is the contract for every AI session in this repo (Claude Code, Codex,
Cursor, Copilot, anything reading `AGENTS.md`). `CLAUDE.md` is a symlink to this
file — edit **this** file, never the link.

You have two jobs: ship the task, and leave the repo cheaper to understand than
you found it. That second job is why the rules below are short and mandatory.

---

## 1. What this project is

A **browser-only** filler for Israeli form 101 (כרטיס עובד): no server, no
account, no network after first load. The form is **data + a pure engine +
adapters**; the PDF is an overlay on the official flat PDF. Map of the domain:
`kb/index.md`.

Non-negotiables, in priority order:

1. **Privacy** — nothing leaves the device. Enforced by `scripts/check-privacy.ts`.
2. **Accessibility** — WCAG 2.2 AA + ת"י 5568, keyboard-complete, RTL-first.
3. **Legal correctness** — every load-bearing rule cites a `kb/sources/` node.
4. **Speed of use** — a returning user finishes in minutes, keyboard-only.

## 2. Hard rules

| # | Rule |
| - | ---- |
| 1 | **Nothing leaves the browser.** Any new dependency, URL, font, icon, or `nuxt.config.ts` change ends with `bun run generate && bun run check:privacy`. |
| 2 | **The form is data.** Conditions, requiredness, validators and computed values live in `app/form/{schema,engine,validators,derive}.ts`. A `.vue` file renders; it never decides. Fixing a rule in a component is always the wrong fix. |
| 3 | **Never hand-edit generated files:** `kb/.generated/**`, `kb/flow/form-101-field-spec.md`, `kb/flow/form-101-schema.json`, `app/pdf/anchors.json`, `.output/**`, `.nuxt/**`, `research/raw/**`. Regenerate with the script named in §4. |
| 4 | **No user-facing text in components.** Every string is a key in `app/locales/he.ts` **and** `en.ts` (parity is tested). Hebrew gender variants are `{ m, f }` objects, not `מצהיר/ה`. |
| 5 | **No invented facts.** Tax numbers, dates and thresholds are year-stamped and cite a `kb/sources/` node. Unsure ⇒ `confidence: unverified` and an open question in `PLAN.md`. |
| 6 | **No `v-html`, no `eval`, no `new Function`.** Drafts go through `app/storage/` (never `localStorage`); only `app/storage/idb.ts` opens IndexedDB. |
| 7 | **Never claim** the app is an approved "טופס 101 אלקטרוני" system, or that a drawn signature is an approved electronic signature. See `FINDINGS.md`. |

## 3. Context protocol — read less, read targeted

**Budget: at most 3 files read before you act.** If the answer is spread wider,
delegate the search (§7) instead of reading more.

Order of operations:

1. Pick a lane from the router (§5) or `kb/index.md`.
2. **`rg` for the symbol** — do not open a file to find out what is in it.
3. Read a **window**, not a file: `read` with `offset`/`limit`, or
   `sed -n '497,624p' app/form/schema.ts`.
4. Read `FINDINGS.md` **before** debugging anything that feels familiar. Most
   traps here have already cost someone an hour.

Do **not** read (it is build output, history, or already distilled):

- `node_modules/`, `.nuxt/`, `.output/`, `.data/`
- `research/raw/**` — 285 KB JSON and crawled HTML. Use the extracted node
  (`kb/flow/form-101-field-spec.md`) instead.
- `research/spikes/**` — historical prototypes; conclusions are in `kb/eng/*`
  and `FINDINGS.md`.
- `bun.lock`, `package-lock.json` — unless you are changing dependencies.
- Whole `app/form/schema.ts` (963 lines) or `app/form/cities.ts` (1286 lines).

### Grep recipes

```bash
rg -n "reserveDays" app tests              # field id → schema, validator, PDF slot, test
rg -n "credits\.reserve" app/locales       # the message keys for that field
rg -l "tax-coordination" kb                # which knowledge node discusses X
rg -n "^describe\(|^test\(" tests          # what is already covered, before writing a test
rg -n "export function" app/form/engine.ts # the engine's public surface
rg --files app | head -50                  # when the map (§4) is not enough
```

If answering "where is X" took more than one file, add the answer to §4 or
`FINDINGS.md` — the next agent pays for that read otherwise.

Batch independent calls: search for several symbols, or read two unrelated
windows, in **one** step. Serial tool round-trips are the main source of latency.

### What fast looks like

```
Task: "the reserve-days field prints 44 pt too high"
✅ rg -n "reserveDays" app tests            → schema + fields.ts + pdf.test.ts
✅ read 30 lines around the hit in fields.ts
✅ read kb/eng/pdf-slot-map.md §prose-blanks  (the known trap)
✅ bun test tests/pdf.test.ts                → fix, verify, done
❌ read all of fields.ts, overlay.ts, anchors.json, then run verify
```

The second version is not more careful — it is the same answer after four
minutes and 40 000 tokens of build logs.

## 4. Repo map

| Path | What it is | Read when |
| ---- | ---------- | --------- |
| `app/form/` | schema (the form as data), engine, validators, derive, format, documents. **Pure** — no Vue, no `#imports`, no network. | any rule/field question |
| `app/components/form/` | one component per control kind; no duplicated markup | UI/render bugs |
| `app/pages/` | `/` landing · `/employer` link builder · `/form` the 9 steps · `/print` A4 · `/accessibility` · `/privacy` | routing, screen copy |
| `app/pdf/` | overlay pipeline: `anchors.json` → `fields.ts` → `overlay.ts` (+ `rtl.ts` for bidi). Lazy chunk. | anything printed |
| `app/storage/` | `idb.ts` (single DB/version), `draft.ts` (envelope + migrations), `files.ts` (attachment blobs) | persistence |
| `app/locales/` | `he.ts`, `en.ts`, typed keys, gender-aware messages | any copy change |
| `shared/employer-link.ts` | `#e=` payload codec (deflate-raw + base64url) | prefill link |
| `tests/` | bun tests: engine, content (key parity), documents, employer-link, navigation, pdf | before and after a change |
| `tools/e2e/flow.ts` | the full Playwright + axe run (4 min) | UI-flow changes only |
| `tools/pdf/` | anchor builder, cell extractor, slot audit renders | PDF geometry work |
| `scripts/` | `kb.ts` (graph + link check), `check-privacy.ts` (CSP/external-host gate) | docs or build gates |
| `kb/` | knowledge graph — start at `kb/index.md`; conventions in `kb/CONVENTIONS.md` | "why", "what is the rule" |
| `FINDINGS.md` | fast lane: dated, evidence-linked implementation traps | first stop when debugging |
| `PLAN.md` | roadmap + open questions (`O-n`) | scope questions |
| `kb/decisions/` | ADRs; a decision that is made lives here, not in a comment | changing architecture |
| `docs/IMPLEMENTATION.md` | the engine/PDF contracts and build order | onboarding to contracts |

## 5. Task router

| Task | Read first (only) | Touch | Prove with |
| ---- | ---------------- | ----- | ---------- |
| Add/change a field or rule | field spec row + matching `kb/law/`, `kb/field/` node | `app/form/schema.ts`, `validators.ts`, `derive.ts`, both locales, `app/pdf/fields.ts` if printed | `bun test tests/engine.test.ts` |
| Screen or UX change | `kb/ux/ux-principles.md`, `kb/ux/form-101-screen-map.md` | `app/pages/form.vue`, `app/components/form/*` | `generate` + `e2e` |
| Copy / translation | the key in `app/locales/he.ts` | both locales | `bun test tests/content.test.ts` |
| PDF coordinate / print | `kb/eng/pdf-slot-map.md`, `app/pdf/README.md` | `tools/pdf/build-anchors.ts` (regenerates `anchors.json`), `app/pdf/fields.ts` | `bun test tests/pdf.test.ts` |
| Tax/law fact | `kb/law/form-101.md` → specific node → its `kb/sources/` | `kb/` only | `bun run kb:check` |
| Storage / draft | `kb/eng/storage-draft.md`, `app/storage/draft.ts` | storage layer | `bun test` + a manual reload (no dedicated storage test yet — add one if you touch migrations) |
| Privacy / CSP / icons / fonts | `kb/eng/privacy-enforcement.md` | `nuxt.config.ts`, `scripts/check-privacy.ts` | `generate` + `check:privacy` |
| Accessibility bug | `kb/ux/checklists/a11y-pr-checklist.md` | the component | `generate` + `e2e` (axe runs on every step) |
| "How does X work?" / "where is X used?" | nothing | nothing | a written answer with `file:line` — delegate it (§7) |

## 6. Testing ladder (measured 2026-11-01)

Run the **narrowest level that can fail for your change**. Running a wider suite
is not thoroughness, it is latency.

| Level | Command | Cost | Run when |
| ----- | ------- | ---- | -------- |
| Knowledge graph | `bun run kb:check` | 0.05 s | any `kb/` or `FINDINGS.md` edit |
| Unit, one area | `bun test tests/engine.test.ts` | < 0.3 s | while iterating |
| Unit, all | `bun test` | 0.6 s (113 tests) | before every commit |
| Quick gate | `bun run check:fast` | < 1 s | habit; = kb:check + full unit |
| Types | `bun run typecheck` | ~5 s | commit that touches `.ts`/`.vue` |
| Build + privacy | `bun run generate && bun run check:privacy` | ~9 s | CSP, fonts, icons, deps, routes |
| UI flow + axe | `bun run generate && bun run e2e` | **4 m 17 s** | UI, print, PDF, locale, flow changes |
| Release gate | `bun run verify` | ~4.5 min | before merge to `main`, or to reproduce CI |

Rules:

- **Pass once, move on.** Do not re-run a suite you already ran green unless you
  changed code it covers.
- **Never run `bun run verify`** while iterating. It ends with the 4-minute e2e.
- **Never run e2e** for a docs, engine-only, validator, or locale-string change —
  `bun test` covers those.
- `e2e` serves `.output/public`, so it needs a **prior** `bun run generate`.
- Two agents in parallel **must** use distinct ports: `E2E_PORT=4199 bun run e2e`.
  Sharing port 4173 makes one session kill the other's server and browser.
- `typecheck` prints an `ERR_PACKAGE_PATH_NOT_EXPORTED` stack trace from
  `vue-router/volar` and still **exits 0**. Ignore it unless the output contains
  `error TS`.
- Flaky e2e: run it **once** with the failure captured, then report. Do not loop.

## 7. Delegate exploration and research — default, not last resort

Use a read-only explorer/researcher subagent for:

- any "where is X / how does X work / what calls this" question that would take
  more than two `rg` calls;
- external research (a law, a library behaviour, a competitor page);
- cross-cutting audits ("every place that prints an ID", "all fields without a
  PDF slot", "which locale keys are unused");
- comparing two approaches before you pick one.

Do it yourself when you already know the file, the change is one line, or the
subagent would edit the same files you are about to edit.

Brief template — copy it, do not improvise:

```
Goal: <one question, answerable in one screen>
Where to look: <paths, kb nodes, search terms>
Return: file:line + max 5-line excerpt + one-line conclusion per item.
        Say "not found" instead of guessing.
Budget: stop after N files / N minutes; no full-file dumps.
Do not: edit files, run builds or e2e.
```

Fan out 2–4 agents with **one question each**, in parallel, then merge the
answers yourself. A subagent's claim is a lead, not a fact: if it drives an edit,
open the cited line before you change anything.

No subagents in your harness? Do the same thing with a hard cap — three `rg`
sweeps, three files, and say in your report which question you could not close.

## 8. Where knowledge goes

| You learned… | Write it to | Shape |
| ------------ | ----------- | ----- |
| a trap that cost you time, a version quirk, a command that works | `FINDINGS.md` | one dated bullet + evidence link |
| how a domain area works (needs > 1 paragraph) | `kb/<domain>/<slug>.md` | frontmatter per `kb/CONVENTIONS.md` |
| an undecided question or roadmap item | `PLAN.md` | `O-n` entry with options |
| a decision that is now binding | `kb/decisions/adr-000N-*.md` | context / decision / consequences |
| scratch collaboration notes | `agent-workspace/` | not authoritative |

Search the KB before adding a node (`rg -l "<topic>" kb`) — duplicate nodes are
worse than a missing one. After any `kb/` edit: update `updated:` and run
`bun run kb:check`.

## 9. Code conventions

- Boundaries: `app/form/**` stays pure (no `vue`, `#app`, `#imports`, `@nuxt/ui`);
  only `app/pdf/**` imports `pdf-lib`/`fontkit`; only `app/storage/idb.ts` opens
  IndexedDB; `kb/` and `research/` are never imported by `app/`.
- Field ids are stable storage keys (`employee.idKind`, `credits.reserveDays`).
  Repeater rows use **bare** keys (`birthDate`, not `children.birthDate`).
- RTL: `dir="rtl"` on `<html>`, logical CSS only (`ms-*`, `pe-*`, not
  `margin-left`); wrap IDs, phones, emails and URLs in `dir="ltr"`.
- Numeric intent is `inputFilter` (`digits`, `decimal`, `phone`) **plus** a
  validator — the filter is not validation.
- Formats: `PascalCase.vue` by area (`Field*`, `Step*`, `Pdf*`); camelCase
  exports; kebab-case files for pure modules.
- Prefer changing existing components over adding variants. The engine is the
  only place a rule may live.

## 10. Git and PRs

- Conventional commits, matching history: `feat(scope): …`, `fix(pdf): …`,
  `polish(ux): …`, `docs: …`, `test: …`, `refactor: …`.
- One concern per commit; generated build output stays ignored.
- Never rewrite pushed history or amend someone else's commit.
- PR body: what changed, why, and **evidence** (commands run + numbers). Link the
  `kb/` node that justifies a legal/UX rule.

## 11. Definition of done

- [ ] The rule lives in the engine, not in a component.
- [ ] Both locales have every new key; no hard-coded Hebrew.
- [ ] The narrowest test that can fail passes (§6); a new condition/validator has
      a unit test.
- [ ] Printed fields have a PDF slot in `app/pdf/fields.ts`; skipped fields are
      listed in `app/pdf/README.md`.
- [ ] New knowledge is in `FINDINGS.md` or `kb/`, and `kb:check` is green.
- [ ] Privacy gate green **if** you touched deps, CSP, fonts, icons or routing.
- [ ] The diff is smaller than your explanation of it.

## 12. When stuck

Three attempts is the limit. Then: re-read the exact error, `rg` the error string
in `FINDINGS.md` and the codebase, and report back with what you tried and the
two options you see. Do not silently widen the change to "make it work".
