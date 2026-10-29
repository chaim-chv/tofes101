---
id: law/form-101-section-map
title: מפת סעיפי טופס 101 — Section-by-section map
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [law, form-101, sections, fields, mandatory]
sources: [source/tofes101-official-pdf, source/taxes-electronic-101-rules-2026]
related: [law/form-101, law/form-101-official-pdf, law/declaration-and-signature, law/credit-points]
up: law/form-101
---

# מפת סעיפים — one row per official section/item

Source of labels and order: the 2-page form 0101/130 (11.2025)
([[source/tofes101-official-pdf]]). Source of “חובה/רשות” for the electronic
version: נספח א of the 12.1.2026 circular
([[source/taxes-electronic-101-rules-2026]]). Where the paper form and the
electronic matrix differ, the matrix is the 2026 implementation rule.

Legend: **M** = mandatory, **O** = optional, **C** = conditional (mandatory only
when its trigger is true).

## Page 1 — sections א–ז

| § | Label (Hebrew) | Who | Req. | Fields / allowed values | Legal / logic notes |
| --- | --- | --- | --- | --- | --- |
| — | שנת המס | system | M | 4-digit tax year | Calendar year; 2025 or 2026 in this KB. |
| א | פרטי המעסיק | employer | M | name, address, phone, deduction-file no. (מספר תיק ניכויים) | Auto-filled by payroll; deduction file is 9 digits, normally starts with 9; **do not** run the ID check-digit on it without confirming its own format. |
| ב | פרטי העובד/ת | employee | M | “has Israeli ID?” yes/no; ID no. **or** passport no.; surname; first name; birth date; aliyah date (O); private address (street/neighbourhood, house no., city, postcode O); e-mail (O); phone + mobile (at least one required; the matrix is ambiguous — implement “at least one”); gender (male/female); marital status; Israeli resident yes/no; kibbutz member (no / yes-transferred / yes-not-transferred); health-fund member (no / yes + fund name) | ID copy incl. ספח must be attached at first filing or after a change; no ID → passport + visa/residence permit. Gender drives the 0.5 woman credit. “Israeli resident = no” suppresses the 2.25 resident points. Kibbutz member changes who bears the tax. |
| ג | פרטי ילדיי שטרם מלאו להם 19 שנה | employee | O | per child: name, ID, birth date, col. 1 “in my custody”, col. 2 “I receive NII child allowance for him/her” | Row is all-or-nothing: if any of name/ID/DOB is entered, all three are required; col. 1 only after the row is complete; col. 2 only after col. 1. Children 19+ are not listed. |
| ד | פרטים על הכנסותיי ממעסיק זה | employee | M | one of (1) מלגה, (2) משכורת חודש, (3) משכורת בעד משרה נוספת, (4) משכורת חלקית, (5) שכר עבודה (עובד יומי), (6) קצבה; plus “תאריך תחילה העבודה בשנת המס” | One of 1–4 **and/or** one or more of 5–6; at least one box. “Second job” (3) forces max withholding unless coordination. “Partial” (4) and “daily” (5) also default to max unless it is the only income. Definitions in the form’s explanatory notes (1)–(6). |
| ה | פרטים על הכנסות אחרות | employee | C | either “אין לי הכנסות אחרות ממשכורת, מקצבה וממלגה” **or** “יש לי הכנסות אחרות” + types (1–6) + one of item 7/8 + optional 9/10 | If “no other income” is ticked, items 2–10 must be disabled. If “other income” is ticked, at least one type and exactly one of 7/8. Item 7 = claim credits here; item 8 = credits used elsewhere ⇒ this employer withholds max. 9/10 control whether training-fund/pension contributions of the *other* employer are added to this payroll. |
| ו | פרטים על בן/בת הזוג | employee | C | “spouse has ID?” yes/no; ID or passport; surname; first name; birth date; aliyah date (O); spouse income: “none” **or** “income from work/pension/business” and/or “other income” | Mandatory only if marital status = נשוי/אה; otherwise the whole block is disabled. The “no income” answer is the trigger for the s. 37 credit (but the legal conditions are stricter — see [[law/spouse-not-working]]). |
| ז | שינויים במהלך השנה | employee | O | date of change, date of notice, employee signature — up to 3 rows | Used when a change occurs after the annual form; regulation 2(d) requires notice within 7 days. The electronic version instead creates a new versioned form (§16 of the matrix). |

