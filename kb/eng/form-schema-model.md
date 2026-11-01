---
id: eng/form-schema-model
title: Form schema model — sections, fields, conditions, validation, calculation
type: concept
status: verified
confidence: verified
updated: 2026-11-01
tags: [schema, form-model, validation, computation, form-101]
sources: [source/tofes101-form-runner-api]
related: [flow/form-101-field-spec, eng/architecture, eng/storage-draft, eng/pdf-generation]
up: eng/architecture
---

# Form schema model

The form is **data + typed functions**, not a JSON of JavaScript-expression
strings. The reference implementation stores `visibleWhen` as strings evaluated
at runtime; we do not copy that (CSP, XSS, testability). This node defines the
runtime model the implementation must follow.

## 1. Source of truth and dependency

The field inventory comes from the reference extraction, already in the repo:

| Artifact | What it is |
| --- | --- |
| `research/raw/form/tree.json` | 588 nodes, **160 real fields**, extracted from the reference runner |
| `kb/flow/form-101-schema.json` | machine-readable section/field spec (same 160) |
| `kb/flow/form-101-field-spec.md` | human-readable table with types, required, `visibleWhen`, validators |

> The brief referenced `research/raw/form-tree.json`; the actual file is
> `research/raw/form/tree.json` (plus the generated spec above). No
> `form-tree.json` exists — use these.

Section inventory (from the generated schema):

| Section | Letter | Fields | Dominant types |
| --- | --- | --- | --- |
| `taxYearWrap` | — | 3 | input/radio |
| `employer` | א | 6 | input |
| `employee` | ב | 37 | input, radio, file, select, date |
| `childrenWrapper` | ג | 7 | input, date, bool |
| `thisIncome` | ד | 3 | checkbox, date, input |
| `otherIncomes` | ה | 5 | radio, checkbox, input |
| `spouse` | ו | 15 | input, radio, select, date, checkbox |
| `changesWrapper` | ז | 0 | (render-only) |
| `taxCreditRequest` | ח | **70** | bool (33), file (12), date, select, input |
| `taxCoordinationRequest` | ט | 12 | radio, file, input, bool |
| `_confirmation` | י | 2 | sign, date |
| `appendix` | — | 0 | (render-only) |

The 70-field credit section is why the schema needs **steps** independent of
sections: a section can span several screens.

## 2. Types

```ts
// app/domain/form/types.ts
export type AnswerValue = string | number | boolean | null | string[]

export type FieldKind =
  | 'text' | 'id' | 'phone' | 'email' | 'number' | 'money' | 'date'
  | 'select' | 'radio' | 'checkbox' | 'bool' | 'file' | 'signature'

export interface Option { value: string; labelKey: string }

export interface ValidatorRef {
  id: 'required' | 'digits' | 'integer' | 'id-luhn' | 'il-phone' | 'email'
    | 'minAge' | 'maxAge' | 'date-not-future' | 'date-after' | 'maxLength'
    | 'custom'
  params?: Record<string, unknown>
  messageKey?: string
}

export interface FieldDef {
  path: string                  // stable: 'employee/nameRow/firstName'
  kind: FieldKind
  labelKey: string
  helpKey?: string
  required?: boolean
  requiredWhen?: (c: Ctx) => boolean
  visibleWhen?: (c: Ctx) => boolean
  clearWhenHidden?: boolean     // default false: keep the answer
  validators?: ValidatorRef[]
  options?: Option[] | ((c: Ctx) => Option[])
  computed?: { deps: string[]; fn: (c: Ctx) => AnswerValue }
  autocomplete?: string
  inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'decimal'
  maxLength?: number
  pii?: 'none' | 'name' | 'id' | 'contact' | 'income' | 'health'
  printable?: boolean           // is there a PDF box for it?
  repeat?: { group: string; index: number } // 'children.0.firstName'
}

export interface SectionDef {
  id: string                    // 'employee'
  letter?: string               // 'ב'
  titleKey: string
  fields: FieldDef[]
  validateSection?: (c: Ctx) => ValidationIssue[]  // cross-field rules
}

export interface StepDef {
  id: string                    // 'personal'
  titleKey: string
  sections: string[]            // section ids, in order
  fieldPaths: string[]          // computed at build: visible fields for progress
}
```

`Ctx` is a read-only view over answers + derived values:

```ts
interface Ctx {
  get(path: string): AnswerValue
  num(path: string): number | null
  date(path: string): Date | null
  age(path: string): number | null
  formYear: number
  today: Date                  // injectable for tests
}
```

## 3. Why functions, not expression strings

- No `eval`/`new Function` → a strict CSP without `unsafe-eval`.
- Type-checked conditions; a renamed path fails at build time.
- Unit-testable with a plain object context; no runtime interpreter.
- Tree-shakable: unused conditions disappear.
- The generated JSON spec is still used for review/diffing; a codegen step can
  turn it into an initial `schema.ts`, but the checked-in schema is code.

Cost: non-developers cannot edit conditions. Accepted for v1 (the law/UX tracks
review the schema through tests and the field spec).

## 4. Visibility and requiredness

Two functions per field, both pure:

```ts
visibleWhen: (c) => c.get('employee/identity/type') === 'passport'
requiredWhen: (c) => c.get('spouse/spouseWrapper/miscRow/maritalStatus') === 'married'
```

Rules:

