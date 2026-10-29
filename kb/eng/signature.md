---
id: eng/signature
title: Signature capture and embedding — what is actually being produced
type: concept
status: verified
confidence: likely
updated: 2026-10-29
tags: [signature, pdf, canvas, legal, accessibility]
sources: [source/pdf-lib-readme]
related: [eng/pdf-generation, law/declaration-and-signature, field/101-signature, ux/signature-accessibility, decision/adr-0002-pdf-strategy]
up: eng/architecture
---

# Signature

**We produce a picture of a signature inside a PDF. We do not produce a
qualified electronic signature.** That distinction is legal, not technical, and
it is owned by the law track — this node records the engineering and flags what
we could not verify.

## 1. Capture

- Canvas, logical size 600×200, backing store `600 * devicePixelRatio` (cap 2),
  transparent background, 2 px dark-blue stroke, round caps.
- Pointer events (`pointerdown/move/up` + `setPointerCapture`) so mouse, pen and
  touch share one path; `touch-action: none` on the canvas.
- Store as PNG data URL (`canvas.toDataURL('image/png')`), trimmed to the ink
  bounding box with ~8 px padding.
- Cap the stored image at ~200 KB; if larger, downscale to 1200 px wide.
- Provide a **typed** alternative (name in a handwriting-like font) for users who
  cannot draw; the legal weight of a typed name is *not* the same and must be
  worded honestly.
- Accessibility: canvas alone is not keyboard accessible. The typed path, a
  visible label, instructions and an error message are required; see
  [ux/signature-accessibility](../ux/signature-accessibility.md).

## 2. Embedding

```ts
const png = await pdfDoc.embedPng(signatureDataUrl) // data URL is accepted
page.drawImage(png, {
  x: map.signature.x,
  y: page.getHeight() - map.signature.yTop - map.signature.height,
  width: map.signature.width,
  height: map.signature.height
})
```

- Place only inside the mapped signature row; never over the declaration text.
- Preserve aspect ratio; letterbox if needed.
- Optionally add a caption `נחתם אלקטרונית ב-29.10.2026 14:03` in 7 pt grey —
  useful for the user, **not** a legal proof.
- Optionally compute SHA-256 of the final PDF and show it to the user ("מזהה
  הקובץ"). It detects later modification only if the verifier has the original
  hash; it is not a signature. Do not oversell it.

## 3. What the law question is (handed off)

The Israeli Electronic Signature Law, 5761-2001, distinguishes an "electronic
signature" from a "secure electronic signature" / "qualified electronic
signature" (חתימה אלקטרונית מאושרת), and the evidentiary weight differs. A
scanned handwriting image is generally treated as an electronic signature, not a
qualified one, and some recipients (employers, tax officials) may still require a
wet-ink original or an approved signature.

We could **not** verify in this session:

- whether a filled 101 with an image signature is accepted by the Israel Tax
  Authority / a given employer;
- whether the form's declaration requires a specific signature type;
- the current evidentiary standard and any 2026 amendments.

These are recorded for `law-101-a1` in `agent-workspace/SHARED.md` and must be
answered in [law/declaration-and-signature](../law/declaration-and-signature.md)
before we use words like "חתום", "מאושר" or "קביל" in the UI.

## 4. Product wording (safe)

- "חתימה על הטופס" — describes the act.
- "החתימה תופיע כפי שציירתם" — describes the artifact.
- "אין זו חתימה אלקטרונית מאושרת" — explicit limitation, shown before signing.
- Never: "חתימה מאומתת", "חתימה דיגיטלית מאושרת", "הטופס נקלט ברשות המסים".

## 5. Storage and export

- The signature PNG lives in the draft (`answers['_signature']` or a separate
  `meta.signature`), because losing it on reload is unacceptable.
- It is PII: include it in the JSON export only with a warning, or exclude it by
  default and let the user opt in ("ייצוא כולל החתימה").
- Provide "מחיקת החתימה" independent of "מחיקת הטופס".
- Do not put the signature in `localStorage` (size + sync); IndexedDB only.

## 6. Failure modes

| Case | Behavior |
| --- | --- |
| Empty canvas | block "אנא חתמו או בחרו חתימה מודפסת" |
| Too large PNG | downscale, keep aspect, warn |
| pdf-lib fails | fall back to the print sheet with the signature image in HTML |
| User prints instead of downloading | signature is in the print sheet at 300 dpi CSS size |
| Shared device | "מחיקת החתימה" + trust copy; no false promise of encryption |

## 7. Tests

- Canvas → PNG at 1×/2× DPR; ink bbox trim; < 200 KB.
- Keyboard/typed path works without a pointer.
- PDF: image lands inside the signature box for both fixture layouts.
- Print: signature visible, not clipped, on A4 with 0 margins.
- Export/import round-trip with and without the signature.
