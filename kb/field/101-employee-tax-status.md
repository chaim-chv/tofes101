---
id: field/101-employee-tax-status
title: שדה — מעמד מס של העובד (תושבות, מצב משפחתי, קופת חולים, קיבוץ)
type: field
status: verified
confidence: verified
updated: 2026-10-29
tags: [form-101, field, residency, marital-status, health-fund]
sources: [source/tofes101-form-runner-api, source/tofes101-official-pdf]
related: [flow/form-101-service, law/form-101]
up: flow/form-101-service
---

# מעמד המס של העובד/ת

Four small questions in section ב that each change money:

| question | values | why it matters |
| --- | --- | --- |
| `מין` | זכר / נקבה | gender-agreement in copy; female credit point; eligibility rules that are sex-dependent |
| `מצב משפחתי` | רווק/ה · נשוי/אה · גרוש/ה · אלמן/ה · **פרוד/ה** | opens the spouse section; changes credit points and the single-parent rules |
| `תושב ישראל` | כן / לא | residence-based credit points; the whole withholding basis |
| `חבר קיבוץ / מושב שיתופי` | כן / לא | kibbutz members have a different income-attribution path |
| `הכנסותיי ממעסיק זה מועברות לקיבוץ` | כן / לא (only if kibbutz member) | decides whether this employer withholds at all |
| `חבר בקופת חולים` + `שם הקופה` | כן/לא → כללית · מכבי · מאוחדת · לאומית | health-tax / kupat holim deduction; printed on the card |

A sixth, independent choice: `פרוד/ה` (separated) additionally **requires**
`אישור פקיד שומה` — the form enforces it by showing a file field.

## What we build

- Ask `מין` **after** explaining why it is asked ("נדרש לחישוב נקודות זיכוי
  ולהסכמי הלשון בטופס"), and provide `מעדיף/ה לא לענות` **only if** the law
  allows an alternative — otherwise do not offer a dead option. (Open question,
  see [law/form-101](../law/form-101.md).)
- `מצב משפחתי` must explain the `פרוד/ה` case in-line ("פרוד/ה פירושו פרוד/ה
  בהסכם או בהחלטת בית דין, ולא בהפרדה לא-רשמית"), because choosing it adds a
  document requirement. This is the #1 trap in the whole form.
- Kibbutz questions: conditional sub-flow with a one-sentence explainer, not two
  unexplained yes/no radios in a row.
- Health fund: a 4-way segmented radio with the fund names, `לא חבר/ה` as a
  distinct value — not an empty choice.

## Ordering

The reference order is `מין` → `מצב משפחתי` → `תושב ישראל` → kibbutz →
health fund, all in one grid row. In our flow, group them as
**"מעמד אישי"** (sex, marital status, children trigger) and **"מעמד מול
המדינה"** (residency, kibbutz, health fund), each 3 questions max.

## Accessibility

Each group = `fieldset` + `legend`. Do not implement as a `<select>`: radio groups
are faster keyboard-wise (arrows) and always visible, which matters for a
low-confidence user who needs to see the options to know they exist.

## Dependencies

- `מצב משפחתי = נשוי/אה` → section ו (spouse) becomes real.
- `מצב משפחתי ≠ נשוי/אה` → section ו shows a *soft* "not relevant" panel instead
  of vanishing (the reference shows an alert — keep that idea).
- `תושב ישראל = לא` → residence credit point (item 1) must be off and help text
  must explain the consequence.
