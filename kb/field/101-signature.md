---
id: field/101-signature
title: שדה — חלק י׳ הצהרה וחתימה
type: field
status: verified
confidence: verified
updated: 2026-10-29
tags: [form-101, field, signature, declaration]
sources: [source/tofes101-official-pdf, source/tofes101-form-runner-api]
related: [flow/form-101-service, law/form-101, law/declaration-and-signature]
up: flow/form-101-service
---

# הצהרה וחתימה

The declaration is the legally operative sentence of the whole document. Its text
must appear **verbatim**, immediately above the signature, in a readable size —
not collapsed into "קראתי ואני מאשר/ת".

## The text (verbatim, from the official form)

> אני מצהיר/ה כי הפרטים שמסרתי בטופס זה הינם מלאים ונכונים. ידוע לי שהשמטה או
> מסירת פרטים לא נכונים הינה עבירה על פקודת מס הכנסה.
>
> אני מתחייב/ת להודיע למעסיק על כל שינוי שיחול בפרטיי האישיים ובפרטים דלעיל תוך
> שבוע ימים מתאריך השינוי.

The reference stores it as static HTML in an `eHtml` element — i.e. it is not
checked against the law, just copied. Treat [the official PDF](../../research/raw/law/official-101.txt)
as the source of truth if the two diverge.

## Reference behaviour

- `fSign` canvas, label `חתימת המבקש/ת`, help "ניתן לחתום בעזרת העכבר או עם
  האצבע על מסך מגע", required.
- A `תאריך` field that is **only visible once a signature exists**, required.

## What we build

- **Two ways to sign**, both producing the same artifact:
  1. draw (pointer/pen/touch) — preserve stroke vectors, not a 200 px PNG;
  2. keyboard: type full name → confirm dialog with the declaration re-shown.
  A canvas-only signature is a keyboard trap and fails WCAG 2.1.1 for anyone who
  cannot draw.
- Show the date **before** signing ("נחתם בתאריך 29/10/2026") and include the
  timestamp in the output. Keep the field non-editable after signing, with an
  explicit "בטל/י חתימה" (which invalidates the PDF).
- Re-signature required when: the tax year changes, any answer in parts א–ט
  changes after signing, or the declaration text version changes.
- Store `declarationVersion` + `declarationHash` next to the signature so an old
  PDF can be tied to the exact wording that was signed.
- Print: the signature block must sit on **page 2** of the output next to the
  declaration, not on a separate page (employers reject a detached signature page).

## Legal questions (open)

- Is a drawn-on-screen signature acceptable to employers and to the Tax
  Authority, or is a printed-and-hand-signed copy still expected? See
  [law/declaration-and-signature](../law/declaration-and-signature.md) and
  `PLAN.md` O-6.
- Does the "7 days" commitment need to be separately acknowledged? The reference
  does not; we mirror it until the law agent says otherwise.

## Data shape

```ts
type Signature = {
  kind: "drawn" | "typed";
  strokes?: number[][];      // [x,y] pairs, normalized 0..1
  typedName?: string;
  signedAt: string;          // ISO with Asia/Jerusalem offset
  declarationVersion: string;
  declarationHash: string;
};
```

## Accessibility

- The canvas needs `role="img"`, `aria-label="אזור חתימה"`, a visible focus ring,
  and a keyboard path to the typed alternative.
- Announce "החתימה נרשמה" politely, and move focus to the confirm button.
- Do not disable the submit button silently when the signature is empty — enable
  it, then show the error on activation (WCAG 3.3.1 / 3.3.3).