## Page 2 — sections ח–י

### ח. אני מבקש/ת פטור או זיכוי ממס מהסיבות הבאות

The section is available only if the employee has an Israeli ID (the electronic
matrix hides it for passport-only employees). Each item is a checkbox; most open a
sub-question and a document. Numbers below are the **official item numbers**.

| # | Label (Hebrew) | Req. | Opens / values | Legal hook | Document |
| --- | --- | --- | --- | --- | --- |
| 1 | אני תושב/ת ישראל | O | read-only mirror of ב “תושב ישראל = כן” | s. 34 + 36 → 2.25 points | — |
| 2א | אני נכה 100% / עיוור/ת לצמיתות | O | certificate details | s. 9(5) **exemption** (not a point) | approval from MOD / Treasury / assessor / blind certificate issued after 1.1.1994 |
| 2ב | בנוסף, אני מקבל תגמול חודשי לפי חוק הנכים / נפגעי פעולות איבה | C | only if 2א; amount/approval | s. 9(5)(א1) higher ceiling | approval of the monthly stipend |
| 3 | אני תושב/ת קבע/ה בישוב מזכה | O | from-date + locality name; “no other center of life” | s. 11 (or s. 11 of the חוק אס״ח); rates/ceilings are locality-specific — do not hard-code them | form 1312א from the local authority |
| 4 | אני עולה חדש/ה | O | from-date (aliyah); optional “no income in Israel from start of year until …” | s. 35; 2026 temporary exemption law | תעודת עולה (mandatory) |
| 5 | בגין בן/בת זוגי המתגורר/ת עימי ואין לו/לה הכנסות בשנת המס | O | checkbox only | s. 37 — **only** if employee/spouse at retirement age or blind/disabled, and spouse income ≤ 25,410 ₪ (2026) | disability/blind approval for employee or spouse |
| 6 | אני הורה במשפחה חד הורית החי בנפרד | O | checkbox; requires item 7 | s. 40(b)(1)–(2): +1 point | — |
| 7 | בגין ילדי שבחזקתי המפורטים בחלק ג | O | six counters: born this year / 1–2 / 3 / 4–5 / 6–17 / 18 | mother/custodial schedule: 2.5 / 4.5 / 3.5 / 2.5 / 2 / 0.5 | — |
| 8 | בגין ילדיי המפורטים בחלק ג | O | five counters: born / 1–2 / 3 / 4–5 / 6–17 (**no 18**) | father/non-custodial schedule: 2.5 / 4.5 / 3.5 / 2.5 / 1 | — |
| 9 | אני הורה יחיד לילדי שבחזקתי | O | requires 7 and/or 8 | s. 40(b)(1ב): +1 point where the other parent is dead/unknown | — |
| 10 | בגין ילדי שאינם בחזקתי ואני משתתף בכלכלתם | O | checkbox; requires children not in custody | s. 40(b)(2): 1 point or part, by share of costs | divorce judgment / assessor separation approval + support judgment |
| 11 | אני הורה לילדים עם מוגבלות שטרם מלאו להם 19, בגינם אני מקבל גמלת ילד נכה | O | count of children | s. 45: 2 points per child | current-year NII disability-child approval |
| 12 | בגין מזונות לבן/בת זוגי לשעבר | O | checkbox; only if married now | s. 40א: 1 point | divorce judgment / support judgment |
| 13 | מלאו לי או לבן/בת זוגי 16 שנים וטרם מלאו 18 בשנת המס | O | checkbox | s. 40ב: 1 point | — (employer verifies birth year) |
| 14 | אני חייל/ת משוחרר/ת / שירתתי בשירות לאומי | O | service start + end dates | s. 39א: 1/6 or 1/12 point per month × 36 | discharge / national-service certificate |
| 15 | בגין סיום לימודים לתואר אקדמי, התמחות או לימודי מקצוע | O | checkbox | ss. 40ג–40ה: 1 point (BA, ≤3 yrs) or 0.5 (MA, ≤2 yrs); profession 1 (≤3 yrs) | declaration on **form 119** |
| 16 | שירתתי כלוחם/לוחמת מילואים סה״כ ___ בשנת המס הקודמת | O | number of days | s. 39ב (temporary 2026–27): 0.5 / 0.75 / 1, +0.25 per 5 days, max 4 | IDF combat-reserve approval |

