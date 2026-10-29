---
id: decision/adr-0002-pdf-strategy
title: ADR-0002 — PDF strategy: overlay the official flat PDF, print as fallback
type: decision
status: verified
confidence: verified
updated: 2026-10-29
tags: [adr, pdf, pdf-lib, printing, hebrew, signature]
sources: [source/pdf-lib-readme, source/unicode-uax9-bidi]
related: [eng/pdf-generation, eng/pdf-hebrew-rtl, eng/signature, ux/print-export, law/form-101-official-pdf, decision/adr-0001-stack]
up: eng/architecture
---

# ADR-0002 — PDF strategy

**Date:** 2026-10-29 · **Status:** accepted

## Context

The deliverable is "a filled, printable/signed PDF or a print-perfect page". The
official artifact (`tofes101.co.il/assets/forms/tofes-101.pdf`, SHA-256
`bf4f11b0…d633`, 2 pages A4, 553,528 B) is a **flat vector PDF with 0 AcroForm
fields**. It is not encrypted and its text is extractable.

So "fill the PDF" is not available via forms. The choices are: draw on top of the
official PDF, generate our own PDF, or print HTML. Hebrew makes this harder:
PDF libraries do not run the Unicode bidi algorithm.

## Options

| Option | Result |
| --- | --- |
| **A. pdf-lib overlay on the official PDF** | exact official look; needs a coordinate map; Hebrew needs a token-level helper; ~516 KB gzip lazy |
| **B. HTML print sheet + `window.print()`** | perfect bidi/shaping (verified against Chrome), accessible, 0 KB; not the official artifact; user saves via print dialog |
| C. jsPDF + bidi-js | tested: wrong digits/English in 2 of 4 lines; auto-RTL fights bidi; 254 KB gzip |
| D. pdfme 6.2.8 | tested: `321`, `6202 olleH`; template engine, no overlay; larger |
| E. pdf-lib generated A4 (no official background) | full control, but not the official form; same Hebrew work as A |
| F. AcroForm fill | impossible: 0 fields |
| G. paged.js / @react-pdf | paged.js still prints HTML; @react-pdf is React-only |

## Decision

Adopt **A + B**:

1. **Canonical download:** `pdf-lib@1.17.1` + `@pdf-lib/fontkit@1.1.1` + Heebo;
   load the official PDF, draw values at mapped coordinates, embed the signature
   PNG, save a Blob. Lazy-load the whole PDF module only on the output step.
2. **Print / accessible path:** a recreated A4 `PrintSheet` + `window.print()`.
   Use it as the mobile-primary output and as the fallback if pdf-lib fails.
3. **Hebrew:** one shared helper (`bidi-text.ts`) implementing the token
   algorithm in [eng/pdf-hebrew-rtl](../eng/pdf-hebrew-rtl.md). No ad-hoc
   `drawText` with mixed content.
4. **Map:** `field-map.ts` pinned to the official PDF hash, with a golden
   screenshot test. A new official edition requires a new map.
5. **Do not ship** jsPDF or pdfme.

## Consequences

- Positive: the PDF is the real government form, with the official header,
  instructions and page 2; no legal-layout approximation. File size grows only
  ~1.1% (559,632 B measured).
- Positive: signature embedding is trivial (`embedPng` + `drawImage`).
- Negative: the coordinate map is manual and version-bound — the largest
  maintenance cost in the project.
- Negative: the PDF text layer is in visual order; copy/search of Hebrew is
  reversed. No `/ActualText` in v1. The HTML print path is the accessible
  artifact; do not claim an accessible PDF.
- Negative: ~516 KB gzip library on first PDF generation. Keep it out of the
  precache; runtime-cache after first use.
- Negative: mobile Safari print/download flows are not verified yet; the print
  fallback is mandatory until they are.
- Neutral: a signature image is not a qualified electronic signature; the legal
  wording is owned by [law/declaration-and-signature](../law/declaration-and-signature.md).

## Revisit if

- The Tax Authority publishes a **fillable/AcroForm** 101 (then switch to form
  fields; keep the overlay as fallback).
- A WebAssembly shaping engine (HarfBuzz) or pdf-lib `/ActualText` support makes
  the text layer accessible at an acceptable bundle cost.
- The coordinate map proves too brittle across yearly editions — then invest in
  an HTML replica of the official layout instead of an overlay.
- Mobile Safari cannot generate/download the PDF reliably; reorder to make print
  the primary output.


## Implementation note (2026-10-30)

v1 shipped with the **print-first** path: `/print/` renders an A4 document from
the same `ReviewList` the user reviewed, and `window.print()` produces the PDF.
It has perfect Hebrew shaping (the browser does the bidi), zero bundle cost, and
works on every device — including ones where a 516 KB lazy chunk would be a
problem on 3G.

The overlay renderer stays the next step: `pdf-lib` + `fontkit` + `bidi-js` is
proven in `research/spikes/pdf/` (IoU 0.79–0.83 vs Chrome), but it needs the
coordinate map for all 160 slots, which is a calibration project of its own
(`?calibrate=1` in `docs/IMPLEMENTATION.md` §14). Until then the printed sheet is
the honest, working output — and the review screen shows exactly what will print.
