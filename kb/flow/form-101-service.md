---
id: flow/form-101-service
title: שירות מילוי טופס 101 — end-to-end service flow
type: flow
status: verified
confidence: verified
updated: 2026-10-29
tags: [form-101, flow, product, reference]
sources: [source/tofes101-form-runner-api, source/tofes101-official-pdf]
related: [flow/form-101-field-spec, finding/tepez-form-runtime, law/form-101, product/scope-v1]
up: index
---

# The service, as a flow

What the user actually goes through on `tofes101.co.il/forms/itc-101/submit/`,
reconstructed from the live product and its form definition. This is **the
functional contract** our rebuild has to meet (minus emailing).

Legal basis and the meaning of each answer: [law/form-101](../law/form-101.md).
Exhaustive field table: [form-101-field-spec](./form-101-field-spec.md).
Runtime internals: [finding/tepez-form-runtime](../finding/tepez-form-runtime.md).

## 0. Entry and framing

```
tofes101.co.il/forms/itc-101/submit/   (Next.js, SEO page + chrome)
        └─ embeds → forms.tofes101.co.il/f/<formId>   (the actual runner)
```

What the user sees before the first field:

1. **Title block** — "טופס 101 · כרטיס עובד — ובקשה להקלה ולתיאום מס על ידי
   המעסיק · לפי תקנות מס הכנסה (ניכוי ממשכורת ומשכר עבודה), התשנ״ג–1993".
2. **Instructions** — who fills it, when (start of employment + start of every
   tax year), what it is used for, and "declare changes within 7 days".
3. **Year banner** — "הטופס מעודכן לשנת 2026" + the three promises: download a
   *normal, valid* 101 PDF · email it to me and my employer · save a draft.
4. **Disclaimer** — free service by Tepez, funded by ads and (opt-in) commercial
   use of the user's data, not affiliated with the Tax Authority.
5. **Language switch** — a separate *English* form (`/f/659ec5df…`) linked from
   the Hebrew one.

> Our build: same framing minus 4's ad-funded clause and minus 5 (or a real i18n
> later). "Your data never leaves this browser" replaces the disclaimer.

## 1. Screen / state model

```
draft? ──resume──┐
                 ▼
  [ form: one scrolling page, 10 lettered sections + appendix ]
      │  (autosave to local draft as you type)
      │  (validation on blur + on submit; errors do not block moving on)
      ▼
  [ review & outputs: PDF · email · save draft ]
      │
      ▼
  [ done: PDF downloaded / email sent / draft link ]
```

There is **no wizard** in the reference: one long page, numbered sections
א → י, panels/wells, ads interleaved. Progress is implied by scroll position.
`confidence: likely` (inferred from `secType: panel|well`, no tabs config).

For our build this is the main UX decision — see
[ux/ux-principles](../ux/ux-principles.md) and
`decision/adr-0004-form-navigation`.

## 2. The sections, in order

Exact fields and rules: [form-101-field-spec](./form-101-field-spec.md).
Here is what each section *is for* and where it bites.

### שנת המס (tax year) — a chooser, not a field

- Normally locked to the current calendar year.
- **December**: the user may choose current year or next year (people preparing
  for January).
- **January**: may choose previous year or current year.
- Any stored value below the current year is silently bumped up
  (`container.taxYear = max(today.year, stored)`).
- Everything downstream depends on `taxYear`: ages, "age at end of tax year",
  and the `startDate` validator.

### א. פרטי המעסיק — employer block

`שם`, `כתובת`, `טלפון`, `מספר תיק ניכויים` (deduction file number, validated as
a 9-digit ID-like number that **must start with 9**), plus up to two extra
emails. In the *employer template* flow this block is pre-filled and can be
locked (`נעל עריכה של פרטי המעסיק`).

### ב. פרטי העובד/ת — employee block (the long one)

