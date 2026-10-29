---
id: law/edge-cases
title: מקרי קצה — Form 101 edge cases and how to handle them
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [law, form-101, edge-cases, implementation]
sources: [source/wikisource-payroll-withholding-regulations, source/taxes-electronic-101-rules-2026, source/nevo-income-tax-ordinance, source/govil-pensioner-101-exemption]
related: [law/form-101, law/who-must-file, law/tax-coordination, law/children-details, law/privacy-consent]
up: law/form-101
---

# Edge cases

Each case: **what the law says → what the app should do → confidence**.

## 1. Employee under 18

- **Law:** a 16–17-year-old is an employee; the form includes item 13 (1 youth
  point, s. 40ב). Employment under 15 is restricted by the Youth Labour Law; no
  parent signature requirement was found for the 101.
- **App:** allow the form; compute the youth point from the birth date; add the 0.5
  woman point if female; do not require a guardian signature; show the minor-
  employment warning.
- **Confidence:** verified for the tax point; `likely` for the signature practice.

## 2. Foreign worker

- **Law:** regulation 2(a) excludes foreign workers from the 101 duty; withholding
  is per תוספת ג׳ (foreign resident) and the foreign-worker point regulations
  (2.25 nursing / 1 other / +0.5 women; 2A5 asylum seekers 0). The form supports a
  passport + visa identity.
- **App:** offer a “foreign worker” path; hide the 2.25 resident/child/credit
  sections if there is no Israeli ID; show the sector-based points; require the
  visa/residence permit; do not apply the resident base.
- **Confidence:** verified for the exclusion; `likely` for the exact current point
  table.

## 3. Multiple employers / second job

- **Law:** a separate 101 per employer; only one payroll should use the credits;
  the second employer withholds at the maximum rate unless coordination allocates.
- **App:** ask “do you have another employer?”; tick ד item 3 for the second job;
  section ה item 8 if the credits are used elsewhere; link [[law/tax-coordination]].
- **Confidence:** verified.

## 4. Mid-year hire

- **Law:** form due within 7 days of start or first pay; if the employee had no
  income since 1 January, section ט item 1 lets this employer apply the full
  credit from day one; otherwise the annual return/coordination reconciles.
- **App:** ask for the start date and “did you have income in Israel since
  1 January?”; if no, offer item 1 with proof; if yes, warn about max withholding
  and offer coordination.
- **Confidence:** verified.

## 5. Mid-year change (marriage, birth, divorce, death, new job)

- **Law:** notify within 7 days (reg. 2(d)); the payroll adjusts from the change;
  part-year marital status is prorated by months; a birth-year child credit is
  annual (not prorated by month).
- **App:** create a new version, not an edit; collect the change date; show the
  months; recompute; keep the old version.
- **Confidence:** verified.

## 6. Employee died

- **Law:** the 101 is personal and ends with the employee. Payments to heirs
  (severance/pension) are withheld under regulation 6(a): the lower of 40% or the
  rate that would have applied to the employee. Form 106 is issued to the estate/
  heirs.
- **App:** do not try to “complete” the deceased’s 101; route to payroll/legal; show
  the 40% rule for heirs’ payments.
- **Confidence:** verified for reg. 6(a); `likely` for the exact form-106 process.

## 7. Correction / amendment

- **Law:** a change must be declared within 7 days; a new form/version is the
  correct mechanism; the annual return corrects the year.
- **App:** “edit” creates a new version with a new date; keep the old; recompute;
  never overwrite a signed PDF.
- **Confidence:** verified (2026 circular requires versioning).

## 8. No Israeli ID

- **Law:** the form uses passport + visa/residence permit; the 2026 electronic
  matrix hides the Israeli-resident/child/credit sections; no 2.25 resident points.
- **App:** identity type = passport; require passport + visa; hide the ID-only
  sections; route unusual cases to the assessor.
- **Confidence:** verified.

## 9. “פרוד/ה” without assessor approval

- **Law:** the form requires an assessor approval for the separated status; the
  electronic matrix cannot select it without the approval.
- **App:** disable the option until the approval is uploaded; explain that
  “separated” is not the same as “married but living apart” for tax.
- **Confidence:** verified.

## 10. Pensioner 70+

- **Law:** administrative exemption from the annual 101 if no change/no other
  income/no special reliefs; other pensioner tracks (every 5 years, survivors,
  100% nursing, disability every 2 years).
- **App:** show a “may be exempt” message with the conditions; still allow the form
  if the pensioner wants to declare a change/credit; do not auto-skip.
