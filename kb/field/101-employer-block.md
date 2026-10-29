---
id: field/101-employer-block
title: שדה — חלק א׳ פרטי המעסיק
type: field
status: verified
confidence: verified
updated: 2026-10-29
tags: [form-101, field, employer]
sources: [source/tofes101-form-runner-api, source/tofes101-official-pdf]
related: [flow/form-101-service, product/scope-v1]
up: flow/form-101-service
---

# חלק א׳ — פרטי המעסיק

Five fields that the employee usually does **not** know. In the reference product
they are simply shown as empty inputs, and the employer-template flow can
pre-fill and lock them.

| field | type | notes |
| --- | --- | --- |
| `שם` | text | employer / company name |
| `כתובת` | text | free text, single line in the reference |
| `מספר טלפון` | text | free text |
| `מספר תיק ניכויים` | text | deduction file number — **must start with `9`**, digits, Luhn-checked as if an ID |
| extra emails ×2 | email | used by the email-delivery feature; not needed in v1 |

## Why the deduction file number matters

The employer's ניכויים file (תיק ניכויים) is what the Tax Authority uses to
associate withholdings with an employer. The reference validates it as a 9-digit
number starting with `9` and passing the ID checksum. Verify with
[law/employer-obligations](../law/employer-obligations.md) — employers' file
numbers may not all be 9 digits.

## What we build

- **"אני לא יודע/ת" as a first-class option** for every employer field, because
  the employee genuinely may not know the deduction file number. Choosing it
  leaves the box blank in the PDF with a printed instruction for the employer,
  instead of blocking the user at the last step.
- Pre-fill from a **shared config** when the employer provided one (our
  serverless replacement for template links, see `PLAN.md` O-4): a `.json` file
  or URL that the user opens/imports. Imported employer details are marked
  `locked by employer` and rendered read-only with a "בקש/י מהמעסיק לשנות" note.
- Validate the file number loosely (digits only, 5–9 chars) and show a warning
  only when it clearly cannot be right — a hard Luhn failure on a legitimate
  number would block a real user.

## Accessibility / UX

- Group as "פרטי המעסיק" with a single explainer at the top: "את הפרטים האלה
  בדרך כלל נותן המעסיק. אם אינך יודע/ת — השאר/י ריק וסמן/י 'לא ידוע'."
- Do not put the employer block first if you can avoid it: the reference does,
  and it is the worst possible opening screen (the user must leave the app to
  find a piece of paper). Consider asking it **last**, before the declaration.
