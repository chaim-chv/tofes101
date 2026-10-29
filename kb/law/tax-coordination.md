---
id: law/tax-coordination
title: תיאום מס — Tax coordination, second jobs and multiple employers
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [law, tax-coordination, form-116, second-job, multiple-employers]
sources: [source/govil-form-116, source/govil-tax-coordination, source/wikisource-payroll-withholding-regulations, source/tofes101-official-pdf]
related: [law/form-101, law/withholding-mechanics, law/credit-points, law/edge-cases]
up: law/form-101
---

# תיאום מס

> **Correction that matters:** coordination uses **form 116**. Form **119** is
> the academic-degree / profession credit declaration (section ח item 15); see
> [[law/credit-points-studies]]. Never send a user to 119 for coordination.

## 1. The problem

Israeli payroll withholds monthly on the assumption that this payroll is the
employee’s main/only income and the place where credits are used. With two
employers, a pension plus a salary, or a mid-year change, that assumption
over-withholds or under-withholds. Coordination tells each payer which slice of
the annual income and which credits to use.

## 2. The three routes

| Route | Form / channel | When |
| --- | --- | --- |
| **Employer-level coordination** | Form 101 section ט + the employer’s payroll | Simple cases: no income since the start of the year, or the employee lists the other salary sources and the employer is willing to coordinate |
| **Online coordination** | Tax Authority online service (current tax year only) | Employee has the deduction-file numbers and payslips; system issues certificates to the employers |
| **Assessor / representative** | **Form 116** (or 117 via a representative) | Complex cases, business income, many sources, reliefs the system cannot handle |

## 3. Form 101 section ט — the three boxes

Exactly one (or none):

1. **“לא הייתה לי הכנסה מתחילת שנת המס הנוכחית עד לתחילת עבודתי אצל מעסיק זה”**
   — attach proof (border-police exit/entry record, sick-leave approval, etc.).
   Effect: this employer may apply the full monthly credit/brackets from day one.
   Without proof, the employee is sent to the assessor.
2. **“יש לי הכנסות נוספות ממשכורת כמפורט להלן”** — repeat rows with employer
   name, address, deduction-file no., income type (work/pension/scholarship/
   other), monthly income and tax withheld; attach a payslip per row. Effect:
   the employer has the data to coordinate; a “second job” otherwise triggers max
   withholding.
3. **“פקיד השומה אישר תיאום לפי אישור מצורף”** — attach the approval. Effect:
   the payroll follows the approval.

If none is ticked and the employee has other income, the employer must not invent
a coordination; it withholds according to the form and the employee reconciles at
year end. If the employee ticked ה item 8 (“credits used elsewhere”), this
employer withholds at the maximum rate.

## 4. Form 116 — what it contains

- Employee identity and tax year.
- All employers/payers: name, address, deduction-file no., income type, gross
  monthly/annual income, tax withheld to date.
- Spouse/children details where relevant.
- The requested reliefs and the proposed allocation.
- Signature/declaration; attachments (payslips, certificates).
- The form’s own note: with the employee’s and employer’s agreement, the employer
  may do the coordination on form 101 without the assessor.

## 5. Main employer vs second employer

1. **Main employer** = the payer of the main salary; if there is no regular
   salary, the payer of the regular pension (Tax Authority/National Insurance
   practice).
2. The main employer is the natural place for the credit points and the ordinary
   brackets.
3. The second employer should withhold at the maximum rate unless a coordination
   certificate says otherwise.
4. The employee may choose which job is “second” for the purpose of section ד
   item 3, but the choice must be consistent with the coordination.

## 6. Interaction with the credit points

- The 2.25 resident points and all personal credits are **annual**; applying them
  at two payrolls would double-count them.
- A working spouse’s credit (s. 38) and the dependent-spouse credit (s. 37) are
  computed at the household level; they belong in one payroll or the annual
  return.
- Children’s points can be split between parents only in the cases the law allows
  (see [[law/children-credit-points]] and [[law/single-parent-credit]]); the 101
  has separate tracks for mother/custodial parent (item 7) and father/non-custodial
  parent (item 8), which is how the split is declared.

## 7. Coordination and the annual return

- Coordination is a **cash-flow** mechanism, not a final assessment.
- If the actual annual income differs from the projection, the annual return
  (form 1301) or a refund claim corrects it (up to 6 years).
- A coordination approval can be extended to the next year in some cases; do not
  assume it automatically renews.
- The online service handles the **current** tax year only.

## 8. What the app should do

- Ask: “Do you have another employer or another taxable income this year?”
- If yes, offer three actions: open the online coordination service, attach an
  existing approval, or continue without coordination (with a clear warning that
  this payroll may withhold at the maximum rate).
- Do **not** deep-link form 119 for coordination; link form 116 / the online
  service.
- Do not ask for the other employer’s full payslip data unless the user chooses
  the section ט item 2 route; it is optional and sensitive.

## 9. Edge cases

- **Second job started mid-year** — the second employer withholds max until
  coordination; the first employer may still apply credits.
- **Pension + salary** — the pension payer is often the “main” payer; coordinate.
- **Self-employed + salary** — business income is not on the 101; use form 116 /
  annual return.
- **Spouse also works** — household credits may be split; the 101 has no field for
  the spouse’s credit amount, so the payroll/annual return must compute it.
- **Employee refuses coordination** — allowed; the consequence is max withholding
  at the second payer, corrected at year end.

## Sources

- [[source/govil-form-116]]
- [[source/govil-tax-coordination]]
- [[source/wikisource-payroll-withholding-regulations]]
- [[source/tofes101-official-pdf]]

Every normative statement above is based on these nodes; year-specific values are stamped in the text.
