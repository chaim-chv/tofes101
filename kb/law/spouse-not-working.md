---
id: law/spouse-not-working
title: זיכוי בעד בן/בת זוג — Dependent spouse and working-spouse credits
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [law, credit-points, spouse, form-101]
sources: [source/govil-spouse-credit, source/nevo-income-tax-ordinance, source/kolzchut-spouse]
related: [law/credit-points, law/marital-status, law/children-credit-points]
up: law/credit-points
---

# Spouse credits

## 1. Two different spouse credits

| Credit | Statute | Amount | Trigger |
| --- | --- | --- | --- |
| **Dependent spouse** (בן/בת זוג ללא הכנסות) | s. 37 | **1 point** | employee supports a spouse with income ≤ 25,410 ₪/year, and employee or spouse is at retirement age / blind / disabled |
| **Working spouse** (בן/בת זוג עובד) | s. 38 | **1.5 points** (+0.25 travel = 1.75) or **1.75** (+0.25 = 2.0) if entitled to a pension point | registered spouse has income from personal effort (work/business/profession); the couple is assessed jointly |

Form 101 item 5 is only the **dependent-spouse** credit. The working-spouse credit
is not a separate checkbox; the payroll/assessment derives it from section ו
(spouse has income) and the marital status. In practice many employees claim it in
the annual return rather than monthly.

## 2. Dependent spouse — the five conditions

1. The employee is a **resident of Israel**.
2. The couple is **married** (registered). Unmarried cohabitants (“ידועים בציבור”)
   do **not** qualify for s. 37; Kol Zchut states this explicitly.
3. The spouse lives with the employee and the employee supports them.
4. The spouse’s income in the tax year does **not exceed 25,410 ₪** (2025–2026;
   frozen). Income includes work, pension, business and other taxable income.
5. At least one of the spouses:
   - has reached **retirement age** under the National Insurance Law, or
   - is **blind** or **disabled** under s. 9(5)(א) or (א1).

The form’s item 5 text only says “no income”, but the circular adds the
retirement-age/disability condition; do not grant the point on “no income” alone.

## 3. Retirement age — do not hard-code a single number

Retirement age depends on gender and birth year (men currently 67; women 62–67
with a gradual rise). The form/payroll should ask “has the employee or spouse
reached retirement age?” and, if needed, link to the NII table, not store a
single `RETIREMENT_AGE = 67`.

## 4. Working spouse — s. 38

- Applies where the spouse is a **registered spouse** and the couple’s income is
  assessed jointly, and the spouse’s income comes from personal effort (work,
  business, profession).
- The credit is given to the **registered spouse** (historically the husband) and
  is **1.5 points** if the couple is not entitled to a pension point, or **1.75**
  if they are; plus the 0.25 travel component under s. 36.
- There is a lower-income threshold: if the non-registered spouse’s income is
  below five times the relevant credit amount, their income is not included and
  the working-spouse points are not given (s. 38(b)). The practical threshold is
  indexed; use the Tax Authority calculator/year data, not a hard-coded number.
- The working-spouse credit is separate from the dependent-spouse credit; a couple
  cannot claim both for the same spouse.

## 5. Separate computation

If the couple chooses a separate computation (חישוב נפרד, s. 66), the dependent-
spouse credit is **half a point** (s. 66(c)(2)); the working-spouse credit is also
affected. The 101 does not ask “joint or separate”; the payroll should follow the
assessor’s instruction or the annual return.

## 6. What the 101 collects

- Section ו: spouse has ID? ID/passport, surname, first name, birth date, aliyah
  date; spouse income: “none” or “work/pension/business” and/or “other income”.
- Item 5: the employee claims the dependent-spouse point.
- The form does **not** ask for the spouse’s income amount. The employer cannot
  verify the 25,410 threshold from the form alone; it relies on the declaration +
  the documented retirement/disability status. This is why the point is often
  trued up in the annual return.

## 7. Implementation

1. Enable section ו only if marital status = נשוי/אה.
2. If the spouse has any income, do **not** show item 5 as available; show the
   working-spouse explanation instead.
3. If item 5 is ticked, require a retirement-age declaration or a disability/blind
   approval; otherwise warn that the assessor may reject it.
4. Do not apply item 5 to unmarried cohabitants, even if they share a household.
5. Do not apply both the dependent-spouse and working-spouse credits.
6. Use 25,410 ₪ for 2025 and 2026; year-stamp it.

## 8. Unverified / edge cases

- The exact current retirement-age table by birth year is outside this node; use
  the NII table.
- The working-spouse credit’s monthly application in payroll varies by employer;
  some apply it only in the annual return. The legal entitlement is clear; the
  cash-flow treatment is not.
- Same-sex registered couples: the statute uses “בן זוג רשום”; the form has only
  male/female. Route to the assessor; **unverified**.