- Evaluate in the field's step only (no global recompute on each keystroke).
- Hidden fields: excluded from validation and from the PDF, but their answers are
  **kept** by default (user toggles a passport back and forth without retyping).
  `clearWhenHidden: true` is opt-in for sensitive/irrelevant branches.
- A field that becomes required after being hidden must surface in the error
  summary, not silently block submit.
- Dependencies are explicit in code via `c.get(...)`; a build-time linter can
  extract them, but v1 can recompute a step on any answer change in that step.
  With 160 fields and ~20 visible per step, this is microseconds.

Real examples from the spec:

| Field | Condition |
| --- | --- |
| `employee/identity/passportRow/passportNum` | `identity.type === 'passport'` |
| `employee/residencePermit` | `identity.type === 'passport'` |
| `employee/datesRow/dateOfAliyah` | `identity.type !== 'passport'` |
| `spouse/.../idRow/passportCountry` | `container.type === 'passport'` |
| `taxCreditRequest/.../monthlyCompensationCertificate` | `monthlyCompensation` is true |
| `taxCoordinationRequest/.../noPreviousIncomesCertificate` | `type === 'no-previous-incomes'` |

## 5. Validation

- Field validators are **declarative refs** into a registry
  (`app/domain/form/validate.ts`); each returns an error code or `null`.
- `required` + `requiredWhen` are evaluated first; empty optional fields skip the
  rest.
- Cross-field rules live on the section (`validateSection`): date ordering
  (aliyah ≥ birth, birth ≤ today), spouse income vs spouse-not-working, children
  ages vs tax year, tax coordination main/second employer.
- Messages are keys: `form.<section>.<field>.error.<code>`; fallback
  `error.<code>`. Hebrew and English catalogs must both define them (unit test).
- Validation timing (UX-owned): on blur, on step change, on submit; never on the
  first keystroke. Errors do not block moving between steps; they block output.
- Error summary at the top of review with links + focus management.

Validators seen in the reference spec that we must implement: digits only,
integer, Israeli ID check digit (Luhn), IL phone regex, date not future, date
after another field, age min/max (16–120 default, settings override), max length,
plus section rules.

## 6. Computations

```ts
computed: {
  deps: ['employee/datesRow/dateOfBirth'],
  fn: (c) => ageAt(c.date('employee/datesRow/dateOfBirth'), endOfTaxYear(c.formYear))
}
```

- Computed fields are **not persisted as answers**; they are derived on read and
  shown read-only. (Persisting them creates stale values after a rule change.)
- Build a dependency graph at module load; topological sort; detect cycles in dev.
- Recompute only when a dependency changes; memoize per (path, answer revision).
- `today` is injected so tests can freeze the tax year; never call `new Date()`
  inside a formula.
- Official-form derived values: age, age at end of tax year, number of months,
  totals for section ד/ה. The **credit points calculation is out of scope for
  v1** (the form asks for declarations; the employer/payroll calculates), but if
  added it must live in `app/domain/rules/2026` with sources.

## 7. Repeat groups

Children and "other incomes" are repeated rows. Model:

- A group has `min`, `max`, a row template of fields, and a stable group key.
- Answers are stored **flat with an index**: `children.0/firstName`,
  `children.0/idNum`, `children.1/...`.
- The UI renders rows in order; "add row" appends the next index; "delete row"
  removes it and **reindexes** (v1). Because output order is what matters, this
  is acceptable; if we later need stable identity, add `meta.rowIds`.
- Validation walks existing rows only; empty trailing rows are ignored.
- The PDF map is per row slot (the official form has a fixed number of rows);
  if the user has more rows than the form, print an appendix page (documented in
  [eng/pdf-generation](pdf-generation.md)).

## 8. Steps vs sections

- `StepDef` groups sections/fields for the wizard (9 steps: 8 decisions +
  documents, per [ux/form-101-screen-map](../ux/form-101-screen-map.md)).
- `taxCreditRequest` (70 fields) is split across 2–3 steps by item groups
  (1–5, 6–10, 11–16 + attachments).
- A field belongs to exactly one step; the schema build asserts this.
- Steps are **state**, not routes (PWA/deep-link decision), so the step id is
  stored in `draft.data.meta.lastStep`.

## 9. Tax year

```ts
export const form2026 = defineFormSchema({
  id: 'form-101',
  year: 2026,
  schemaVersion: 1,
  steps: [...],
  sections: [...]
})
```

- Year-specific numbers live in `app/data/rules/2026.json` (credit point value,
  age limits, thresholds); the schema references keys.
- The official PDF is year-stamped too (`0101/130` 11.2025 for tax year 2026).
- A 2027 form is a new schema + new PDF map + new rules file; the draft envelope
  records `formYear` and refuses cross-year import.

## 10. Invariants (build-time + tests)

1. Unique `path` across all fields.
2. Every field belongs to exactly one step.
3. Every `visibleWhen`/`requiredWhen` dependency path exists.
4. Every `computed.deps` path exists; graph is acyclic.
5. Every `labelKey`/`helpKey`/error key exists in `app/locales/he.ts` and `en.ts`.
6. Every `printable` field has an entry in `field-map.ts`; every map entry has a
   field.
7. Every `option.value` is unique within a field.
8. `repeat` indexes never collide; group max ≤ official form capacity (or an
   appendix rule exists).
9. Migrations cover every released schema version.
