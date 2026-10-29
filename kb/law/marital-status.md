---
id: law/marital-status
title: מצב משפחתי — Marital status: options, proof and consequences
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [law, marital-status, spouse, form-101]
sources: [source/tofes101-official-pdf, source/taxes-electronic-101-rules-2026, source/nevo-income-tax-ordinance]
related: [law/form-101, law/spouse-not-working, law/children-details, law/single-parent-credit]
up: law/form-101
---

# Marital status

## 1. The five options on the form

| Hebrew | English | Consequences |
| --- | --- | --- |
| רווק/ה | single | no spouse block; may qualify as a single-parent family if there is a child |
| נשוי/אה | married | spouse block (ו) mandatory; spouse credits possible; child tracks split mother/father |
| גרוש/ה | divorced | no current spouse; single-parent/child points possible; alimony credit if remarried and paying |
| אלמן/ה | widowed | no current spouse; “הורה יחיד” (item 9) possible if the other parent is deceased |
| פרוד/ה | separated | **requires the assessor’s written approval** (אישור פ״ש); otherwise do not allow |

There is **no “ידועים בציבור” (unmarried cohabiting) option**. The tax law’s
dependent-spouse credit (s. 37) is for married couples; unmarried cohabitants may
still be parents for the child points, but do not get the spouse credit through
the 101.

## 2. “פרוד/ה” — the hard gate

- The paper form prints “פרוד/ה (חובה לצרף אישור פ״ש)”.
- The 2026 electronic matrix says: if “פרוד/ה” is selected, an assessor approval
  must be attached; the option cannot be selected without it.
- Practical rule: disable “פרוד/ה” until the user uploads the approval, or let
  them choose “נשוי/אה” and explain that a separation without approval is not a
  tax status.

## 3. Part-year status

- A person who marries, divorces, is widowed or separates during the year is
  treated as married/not married for the relevant months (s. 41 for a spouse who
  was married part of the year; the single-parent/divorce tracks look at months of
  eligibility).
- The form asks for the status at the time of filing; the payroll/annual return
  prorates. Do not ask the user to pick a single status and then silently prorate;
  show the months if the status changed.
- Example: married on 1 July → 6 months married, 6 months single for the relevant
  credits.

## 4. Spouse identity

- If married, section ו requires the spouse’s ID/passport, surname, first name,
  birth date, aliyah date (optional), and income status.
- The spouse’s ID is validated with the same check digit; if the spouse has no
  Israeli ID, use the passport.
- The form does **not** ask for the spouse’s income amount; the employer relies on
  the declaration and the payroll/assessor reconciles.

## 5. Gender

- The form offers **זכר / נקבה** only. Gender drives the 0.5 woman credit
  (s. 36א) and the mother/father child tracks.
- Do not add a third option to the 101; the statutory form does not support it. If
  the employee’s legal gender/status is unusual, route to the assessor.
- A person who transitions gender should use the gender on the official ID for the
  payroll; legal advice may be needed for the woman’s point. **Unverified.**

## 6. Same-sex couples

- The form’s categories are gendered and the statute speaks of “בן זוג רשום”,
  “אם”, “אב”. A same-sex registered couple may be recognized for some tax purposes,
  but the 101 has no dedicated path.
- Do not guess; route to the assessor / a tax professional. Mark this as a known
  gap, not a supported flow.

## 7. Implementation

1. Make marital status a required radio with the five options.
2. If “פרוד/ה”, require the assessor approval upload; otherwise show an error.
3. If “נשוי/אה”, require the spouse block; otherwise disable it.
4. If the status changed during the year, collect the change date and compute the
   months (do not just use the current status).
5. Do not infer marital status from the presence of a spouse row or children.
6. Do not offer “ידועים בציבור” as a marital status; explain the difference in help
   text.

## Sources

- [[source/tofes101-official-pdf]]
- [[source/taxes-electronic-101-rules-2026]]
- [[source/nevo-income-tax-ordinance]]

Every normative statement above is based on these nodes; year-specific values are stamped in the text.
