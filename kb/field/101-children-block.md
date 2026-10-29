---
id: field/101-children-block
title: שדה — חלק ג׳ ילדים (repeat rows)
type: field
status: verified
confidence: verified
updated: 2026-10-29
tags: [form-101, field, children, repeat]
sources: [source/tofes101-form-runner-api, source/tofes101-official-pdf]
related: [flow/form-101-service, law/children-credit-points]
up: flow/form-101-service
---

# חלק ג׳ — ילדים

The only repeating block in the employee's part, and the input to the two
children-credit items in section ח.

## Scope line (part of the section title)

> ג. פרטים על ילדיי שבשנת המס טרם מלאו להם 19 שנה (עפ"י ספח תעודת זהות)

So: **under 19 during the tax year**, regardless of custody — custody is a
per-row question.

## Row shape (reference)

| field | type | required | notes |
| --- | --- | --- | --- |
| `שם` | text | yes | single field, no family name |
| `מספר זהות` | text | yes | same Luhn validation as the employee |
| `תאריך לידה` | date | yes | must be a valid child birth date |
| `ageOnTaxYear` | computed | — | `taxYear - birthYear` (note: **not** birthday-aware, unlike the employee's `age`) |
| `הילד נמצא בחזקתי` | boolean | no | custody |
| `אני מקבל/ת בגינו/ה קצבת ילדים מביטוח לאומי` | boolean | no | NII child allowance |

- Section is **removed entirely** for passport holders, with an alert explaining why.
- Rows are added/removed freely; the count drives credit items 7 and 8.

## What we build

- A repeater that never loses a row: "הוספת ילד/ה" appends and focuses the new
  name field; row delete asks once, and undo is available (toast).
- Derived helper per row: "בן/בת 7 בשנת המס 2026" so the user can see that the
  system understood the birth date — this is where the credit band comes from.
- **Cross-check with section ח**: if the user declares 3 children in ג but ticks
  "2" in the age bands, show a non-blocking warning with a "תקן/י לפי הילדים"
  action. (The reference allows the mismatch silently.)
- Custody default: unchecked, and the explanation "ילד/ה שאינו בחזקתך מזכה
  בנקודת זיכוי רק אם אתה/את משתתף/ת בכלכלתו ובצירוף פסק דין" (link to law).
- Child allowance from NII: a "לא יודע/ת" option that maps to *not declared* and
  explains where to check (the NII personal area) — never guess.

## Validation traps

- Two children with the same ID → block with a friendly duplicate message.
- Child born after the tax year → hard error ("נולד/ה ב-2027, לא ניתן לכלול
  בשנת המס 2026").
- Child aged 19+ during the tax year → offer to remove with an explanation; do
  not silently drop the row.
- ID of a child can be all zeros for a newborn who has no ID yet — the reference's
  Luhn-only check actually *accepts* `000000000`. Decide explicitly and document
  it ([law/id-number-validation](../law/id-number-validation.md)).

## Accessibility

Repeat rows must be a list with an accessible name per row
(`<fieldset><legend>ילד/ה 1</legend>`), plus a live region announcing
"נוסף שדה לילד/ה 2". Deleting a row must move focus to the next row or to the
"add" button — never to `<body>`.

## Data shape

```ts
type Child = {
  id: string;           // uuid, local
  name: string;
  identity: { kind: "id"; value: string } | { kind: "none" }; // newborns
  birthDate: string;    // ISO yyyy-mm-dd
  inCustody: boolean;
  receivesChildAllowance: boolean | null;
  deletedAt?: string;   // soft delete for undo
};
```
