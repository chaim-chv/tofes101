---
id: eng/pdf-hebrew-rtl
title: Hebrew/RTL text in generated PDFs — what actually happens
type: finding
status: verified
confidence: verified
updated: 2026-10-29
tags: [pdf, hebrew, rtl, bidi, fontkit, pdf-lib]
sources: [source/unicode-uax9-bidi, source/pdf-lib-readme]
related: [eng/pdf-generation, decision/adr-0002-pdf-strategy, ux/bidi-mixed-content, ux/hebrew-typography]
up: eng/pdf-generation
---

# Hebrew/RTL in PDFs

**Short version:** `pdf-lib` + `@pdf-lib/fontkit` already reverses Hebrew glyphs
(so plain Hebrew looks right), but it does **not** apply the Unicode bidi
algorithm. Digits, amounts and English inside a Hebrew line come out mirrored.
Pre-reordering the whole string with `bidi-js` makes it worse (double reversal).
The fix is to split the line into bidi runs, split RTL runs into words, and draw
one token at a time right-to-left — letting fontkit reverse each Hebrew token.

All claims below were produced in `research/spikes/pdf/`, not assumed.

## 1. The experiment

Same string `שלום עולם 123`, font Heebo 36 pt, four variants:

| # | Input | Fontkit direction | Result (rendered) |
| --- | --- | --- | --- |
| A | logical `שלום עולם 123` | automatic (RTL) | Hebrew words correct, **digits `321`** |
| B | bidi-js visual `123 םלוע םולש` | automatic (RTL) | **double-reversed**, unreadable |
| C | bidi-js visual | patched to LTR | unchanged from B (patch ineffective) |
| D | logical | patched to LTR | **mirrored** words, digits right |

Why A happens: fontkit chooses the script from the characters and reverses the
whole glyph run for RTL scripts. That is a *run reversal*, not UAX #9: it also
reverses the digit cluster, and it reverses word order (which is why reading RTL
still looks correct for pure Hebrew).

Why patching `font.embedder.font.layout(..., 'ltr')` did nothing: fontkit's own
API does honour an explicit direction (`font.layout('שלום', [], undefined, undefined, 'ltr')`
returned the glyphs in LTR order when tested directly), but pdf-lib's
`CustomFontEmbedder` keeps/lays out a subset-font instance that is not the object
we patched. We did **not** pursue a monkey-patch; it is fragile across pdf-lib
releases. Treat "force LTR" as unavailable.

## 2. The working algorithm

`research/spikes/pdf/lib/rtl-tokens.mjs`:

1. `bidi-js` computes embedding levels for the logical string (base `rtl`).
2. Split into runs of equal parity; **keep even-level (LTR) runs whole**
   (`Hello 2026`, `12,345.00`, `123456789`).
3. Split odd-level (RTL) runs into words and whitespace, and mirror brackets in
   those tokens (`(` ↔ `)`).
4. Place tokens **right-to-left**, measuring each token with the same font.
5. Draw each token with `page.drawText`; fontkit reverses Hebrew words
   internally, and pure-LTR tokens are drawn as-is.

```ts
const tokens = rtlTokens('סכום (12,345) ש״ח')
// ["סכום"," ",")","12,345","("," ","ש״ח"]

const widths = tokens.map(t => font.widthOfTextAtSize(t, size))
let x = xRight - widths.reduce((a, b) => a + b, 0)
for (let i = tokens.length - 1; i >= 0; i--) {
  page.drawText(tokens[i], { x, y, size, font })
  x += widths[i]
}
```

### Verification against Chrome

Chrome is the ground truth (it implements UAX #9 + Hebrew shaping). We rendered
the same four lines in Chrome and in pdf-lib, cropped each line, normalised to
700×80 and compared ink masks:

| Line | IoU vs Chrome |
| --- | --- |
| `שלום עולם 123` | 0.818 |
| `סכום (12,345) ש״ח` | 0.834 |
| `דוד כהן — Hello 2026` | 0.794 |
| `משכורת חודשית: 12,345.00 ₪` | 0.255 |

The first three are visually identical (differences are anti-aliasing/scale).
The fourth differs around the colon and the shekel sign spacing; the words,
digits and currency are in the right order, but the neutral `:` / `₪` do not
land pixel-identically. Treat neutral punctuation as "verify per string", not
"guaranteed".

A separate check of the single word `כהן` against a HarfBuzz/raqm render gave
**IoU 0.946** — the letter order is correct.

Pure digit strings (`123456789`) must be drawn as one token (they are even-level)
and come out in the right order; do not reverse them.

## 3. What the alternatives actually did

| Library | Test | Result |
| --- | --- | --- |
| **jsPDF 4.2.1** + embedded TTF + bidi-js | 4 lines | wrong: `321`, `(543,21)`, `00.543,21`; jsPDF's own Hebrew auto-reversal fights bidi-js |
| jsPDF, 4 variants of one mixed line | logical/reordered × R2L on/off | only "reordered + default" looked right; inconsistent with the 4-line test → unreliable |
| **pdfme 6.2.8** `generate()` + font | 2 fields | `321`, `6202 olleH`; no bidi support |
| **Chrome print** (`page.pdf()` / `window.print()`) | all lines | perfect bidi, correct shaping, real PDF |

jsPDF's bundle was 830 KB raw / 254 KB gzip (incl. bidi-js) — cheaper than
pdf-lib but unusable without the same token work, and with worse font/asset
handling.

## 4. Bidi characters you must strip

`Intl.NumberFormat('he-IL', {style:'currency',currency:'ILS'}).format(12345)`
returns `"‏12,345.00 ‏₪"` — it contains U+200F RIGHT-TO-LEFT MARK and a
non-breaking space. Those are **invisible** and have no glyph in most fonts;
feeding them to a PDF either produces tofu or breaks width calculations.

Before drawing, normalise:

```ts
const clean = s
  .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '') // bidi controls
  .replace(/\u00A0/g, ' ')                                   // NBSP
```

Keep the bidi marks for DOM display (they help), strip them for PDF.

## 5. Copy/paste and accessibility

Because the PDF is drawn in visual order, the text layer is visual too: pypdf
extracted `כהן` as `ןהכ` (and `חברת דוגמה בע"מ` reversed). Consequences:

- Search/copy in the PDF is wrong for Hebrew; screen readers will read gibberish.
- The **HTML print path** (and the DOM) is the accessible artifact; the generated
  PDF is for handing in / archiving.
- Proper fix: add `/ActualText` marked-content spans (or a `/ToUnicode` map that
  restores logical order). pdf-lib does not expose this; it needs a content-stream
  post-process. Not implemented in v1 — record it as a known limitation.
- Do not claim "accessible PDF" until this is solved and validated with a screen
  reader (see `ux/print-export`).

## 6. Rules for the implementation

1. Pin `pdf-lib@1.17.1` + `@pdf-lib/fontkit@1.1.1`; fontkit behavior is the
   foundation of the algorithm.
2. One helper, one place: `app/domain/pdf/bidi-text.ts`, no ad-hoc
   `drawText` calls with mixed Hebrew content.
3. Persist golden tests: render the 4 reference lines + a signature and compare
   against checked-in PNGs (or Chrome reference IoU > 0.75).
4. Always strip bidi controls before measuring/drawing.
5. Test with real data: names with `בן דוד`, `בע"מ`, hyphenated surnames,
   `12,345.00 ₪`, dates `29.10.2026`, IDs with leading zeros.
6. If Arabic support is ever needed, this token approach is **not** enough
   (Arabic needs contextual shaping). That would require HarfBuzz WASM or a
   server-side/print path; out of scope.
