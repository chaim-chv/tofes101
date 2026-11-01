---
id: eng/pdf-generation
title: PDF generation — overlay the official flat PDF, with a print fallback
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [pdf, pdf-lib, printing, output, signature]
sources: [source/pdf-lib-readme, source/unicode-uax9-bidi]
related: [decision/adr-0002-pdf-strategy, eng/pdf-hebrew-rtl, eng/signature, ux/print-export, law/form-101-official-pdf]
up: eng/architecture
---

# PDF generation

**Decision:** the downloadable PDF is the **official blank PDF with our values
overlaid** using `pdf-lib` 1.17.1 + fontkit 1.1.1 + Heebo. A print-optimized
HTML sheet is the fallback and the accessible path. See
[ADR-0002](../decisions/adr-0002-pdf-strategy.md).

Prototype: `research/spikes/pdf/fill-official.mjs` →
`research/spikes/pdf/out/filled-official.pdf` (+ PNG preview).

## 1. The artifact (verified)

| Property | Value |
| --- | --- |
| URL | `https://tofes101.co.il/assets/forms/tofes-101.pdf` |
| SHA-256 | `bf4f11b0228c30bf73b0c132475c0b8fb6b1e908ef70411c0fec5474f9d7d633` |
| Size | 553,528 bytes |
| Pages | 2, A4 (595.275 × 841.89 pt) |
| PDF version | 1.6 |
| Encrypted | no |
| **AcroForm fields** | **0** (`/AcroForm` absent, `get_fields()` empty) |
| Text | extractable (page 1: 2,711 chars; page 2: 6,066) |
| Embedded images | 0 (vector + text, Illustrator 29.6) |
| Title | `טופס 101 (כרטיס עובד) לשנת 2026` |
| Producer | Adobe PDF library 17.00 |

Official header `0101/130`, updated `11.2025`. The law agent tracks the official
artifact in [law/form-101-official-pdf](../law/form-101-official-pdf.md).

Because there are no form fields, `pdf-lib`'s `getForm()` APIs are useless.
"Filling" means drawing on the page at hand-mapped coordinates.

Nuance: `PDFDocument.load(...).catalog.getAcroForm()` returns an object even when
`/AcroForm` is absent (pdf-lib materialises a default), so it is **not** a
presence check. Use `getForm().getFields().length === 0` and confirm the raw
`/Root` keys with pypdf (`/AcroForm` absent).

## 2. Pipeline

```
answers (paths)
   │
   ├─ format.ts        Intl he-IL → clean strings (strip RLM/LRM)
   │
   ├─ field-map.ts     path → { page, xRight, yTop, size, maxWidth, align, kind }
   │
   ├─ bidi-text.ts     tokenise + right-align + draw (see pdf-hebrew-rtl)
   │
   ├─ PDFDocument.load(officialPdfBytes)
   │    .registerFontkit(fontkit)
   │    .embedFont(Heebo.ttf, { subset: true })
   │    .embedPng(signaturePng)            // if signed
   │    .getPage(i).drawText(...)
   │
   └─ save() → Uint8Array → Blob → <a download>
```

Measured output: **559,632 bytes** for the filled 2-page PDF (official 553,528 +
~6.1 KB for the subset font + values + signature), i.e. **+1.1%**.

## 3. The coordinate map (the real work)

`pdfjs-dist`'s `getTextContent()` gives text items with `transform` and `width`;
converted to PDF coordinates it gives label anchors. Example values extracted
from page 1 (y measured **from the top**):

| Label | x | y (top) | width |
| --- | --- | --- | --- |
| `שם משפחה` (employee) | 395.1 | 218.3 | 38.1 |
| `שם פרטי` (employee) | 278.8 | 218.3 | 29.1 |
| `מספר זהות )` (employee) | 496.3 | 218.6 | 40.8 |
| `שם` (employer) | 525.0 | 164.3 | 11.0 |
| `חתימת העובד/ת` | 44.9 | 763.9 | 55.3 |

`pdf-lib` uses **bottom-left** origin, so `y = pageHeight - yTop`.

Map construction method (repeatable):

1. Render the official page at 150 dpi (`gs -sDEVICE=png16m -r150`).
2. Extract labels with `pdfjs-dist` (`research/spikes/pdf/extract-text-items.mjs`)
   and the vector rules with a small content-stream pass if needed.
3. Place a test value at `(label.x - valueWidth - pad, label.y + offset)`, render,
   and adjust against the PNG. Store the final box, never a raw label coordinate.
4. Do this once per field; check into `field-map.ts` with a comment naming the
   official PDF hash and page.
5. Add a **golden screenshot test** (render → compare) so a new official PDF
   cannot silently move boxes.

Rules for boxes:

- `xRight` = right edge of the value area (RTL alignment).
- `maxWidth` = box width; shrink font or wrap to a second line.
- `size` 8–10 pt for table cells; 11–12 pt for free areas.
- `align: 'right'` for Hebrew, `'left'` for pure numeric fields if the form's
  box is LTR (ID digits are read left-to-right even in Hebrew).
- Numeric fields: `maxWidth` + `shrinkToFit`; never overflow into the next cell.
- Checkboxes: draw an X/✓ at the box centre; keep the official printed box.
- Signature: `drawImage(png, { x, y, width, height })` in the mapped signature box.

## 4. Print path (fallback and accessibility)

- A Vue `PrintSheet` renders the same answers in a recreated A4 layout with
  `@page { size: A4; margin: 0 }` and print-only CSS.
