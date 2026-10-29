---
id: source/pdf-lib-readme
title: pdf-lib — README (create/modify PDFs, embed fonts, forms)
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: pdf-lib (Hopding)
url: https://github.com/Hopding/pdf-lib
retrieved: 2026-10-29
tags: [pdf, pdf-lib, fonts, acroform]
---

# pdf-lib

- `PDFDocument.load(bytes)` modifies an existing PDF; `embedFont(bytes, { subset: true })`
  embeds a TTF/OTF; `drawText`, `drawImage`, `save()` produce the output.
- Custom fonts require `@pdf-lib/fontkit` (`doc.registerFontkit(fontkit)`); the
  standard 14 fonts cannot render Hebrew.
- AcroForm APIs (`getForm()`, `form.getTextField()`) only work when the PDF has
  form fields. The official 101 PDF has none (verified in the spike), so those
  APIs are irrelevant here.
- The library is pure JS/WASM-free and runs in the browser; no network.
- Version used: **1.17.1**, with `@pdf-lib/fontkit` **1.1.1**.

Caveat discovered in the spike (not documented upstream): fontkit applies the
script direction (reverses Hebrew runs) but not the full bidi algorithm, so
digits/English inside a Hebrew line come out mirrored. See
[eng/pdf-hebrew-rtl](../../eng/pdf-hebrew-rtl.md) for the token-level fix.