- **Confidence:** verified (Tax Authority guidance).

## 11. Kibbutz member

- **Law:** the form asks whether the member’s income from this employer is
  transferred to the kibbutz. If yes, the kibbutz is the tax unit for that income;
  the member’s personal credits may be handled differently.
- **App:** capture the kibbutz status; do not compute the member’s net tax as if
  the income were personal; route to the kibbutz payroll.
- **Confidence:** `likely` (the form field is verified; the tax treatment is
  complex and not fully documented in the 101).

## 12. Resident of a “יישוב מזכה”

- **Law:** s. 11 gives a tax benefit/credit/exemption with locality-specific rates
  and ceilings; the form item 3 + form 1312א.
- **App:** capture the locality and from-date; do not hard-code rates; link to the
  current locality list; require form 1312א.
- **Confidence:** verified for the mechanism; rates are year/locality-specific.

## 13. Oleh arriving mid-year

- **Law:** the oleh credit is prorated by months in Israel; the 54/42-month window
  starts at aliyah; the first year may be partial.
- **App:** require the aliyah date and the oleh certificate; compute by months; do
  not give a full year for a December arrival.
- **Confidence:** verified.

## 14. Partial salary / daily worker

- **Law:** partial salary and daily wage default to maximum withholding unless it
  is the employee’s only income (regulation 5; form notes 4–5).
- **App:** ask the salary type; if partial/daily, ask “is this your only income?”;
  if not, apply max and explain the coordination route.
- **Confidence:** verified.

## 15. Employer uses an approved electronic 101 system

- **Law:** the employer may replace the paper form only with approved software,
  employee password, declaration and employer e-signature (2026 circular).
- **App:** do not claim to replace it; tell the employee to use the employer’s
  system if required; the PDF is a paper-equivalent.
- **Confidence:** verified.

## 16. Same-sex couple / unusual family status

- **Law:** the form is gendered (male/female) and the statute uses mother/father/
  registered spouse; no dedicated path.
- **App:** do not guess; route to the assessor/tax professional; mark as a known
  gap.
- **Confidence:** unverified / legal advice required.

## 17. Form 101 vs 101ג

- **Law:** 101 is the general form; 101ג is the shortened pensioner form; a
  pensioner may choose.
- **App:** offer 101ג only on the pensioner path; do not mix the schemas.
- **Confidence:** verified.

## 18. War evacuation / displaced employee

- **Law:** special Tax Authority instructions for residents of evacuated localities
  (2025) preserve the settlement benefit; the employer may need a locality approval.
- **App:** capture the locality and evacuation status; link to the current
  instructions; do not apply the benefit without the approval.
- **Confidence:** `likely` (instructions change).

## 19. Remote work from abroad

- **Law:** tax residency and the source of income determine the withholding; a
  resident working abroad may still be an Israeli resident; a non-resident working
  for an Israeli employer may be a foreign resident. The 101’s yes/no is not enough.
- **App:** flag “work location outside Israel” and route to the assessor; do not
  apply the 2.25 automatically.
- **Confidence:** `likely`; fact-specific.

## 20. Late form

- **Law:** max withholding until a valid form is provided; the employee can claim a
  refund later; no fixed employee fine found.
- **App:** allow late completion; show the max-withholding consequence; do not
  promise a refund amount.
- **Confidence:** verified for max withholding; `unverified` for a specific fine.

## 21. False declaration

- **Law:** the declaration says omission/false details are an offence under the
  Income Tax Ordinance; the employee is personally liable.
- **App:** show the declaration verbatim (or a faithful translation); require an
  explicit confirmation; do not bury it.
- **Confidence:** verified (form text).

## 22. Duplicate child / wrong ID

- **Law:** the form requires a unique child row; the ID check digit catches typos.
- **App:** reject duplicates; validate the check digit; allow manual correction;
  do not auto-correct the ID.
- **Confidence:** verified (form/algorithm).

## 23. Employee refuses to provide a document

- **Law:** the employer cannot apply the credit without the document; it should
  withhold per the valid parts of the form and explain what is missing.
- **App:** mark the item “claimed but missing document”; block the estimate; show
  the document checklist.
- **Confidence:** verified (2026 matrix requires attachments).

## 24. The app is used by an employer, not the employee

- **Law:** the employer is the controller and must verify/retain; the app vendor is
  not the employer.
- **App:** separate the employer prefill (company details only) from the employee
  form; do not collect employee data on the employer side; add a disclaimer.
- **Confidence:** verified (design/legal analysis).