- `window.print()` → the user saves a real PDF via the browser. Chrome handles
  bidi/shaping perfectly (verified).
- Advantages: zero PDF library on the critical path, selectable/searchable text,
  screen-reader friendly, exact fonts, works on iOS.
- Disadvantages: not the official artifact; depends on the print dialog; the
  user must choose "Save as PDF"; page breaks need testing per browser.
- Use it as the **primary output on mobile** where a 516 KB gzip PDF library is
  expensive, and as the fallback if `pdf-lib` fails.

## 5. Decision matrix

Scores 1–5 (5 best). Fidelity = resemblance to the official form.

| Option | Fidelity | Hebrew correctness | Effort | Bundle (gz) | Real .pdf file | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| **pdf-lib overlay on official PDF** | **5** | 4 (helper required) | 3 (coordinate map) | ~516 KB lazy | yes | **chosen** |
| HTML print sheet + `window.print()` | 3 | **5** | 3 | **0** | via dialog | **fallback / mobile primary** |
| pdf-lib generated A4 (no official bg) | 2 | 4 | 2 | ~516 KB | yes | for a cover/summary page only |
| jsPDF + bidi | 2 | 2 (inconsistent) | 4 | ~254 KB | yes | rejected |
| pdfme 6.2.8 | 2 | 2 (no bidi) | 3 | larger | yes | rejected |
| AcroForm fill | — | — | — | — | — | impossible (0 fields) |
| paged.js / @react-pdf | 3 | 5 / n/a | 4 | medium/large | paged.js no | not needed |

Why not jsPDF: it is smaller, but its own Hebrew auto-reversal produced wrong
output in 2 of 4 test lines and conflicts with bidi-js; we would still hand-build
the token layout. See [eng/pdf-hebrew-rtl](pdf-hebrew-rtl.md).

Why not pdfme: a template engine for *new* PDFs, not an overlay; it also renders
`321` / `6202 olleH` (verified).

## 6. Signature

`signature.md` covers capture. In the PDF: `embedPng(dataUrl)` and draw into the
mapped box. The image is a **picture of a signature**, not a cryptographic
signature. Legal meaning is handed to `law-101-a1`; see
[eng/signature](signature.md) and [law/declaration-and-signature](../law/declaration-and-signature.md).

## 7. Known limitations

1. **Text layer is visual order.** Copy/paste/search of Hebrew in the generated
   PDF is reversed. No `/ActualText` yet. The HTML print path is the accessible
   artifact.
2. **Coordinate map is per official PDF version.** Pin the hash; a new `11.2026`
   edition requires a new map and a new golden test.
3. **Bundle size.** 516 KB gzip for pdf-lib + fontkit + bidi-js. Lazy-load it and
   exclude it from the precache unless offline PDF generation is a hard
   requirement.
4. **No PDF/A, no tagging, no encryption.** If the employer requires PDF/A or a
   qualified signature, we cannot satisfy it with this pipeline.
5. **Font licence.** Heebo is OFL; subsetting/embedding is allowed. Record the
   licence file next to the font.
6. **Not tested on iOS Safari.** Chrome/Playwright only. Test `Blob` download and
   `window.print()` on iOS before launch.

## 8. Acceptance tests

- Render the 2-page official PDF with a fixture of ~40 values; every value is in
  the right box (golden PNG diff / human review).
- Hebrew strings: `כהן`, `בן דוד`, `חברת דוגמה בע"מ`, `12,345.00 ₪`, `29.10.2026`.
- Pure numeric: ID `012345678` keeps the leading zero; amount `12,345.00`.
- Signature image is placed, scaled, and does not cover the declaration text.
- Output opens in macOS Preview, Chrome, Acrobat Reader; page count stays 2.
- File size delta < 5%.
- The same fixture printed from the HTML path fits 2 A4 pages.


## Implementation status (2026-10-30)

Shipped, lazy-loaded (`app/pdf/**`), verified in the browser and in a real
download from the deployed site:

| piece | file | notes |
| --- | --- | --- |
| bidi/RTL tokeniser | `app/pdf/rtl.ts` | port of the spike; fontkit reverses Hebrew but does not implement UAX #9 |
| anchors | `app/pdf/anchors.json` + `anchors.ts` | 134 generated slots; header pins the source PDF SHA-256 |
| anchor generator | `tools/pdf/build-anchors.ts` | reads both pages with pdfjs, resolves label text + documented offsets, nearest `o`/`q` glyph for option boxes |
| field mapping | `app/pdf/fields.ts` | declarative `state → items`; the single place that knows a value's printed form |
| renderer | `app/pdf/overlay.ts` | `renderPdf(state, {pdfUrl, fontUrl})`, no top-level side effects |

Numeric fields are now printed **cell-by-cell** on the official grids (tax year,
deduction file, IDs, dates, ZIP, passport): `anchors.json` carries a generated
`cells` map and `overlay.ts` centres one glyph per cell. The measured geometry,
the pre-printed deduction-file `9`, the page-2 header ID and the two prose blanks
are documented in [eng/pdf-slot-map](pdf-slot-map.md). The locality name uses the
neighbouring rule because the printed gap is ~14 pt. Nothing is mirrored, nothing
overlaps a label, and no value leaves the page.

Budget: the renderer is **not** in the first load (largest preload chunk is 123 KB);
pdf-lib + fontkit land in a separate chunk loaded on click. Assets (553 KB PDF,
122 KB TTF) are same-origin static files, fetched only when exporting.