### ט. אני מבקש/ת תיאום מס מהסיבות הבאות

Exactly one of three (or none):

| # | Label | Opens | Meaning |
| --- | --- | --- | --- |
| 1 | לא הייתה לי הכנסה מתחילת שנת המס הנוכחית עד לתחילת עבודתי אצל מעסיק זה | proof (border-police approval, sick-leave approval, etc.) | lets this employer apply the full monthly credit from day one; without proof → assessor |
| 2 | יש לי הכנסות נוספות ממשכורת כמפורט להלן | repeat table: employer name, address, deduction-file no., income type (work/pension/scholarship/other), monthly income, tax withheld; payslip per row | formal coordination data |
| 3 | פקיד השומה אישר תיאום לפי אישור מצורף | attach approval | assessor-approved allocation |

### י. הצהרה

| Field | Req. | Rule |
| --- | --- | --- |
| תאריך | M | date of signature (system-generated in the electronic version) |
| חתימת המבקש/ת | M | employee signs / ticks the declaration; the text says the details are complete and correct, that omission/false details are an offence under the Income Tax Ordinance, and that the employee will notify the employer of any change **within 7 days** |

## Cross-section dependencies (implement as a graph, not as 10 screens)

1. `ב.תושב ישראל = לא` → item 1 disabled; no 2.25 resident points; item 2/3/4 etc. may still be irrelevant → foreign-worker track.
2. `ב.מצב משפחתי ≠ נשוי` → section ו disabled; item 5 disabled; item 12 disabled.
3. `ב.מין = נקבה` → 0.5 woman point; item 7 is the default child track; item 8 is for fathers/non-custodial parents.
4. `ג` empty → items 6–11 and 13 (child-related) have no basis; still allow item 9 only if there is a child row.
5. `ה.יש לי הכנסות אחרות` + `ה.8` (credits elsewhere) → this employer withholds at the maximum rate; the official matrix does **not** globally hide section ח. (The competitor hides it; do not copy that gate.) If the employee also claims the disability exemption (item 2), the form sends them to the assessor for coordination.
6. `ד.3` (second job) → coordination required or max withholding.
7. `ח.2א` → 2ב allowed; otherwise disabled.
8. `ח.4` → aliyah date mandatory; `תעודת עולה` mandatory.
9. `ח.7` → at least one counter; `ח.9` requires 7 and/or 8; `ח.6` requires 7.
10. `ח.11` → count mandatory; NII approval mandatory.

## What is *not* on the form

- No place to enter the computed number of credit points — the employer’s payroll
  computes them. The form only collects the facts and claims.
- No employer declaration of truth in the paper form; the employer fills part א and
  keeps the form. The approved electronic version adds an employer e-signature.
- No consent-to-privacy checkbox. The signature is a truth declaration.
- No bank-account, pension-fund or health-fund *policy* details (only health-fund
  membership yes/no + name).

## Sources

- [[source/tofes101-official-pdf]]
- [[source/taxes-electronic-101-rules-2026]]

Every normative statement above is based on these nodes; year-specific values are stamped in the text.