1. `שם פרטי`, `שם משפחה`.
2. **Identity switch**: `תעודת זהות` ↔ `דרכון (עבור אזרח זר)`. The choice
   changes which sub-block renders *and* removes sections: a passport holder
   gets no children section (explicit alert: "חלק זה אינו רלוונטי משום שהינך
   מזוהה עם דרכון זר"), no `תושב ישראל`, no kibbutz questions, no `תאריך עליה`.
3. ID: 9 digits, integer, Luhn check digit. Optional upload of ID card + ספח.
   Passport: country select + number + optional passport scan + `אישור/רשיון
   שהייה בישראל`.
4. `תאריך לידה` — age is derived twice:
   `age` (today-based, month/day aware) and `ageOnTaxYear = taxYear - birthYear`.
   Min/max age are tenant settings (`minEmployeeAge` / `maxEmployeeAge`) and the
   error message interpolates the computed age: *"לפי תאריך הלידה שציינת גילך
   הוא {{age}}. הגיל המינימאלי הינו {{min}}."*
5. `תאריך עליה` (aliyah date) — shown for ID holders, validated (not in the
   future / not absurdly old).
6. Address: `ישוב` (autocomplete, remote), `רחוב` (autocomplete **scoped by the
   chosen city**), `מספר בית`, `מיקוד` (optional).
7. Phones: `נייד` (required unless a landline exists) + optional landline;
   validators are Israeli-mobile specific (must start `05`, digits only).
8. `אימייל` — required by default, optional under a tenant setting.
9. `מין` (male/female — drives gender agreement in copy *and* credit-point
   eligibility), `מצב משפחתי` (single / married / divorced / widowed /
   **separated**), `תושב ישראל`, `חבר קיבוץ/מושב שיתופי`, `הכנסותיי מועברות
   לקיבוץ`, `חבר בקופת חולים` + `שם הקופה` (כללית/מכבי/מאוחדת/לאומית).
   - `פרוד/ה` (separated) additionally requires `אישור פקיד שומה`.
   - The kibbutz questions ask whether income from *this* employer is transferred
     to the kibbutz — a different tax path.

### ג. ילדים — children (repeat rows)

- Hidden entirely for passport holders.
- Each row: `שם`, `מספר זהות` (Luhn), `תאריך לידה`, derived `ageOnTaxYear`,
  `הילד נמצא בחזקתי`, `אני מקבל בגינו קצבת ילדים מהביטוח הלאומי`.
- Section header fixes the scope: children **under 19 during the tax year**.
- Rows are added/removed; the auto-computed count feeds section ח item 7.

### ד. הכנסותיי ממעסיק זה — income from this employer

- `אני מקבל/ת` multi-select: משכורת חודש / משכורת בעד משרה נוספת / משכורת חלקית
  / שכר עבודה (עובד יומי) / קצבה / מלגה.
- Picking "משכורת בעד משרה נוספת" triggers the **tax-coordination warning**
  ("otherwise maximum tax ~48 % is withheld").
- `תאריך תחילת העבודה בשנת המס` — required, and **must fall inside the chosen
  tax year** (validator message names the year).

### ה. הכנסות אחרות — other income

- Binary gate: "אין לי הכנסות אחרות …" ↔ "יש לי הכנסות נוספות".
- If yes: income types, free-text "other" source, and the crucial question
  *"do you already use your credit points and tax brackets against that other
  income?"* — if yes, section ח is **blocked** with an explanation (you cannot
  claim the same credit twice).
- Optional declarations about study-fund / pension contributions from the other
  employer.

### ו. בן/בת הזוג — spouse

- Rendered only when `מצב משפחתי = נשוי/אה`; otherwise a soft alert says the
  section is not relevant (it stays visible as an explanation, not a dead end).
- Name, identity (ID or passport), birth date, aliyah date, **has income?** and
  if yes, the income type (work/allowance/business vs other).
- Spouse "no income" interacts with credit item 5 in section ח.

### ז. שינויים במהלך השנה — changes during the year

- **Intentionally empty.** The printed form has it; the online form says it is
  irrelevant for a computerised form and repeats the 7-day notification duty.

### ח. בקשה לפטור או זיכוי ממס — the 16 credit/exemption items

This is the legal heart of the form. Each item is a checkbox that may open
details + required documents:

| # | item | opens |
| --- | --- | --- |
| 1 | תושב/ת ישראל | mirrors the `ilResident` answer (read-only) |
| 2 | נכה 100 % / עיוור/ת לצמיתות | certificate upload; 2ב monthly disability stipend + certificate |
| 3 | תושב/ת יישוב מזכה | from-date + locality + טופס 1312א |
| 4 | עולה חדש/ה / תושב חוזר/ת | type switch, from-date, oleh certificate **required** / returning-resident certificate **required**, "no income in Israel until" date |
| 5 | בן/בת זוג ללא הכנסות | certificate (disability/blindness for employee and/or spouse) |
| 6 | הורה במשפחה חד־הורית החי בנפרד | — |
| 7 | ילדים בחזקתי (from section ג) | counts per **age band** in the tax year: born this year / 1–2 / 3 / 4–5 / 6–17 / 18 |
| 8 | ילדי (second child-credit block, "toddlers") | same age bands minus 18 |
| 9 | הורה יחיד | — |
| 10 | ילדים שאינם בחזקתי ואני משתתף בכלכלתם | court judgment upload |
| 11 | ילד נכה < 19 עם גמלת ילד נכה מהמל"ל | count + NII certificate **required** |
| 12 | מזונות לבן/בת זוג לשעבר | judgment upload |
| 13 | מלאו לי/לבן זוגי 16–18 בשנת המס | — |
| 14 | חייל/ת משוחרר/ת או שירות לאומי | service start/end dates + discharge certificate |
| 15 | סיום תואר / התמחות / לימודי מקצוע | טופס 119 upload |
| 16 | לוחם/לוחמת מילואים בשנה הקודמת | number of reserve days + IDF eligibility certificate |

