---
id: field/101-other-incomes
title: שדה — חלק ה׳ הכנסות אחרות (the gate that can block part ח׳)
type: field
status: verified
confidence: verified
updated: 2026-10-29
tags: [form-101, field, other-income, tax-coordination]
sources: [source/tofes101-form-runner-api, source/tofes101-official-pdf]
related: [flow/form-101-service, field/101-credit-items-map, law/tax-coordination]
up: flow/form-101-service
---

# חלק ה׳ — הכנסות אחרות

The most consequential yes/no in the form after identity: it decides whether the
employer may apply credit points at all.

## Reference structure

```
יש לך הכנסות אחרות?
  ( ) אין לי הכנסות אחרות ממשכורת (משכורת חודש, בעד משרה נוספת, משכורת חלקית,
      שכר עבודה), מקצבה וממלגה
  ( ) יש לי הכנסות נוספות כמפורט להלן
        ↓
  פירוט הכנסות  [ ] משכורת חודש [ ] משרה נוספת [ ] משכורת חלקית [ ] שכר יומי
                [ ] קצבה [ ] מלגה
  פירוט מקור הכנסה אחר  (free text, only if "other")
  נקודות זיכוי:
     ( ) אבקש לקבל נקודות זיכוי ומדרגות מס כנגד הכנסתי זו (סעיף ד).
         איני מקבל/ת אותן בהכנסה אחרת.
     ( ) אני מקבל/ת נקודות זיכוי ומדרגות מס בהכנסה אחרת ועל כן איני זכאי/ת
         להן כנגד הכנסה זו.
  הפרשות:
     [ ] אין מפרישים עבורי לקרן השתלמות בגין הכנסתי האחרת, או שכל ההפרשות
         מצורפות להכנסתי האחרת
     [ ] אין מפרישים עבורי לקצבה/ביטוח אובדן כושר עבודה/פיצויים … (same idea)
```

## The two rules that matter

1. **Second option ⇒ part ח׳ is blocked.** You cannot claim the same credit twice.
   The reference replaces the whole credit section with an explanation.
2. **"יש לי הכנסות" + no coordination ⇒ maximum withholding.** The reference shows
   an alert pointing to tax coordination (and, in the "warn" variant, only when
   the income is a *salary*).

## What we build

- Ask the question as a **single card pair** with the consequence written under
  each option ("אם תבחר/י כאן, לא תוכל/י לבקש נקודות זיכוי בטופס הזה — זה
  בסדר, הן יינתנו במקום שבו הן כבר ניתנות").
- After the answer, show a **status strip**: `נקודות זיכוי בטופס הזה: ✔ / ✘`
  and, if ✘, what to do instead (form 116 — tax coordination). This single
  element prevents the most expensive mistake in the form.
- The `הפרשות` checkboxes are the least understood part of the whole product.
  Rewrite as two short statements with "לא הבנתי — מה זה?" → a glossary popover
  ([law/credit-points](../law/credit-points.md)).
- Keep the reference's labels for the PDF, but never show raw `types` enums.

## Validation

- `hasIncomes = true` requires at least one income type (the reference makes the
  checkbox group required — replicate).
- `typesOther` required iff "other" is selected.
- If `hasIncomes = true`, the tax-coordination block in ט becomes *expected*, not
  required: warn, do not block (the employee may legitimately not want it).

## Accessibility

A yes/no that removes a whole downstream section must announce the change:
"בחרת שיש לך הכנסות נוספות. חלק ח׳ (בקשה לפטור או זיכוי) אינו זמין יותר."
Use `aria-live="polite"` and keep focus where the user clicked.
