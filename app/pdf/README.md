# PDF overlay (`app/pdf`)

Fills the **official, flat** Israeli form 101 PDF in the browser. The official
PDF has no AcroForm fields, so we draw a text/vector overlay at measured
coordinates — we never rebuild the form.

```
app/pdf/anchors.json   generated coordinate map (never hand-edit)
        │
        ▼
app/pdf/fields.ts      FormState → [{ anchor, text | mark | signature }]
        │
        ▼
app/pdf/overlay.ts     renderPdf(state, opts) → Uint8Array
        │
        ▼
app/pdf/rtl.ts         bidi-safe line layout (Hebrew + digits + Latin)
```

## Why the RTL helper exists

fontkit (inside pdf-lib) reverses Hebrew glyphs but does **not** implement
UAX #9. Drawing a logical string directly produces `שלום עולם 321` for
`שלום עולם 123`. `rtl.ts` tokenises with `bidi-js`, keeps LTR runs (numbers,
IDs, emails) intact, splits RTL runs into words, mirrors paired punctuation and
places tokens from the right edge. **Never** draw Hebrew with
`page.drawText` directly — always go through `drawRtl`.

## Using it

```ts
const { asset } = useAppPath()
const { renderPdf } = await import("~/pdf/overlay") // keep the chunk lazy
const bytes = await renderPdf(state, {
  pdfUrl: asset("/assets/tofes-101-official.pdf"),
  fontUrl: asset("/fonts/Heebo-Variable.ttf"),
})
```

`renderPdf` has no top-level side effects and no DOM dependency. It accepts
pre-loaded `pdf`/`font` bytes (used by `tests/pdf.test.ts` in Bun) and an
injectable `fetchImpl`. pdf-lib and fontkit are imported inside the function,
so the first paint does not download them.

## Coordinates

All numbers in `anchors.json` are **PDF points from the top-left** of the page:

- text: `{ page, xRight, yTop, size?, maxWidth? }` — `yTop` is the **baseline**;
- box: `{ page, x, y, mark: true, size? }` — `x`/`y` are the **centre** of the
  printed checkbox.

`overlay.ts` converts to pdf-lib's bottom-left origin. Long values shrink down
to 5.5 pt inside `maxWidth`, then ellipsize, so nothing spills into a label.

## Regenerating the map

```bash
bun run tools/pdf/build-anchors.ts   # writes app/pdf/anchors.json
```

The generator reads the text layer of
`public/assets/tofes-101-official.pdf` with the pdfjs legacy build and resolves
each anchor from a printed label plus a small documented offset, or from the
checkbox glyph nearest to an option label. The JSON records the source PDF
SHA-256. **When the Tax Authority publishes a new edition**, rerun the script
and fix the rules in `tools/pdf/build-anchors.ts` whose offsets no longer land
inside the box; then check the samples.

## Visual verification

```bash
bun run tools/pdf/render-samples.ts
```

Renders three profiles (single / married + 2 children / new immigrant) to
`research/spikes/pdf/out/sample-*.pdf` and rasterises them with Ghostscript at
150 dpi. Look at the PNGs before shipping a map change. The current samples are
legible and unmirrored; the approximate spots are the 9-digit fields (we draw
the number as one string, not centred in each printed digit cell) and the
locality name, which the paper form gives only a 14 pt gap (we use the
"מתגוררים ביישוב" rule on the next line).

## Intentionally not printed

These `FormState` fields have no printed slot on the official form; mapping them
would mean inventing a field. They stay in the app/export only:

- `employee.passportCountry` — the form prints the passport number only.
- `employee.separatedCertificate` — covered by the printed "(חובה לצרף אישור פ״ש)".
- `credits.immigrantType` (עולה / תושב חוזר) — no box on this edition.
- `other.types` value `other` — the form has no "other source" box.
- `other.source` — no free-text rule for the other-income source.
- `coord.noIncomeUntil` — item ט.1 has no date blank on this edition.

## Tests

`tests/pdf.test.ts` covers the tokeniser, the anchors ↔ fields sync, and renders
the real PDF with the real font: valid `%PDF`, 2 pages, 500 KB–2 MB, re-loadable
by pdf-lib, and the text layer contains the employee name plus an LTR ID.

Bundle (measured with `bun build --splitting`, gzip):
pdf-lib 165 KB + fontkit 334 KB + our overlay/fields/rtl/bidi/locales ~27 KB.
The PDF (553 KB) and TTF (122 KB) are same-origin assets fetched on demand, not
JS.