Notes:
- Items 7/8 keep **legacy** age bands (6–12 / 13–17 / 1–5) in a collapsible
  "ירד מהטופס" block, purely so old data can be re-opened. We do not need it,
  but we do need a migration story if a user imports an old draft.
- Counts are **derived** from section ג where possible (`age*Checked` mirrors
  `age*Count > 0`), but remain editable — the reference allows a mismatch
  between declared children and counted children. Legal check needed:
  [law/children-credit-points](../law/children-credit-points.md).
- Item 2 carries a warning: if the user did not declare "no other income" in
  section ה, they must get a tax-coordination approval and attach it in ט.

### ט. תיאום מס — tax coordination

- Opt-in checkbox `צירוף/עריכת תיאום מס`.
- Reason radio: (a) no income from start of tax year until this job,
  (b) has additional income **from salary** → repeat rows of
  {employer name, address, deduction file number, income type
  (work/allowance/scholarship/other), monthly income, monthly tax withheld} +
  payslip upload, (c) Tax Authority approval attached.
- This is the part that decides whether the employer can apply a partial
  bracket instead of maximum withholding.

### י. הצהרה — declaration and signature

- Declaration text (verbatim, load-bearing):
  > אני מצהיר/ה כי הפרטים שמסרתי בטופס זה הינם מלאים ונכונים. ידוע לי שהשמטה
  > או מסירת פרטים לא נכונים הינה עבירה על פקודת מס הכנסה.
  > אני מתחייב/ת להודיע למעסיק על כל שינוי שיחול בפרטיי האישיים ובפרטים דלעיל
  > תוך שבוע ימים מתאריך השינוי.
- Signature canvas (mouse/finger), required, and a **date field that only
  appears once a signature exists**.

### נספח — appendix

Empty in the schema; effectively "the documents required by the answers above".
For us this should be a generated checklist + upload slots (or a "bring these
to your employer" list, since v1 has no server to receive files).

### Post-form: privacy consent, then outputs

- `אני מאשר/ת את מדיניות הפרטיות` — required radio, timestamped, with the exact
  accepted wording stored.
- `אני נותן/ת את הסכמתי המפורשת … להעביר את המידע האישי … למפרסמים` —
  required in the reference product, with an A/B-test variant field stored.
  **We must not have this.**
- Outputs (buttons): `render` → download the filled PDF; email to employer and
  to employee; `save` draft (server-side draft link).

## 3. Runtime semantics we must decide on deliberately

| reference behavior | risk | our decision |
| --- | --- | --- |
| `clearIrrelevant: true` wipes answers when a branch closes | silent data loss (e.g. toggle "married" off/on, lose spouse details) | keep answers, hide them; show "you have hidden answers" affordance. `decision/adr-0005-relevance` |
| validation only blocks submit, not navigation | user reaches the end with 8 errors and must scroll back | error summary at top + per-step "fix" links + focus first error |
| dates are three separate string mirrors for the PDF | duplication bug surface | single date value; format only at render |
| city/street via remote autocomplete | requires network, privacy leak, street data licensing | local dataset + free-text fallback; see open question O-2 |
| "email the form" as the delivery mechanism | server-side personal data | v1: local PDF + print + JSON export; user sends it themselves |
| draft stored server-side behind a link | the link *is* the data | local IndexedDB draft + optional encrypted file export |
| English version is a separate form | drift between the two | single schema, i18n later |

## 4. Minimum viable parity list (functional contract)

1. Choose/confirm tax year with the Dec/Jan rules.
2. Employer block (manual or pre-filled and lockable).
3. Employee block incl. ID/passport branch, age checks, address, contacts.
4. Children repeater, hidden for passport holders.
5. Income from this employer + start date inside the tax year.
6. Other-income gate that can block the credit section.
7. Spouse conditional on marital status.
8. All 16 credit items with their required documents/conditions.
9. Tax-coordination block with repeat rows.
10. Declaration + signature + date.
11. Errors that name the problem, in Hebrew, next to the field **and** in a
    summary.
12. An output the employer will accept: filled official-looking 101 + the
    declaration, printable A4, plus a machine-readable export.
13. Resume later, on this device.
