---
id: field/101-tax-coordination
title: שדה — חלק ט׳ תיאום מס
type: field
status: verified
confidence: verified
updated: 2026-10-29
tags: [form-101, field, tax-coordination]
sources: [source/tofes101-form-runner-api, source/tofes101-official-pdf]
related: [flow/form-101-service, law/tax-coordination, field/101-other-incomes]
up: flow/form-101-service
---

# חלק ט׳ — תיאום מס

Opt-in, and the only place in the form where the user enters **other employers**
as repeat rows.

## Structure

```
[ ] צירוף/עריכת תיאום מס
      ↓
סיבת הבקרה:
  ( ) לא הייתה לי הכנסה מתחילת שנת המס ועד לתחילת עבודתי אצל מעסיק זה
        → הוכחות לחוסר הכנסה (upload)
  ( ) יש לי הכנסות נוספות ממשכורת, כמפורט להלן
        → repeat rows: שם · כתובת · מספר תיק ניכויים · סוג הכנסה
          (עבודה / קצבה / מלגה / אחר) · הכנסה חודשית · המס שנוכה
        → צילום תלוש שכר (upload)
  ( ) פקיד השומה אישר תיאום לפי אישור מצורף
        → אישור תיאום מס (upload)
```

> ⚠️ **Form number correction:** the coordination request is **form 116**, not
> 119. Form 119 is the declaration used for the "finished studies / profession"
> credit (item 15 of part ח׳). The reference product links both concepts to 119 in
> some of its copy; the law track verified this — see
> [law/tax-coordination](../law/tax-coordination.md).

## Rules worth knowing

- Selecting "יש לי הכנסות נוספות" here is *not* the same as section ה׳. ה׳ is
  about the employee's own total income picture; ט׳ is the formal request that
  lets *this* employer withhold at a partial rate.
- The deduction-file number of each other employer is Luhn-checked in the
  reference (same validator as IDs) — again, possibly too strict.
- Without coordination, "משרה נוספת" or a second income means **maximum
  withholding** until the Tax Authority approves. This is the single most
  money-relevant sentence to put in the UI.

## What we build

- Frame it as a decision, not a form: *"יש לך עוד מקום עבודה השנה?"* → if yes:
  *"אפשר לבקש תיאום מס, כדי שלא יורידו לך מס מקסימלי. זה דורש אישור מפקיד
  השומה."* with three actions: `לפתוח בקשה (טופס 116)` · `כבר יש לי אישור —
  לצרף` · `לא עכשיו`.
- Deep-link to the official online service
  (`https://www.misim.gov.il/shteumeimas/…`) — the reference already does this in
  its warning. That link must open in a new tab and carry a "אתה עומד/ת לצאת
  מהאתר" notice.
- Repeat rows: same component as children (see [101-children-block](./101-children-block.md)),
  with a monthly-income/tax pair that formats as currency (`₪`, thousands
  separators, RTL-safe).
- Never require the coordination block: it is legitimate to submit without it.

## Data shape

```ts
type Coordination =
  | { kind: "none" }
  | { kind: "no-previous-income"; untilDate: string; proof?: FileRef }
  | {
      kind: "other-incomes";
      employers: {
        name: string; address: string; deductionFile: string;
        incomeType: "work" | "allowance" | "scholarship" | "other";
        monthlyIncome: number; monthlyTax: number; payslip?: FileRef;
      }[];
    }
  | { kind: "approved"; certificate: FileRef };
```

## Accessibility

The three reasons are a radio group whose selection reveals a large sub-form.
Announce the reveal, keep the selected reason visible when scrolled, and never
auto-scroll the user past the reason they just chose.
