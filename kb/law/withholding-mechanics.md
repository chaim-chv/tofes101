---
id: law/withholding-mechanics
title: מנגנון הניכוי — How the 101 changes the payroll withholding
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [law, withholding, payroll, tax-rate, form-101]
sources: [source/wikisource-payroll-withholding-regulations, source/taxes-monthly-deductions-2026, source/nevo-income-tax-ordinance]
related: [law/form-101, law/employer-obligations, law/tax-brackets-2026, law/tax-coordination]
up: law/form-101
---

# Withholding mechanics

## 1. The default: monthly table

1. The employer withholds from each monthly salary according to the official
   monthly table (תוספת א׳ to the regulations; the “לוח עריכת חישוב” booklet).
2. The table already incorporates the tax brackets and the credit-point value:
   annual tax on the projected income, minus the employee’s credit points,
   divided by 12.
3. If the employee’s income is not fixed, the employer may need to annualise /
   use the “משכורת בלתי קבועה” rule (regulation 4): the difference between tax on
   the month including the irregular payment and tax on the ordinary month,
   multiplied by 12.
4. The result is a **withholding estimate**. The final liability is determined in
   the annual return; form 106 shows the employee what was withheld.

## 2. When the employer must use the maximum rate

The maximum rate is the top bracket **47%** (2025 and 2026). It applies when:

| Trigger | Legal basis |
| --- | --- |
| No 101 at all | regulation 5(a) |
| 101 without the “other income” section | regulation 5(a) |
| Employee ticked “I receive credits elsewhere” (ה item 8) | form notes (8) |
| Second job (ד item 3) without coordination | regulation 5(a) + form notes (3) |
| Partial salary / pension without the “only income” declaration | regulation 5(a)–(b), 5(c) |
| Daily wage without the “only income” declaration | regulation 5(a), תוספת ב׳ |
| Form invalid/incomplete in the approved electronic system | 2026 circular §ב.3.א |

“Maximum rate” is not a penalty added on top; it is the top marginal rate applied
to the whole payment, which usually over-withholds. The employee recovers the
excess via the annual return/refund.

## 3. Salary-type definitions that change the rate

The form’s own notes (2)–(6) are the operative definitions:

| Type | Definition | Withholding |
| --- | --- | --- |
| משכורת חודש (2) | ≥ 18 days/month | ordinary monthly table |
| משרה נוספת (3) | > 5 h/day **in addition to** another salary or taxable pension; employee chooses which job is “additional” | max unless coordination |
| משכורת חלקית (4) | ≤ 5 h/day, or > 5 h/day but < 8 h/week | max unless it is the only income |
| שכר עבודה / עובד יומי (5) | < 18 days/month but ≥ 8 h/week | daily table unless it is the only income |
| קצבה (6) | pension; do not report NII-exempt pension or wholly exempt survivors’ pension | max unless the “only income” declaration / coordination |
| מלגה (1) | scholarship, grant, prize or exemption given to a student/researcher | according to the applicable instruction; often max |

## 4. Credits and brackets: where they are used

- The employee may use the credits/brackets at **one** payroll. If they use them
  elsewhere, this employer must be told (ה item 8) and will withhold at max.
- The employer does not “split” the 2.25 resident points; it applies the full
  monthly credit if this is the credit-bearing payroll.
- A second employer cannot also apply the points unless coordination explicitly
  allocates them.
- For a mid-year hire with no prior income, section ט item 1 lets this employer
  apply the full credit from day one. Without that declaration/proof, the employer
  may over-withhold; the annual return fixes it.

## 5. Monthly formula (implementation sketch)

```
annual_gross      = monthly_gross * 12          // or actual projection
annual_tax        = bracket_tax(annual_gross)   // 2026 table
credit_value      = credit_points * 2,904
annual_tax_after  = max(0, annual_tax - credit_value)
monthly_withhold  = annual_tax_after / 12
```

Real payroll also handles: non-fixed pay, partial months, pension deductions,
training funds, benefits in kind, and the surtax. The app should present this as
an **estimate**, not a payroll engine.

## 6. Surtax (מס יסף)

- 3% on taxable income above **721,560 ₪/year** (60,130 ₪/month) in both 2025
  and 2026 (s. 121ב).
- An additional **2%** on capital-source income above the same threshold, from
  2025 (freeze law).
- The employer withholds the 3% surtax on salary above the ceiling; the 2% capital
  surtax is generally handled outside payroll.
- See [[law/tax-brackets-2026]].

## 7. What the app should never do

- Never compute a net salary or promise a refund amount.
- Never apply a credit without the corresponding form item and document.
- Never apply 2025 brackets to 2026.
- Never treat “maximum rate” as a flat 47% of net; it is 47% of the taxable
  payment after allowable deductions.
