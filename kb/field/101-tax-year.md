---
id: field/101-tax-year
title: שדה — שנת המס (tax year selector)
type: field
status: verified
confidence: verified
updated: 2026-10-29
tags: [form-101, field, tax-year]
sources: [source/tofes101-form-runner-api]
related: [flow/form-101-service, law/form-101]
up: flow/form-101-service
---

# שנת המס

The first answer in the form, and the one every other answer depends on: ages,
"age at end of tax year", the `start date within tax year` rule, and which
current-year thresholds apply.

## Behaviour in the reference

| when | control | choices |
| --- | --- | --- |
| any month except December/January | plain text input, effectively fixed | current calendar year |
| December | radio | current year, next year |
| January | radio | previous year, current year |

Plus a self-healing equation:

```js
container.taxYear = (container.taxYear == null || container.taxYear < today.getUTCFullYear())
  ? today.getUTCFullYear()
  : container.taxYear
```

i.e. a stale draft is silently pushed to the current year.

## What we build

- Data shape: `taxYear: number` (never a string), plus `rulesVersion` so we know
  which year's thresholds/credit values were used to render help text.
- Default: current year, **visible as a chip** at the top of the form, not a field
  buried in the flow — the user must be able to see and change it in one click.
- December/January rule kept (it is genuinely useful), but implemented as an
  explicit question: *"הטופס לשנת 2026 — מכינים כבר את 2027?"*
- ❗ A stale draft must **not** be silently re-stamped. Show: "הטיוטה שלך היא
  לשנת 2025. לעבור ל-2026?" with the consequence spelled out (values that are
  year-dependent will be recalculated; the declaration and signature must be
  re-signed).
- Year-dependent content lives in one data file (`app/data/rules/<year>.json`) so
  adding a year is data, not code. See [law/form-101](../law/form-101.md).

## Accessibility notes

- It is a group of two radios → `<fieldset><legend>שנת המס</legend>`, not a
  segmented control with no semantics.
- Announcing a year change is a *state* change: use a polite live region to say
  "עברת לשנת המס 2026 — חלק מההסברים עודכנו".
- Never auto-advance the flow on selection (WCAG 3.2.2).

## Edge cases

- 1 January, 00:30 — user's clock vs Israel time. Use `Asia/Jerusalem`, not UTC,
  for "what year is it". (The reference uses `getUTCMonth()`, which is wrong for
  the first hours of 1 January and the last hours of 31 December in Israel.)
- User starts in December for next year, then finishes in January: the draft's
  year is now the current year — do not re-ask, confirm.
- Immigrant arriving mid-year, or an employee whose employment started in the
  previous year: the tax year is still the calendar year of the employment, not
  the year they are filling the form.
