---
id: glossary/terms
title: מונחים — glossary (HE/EN) for form 101
type: glossary
status: verified
confidence: verified
updated: 2026-10-29
tags: [glossary, terminology, i18n]
sources: [source/tofes101-official-pdf]
related: [flow/form-101-service, field/101-other-incomes, law/form-101]
up: index
---

# מונחים · glossary

The words the form uses, their English equivalents, and the one-sentence meaning
we show in tooltips. Definitions of the payroll terms come from the official
explanatory notes on page 2 of the form
([source](../sources/tofes101-official-pdf.md)); anything marked ⚠️ still needs
verification by the law track.

| עברית | English | meaning (for tooltips) |
| --- | --- | --- |
| טופס 101 · כרטיס עובד | ITC form 101 · employee card | The declaration an employee gives an employer so the employer can withhold tax correctly. |
| נקודת זיכוי | credit point | A unit that reduces tax. Its NIS value is set for each tax year; your personal situation gives you a number of points. ⚠️ value per year |
| מדרגות מס | tax brackets | The progressive rates applied to taxable income. |
| תיאום מס | tax coordination | An arrangement (usually approved by a tax assessor) that lets more than one payer apply partial brackets instead of withholding the maximum rate. → [law/tax-coordination](../law/tax-coordination.md) |
| פקיד שומה | tax assessor | The Tax Authority official who approves coordination and special cases. |
| מספר תיק ניכויים | deductions file number | The employer's file number at the Tax Authority, used to attribute withholdings. |
| משכורת חודש | monthly salary | Work of **at least 18 days a month**. |
| משכורת בעד משרה נוספת | salary for an additional post | Work of **more than 5 hours a day**, in addition to a salary and/or a taxable pension from elsewhere. The employee chooses which workplace counts as the "additional" one. |
| משכורת חלקית | partial salary | Work of **less than 5 hours a day**, or more than 5 hours a day but **less than 8 hours a week**. Max rate is withheld unless it is the only income. |
| שכר עבודה (עובד יומי) | daily wage | Work of **less than 18 days a month but at least 8 hours a week**. Daily table is used; monthly table if it is the only income. |
| קצבה | pension / allowance | Periodic payment. Do not report a NII-exempt pension or a fully exempt survivor's pension. |
| מלגה | scholarship | Includes a grant, prize, or exemption from payment given to a student or researcher. |
| עולה חדש/ה | new immigrant (oleh) | Entitled to credit points for a limited period from the aliyah date. ⚠️ period + amounts → [law/new-immigrant](../law/new-immigrant.md) |
| תושב/ת חוזר/ת | returning resident | A returning resident (typically after 6+ years abroad) with its own credit track. ⚠️ → [law/returning-resident](../law/returning-resident.md) |
| ישוב מזכה | qualifying (priority) locality | A locality that grants a tax benefit under §11 of the ordinance or §11 of the AXR law; requires form 1312א from the municipality. |
| הורה במשפחה חד הורית | single parent (new family) | Single, divorced, widowed, or separated **with a tax assessor's certificate**; or a parent whose other parent died; or a child registered without a second parent. |
| הורה יחיד | sole parent | A parent whose child was under 19 in the tax year and whose other parent died, or the child is registered without the other parent's details. |
| ספח | ID-card annex ("seif") | The page attached to an Israeli ID card listing family members; the form asks for a copy. |
| קרן השתלמות | study fund | Employer/employee savings fund; contributions have their own tax treatment and affect what the employer must add to salary. |
| ביטוח לאומי · מל"ל | National Insurance (NII) | Pays child allowances, disability child benefit, etc. Several form items depend on receiving an NII benefit. |
| טופס 116 | form 116 | Request for **tax coordination** (תיאום מס) with the Tax Authority. |
| טופס 119 | form 119 | Declaration attached for the **finished studies / profession** credit (part ח׳ item 15). *Not* the coordination form. |
| טופס 1312א | form 1312a | Municipality certificate for a qualifying locality. |

## Naming rules for the app

- Hebrew UI always uses the form's own wording for legal names, with the plain
  explanation as a secondary line — never replace the legal term.
- English UI translates the meaning, and keeps the Hebrew term in parentheses on
  first use: "credit point (נקודת זיכוי)".
- Never translate `טופס 101` as "Form 101" in a heading without "ITC" context in
  English body copy; use "Form 101 (ITC)" once, then "Form 101".
- Currency: `₪` with thousands separators; in English, `NIS 12,345`.
