/**
 * Spike: prove the cell-based layout for every printed grid.
 *
 *   bun run tools/pdf/probe-cells.ts
 *
 * This is NOT production code. It draws the sample values into the cells that
 * `kb/eng/pdf-slot-map.md` measured, so the target can be reviewed as an image.
 * Output: research/pdf-slots/proposed-page{1,2}.{pdf,png}
 */
import { execFileSync } from "node:child_process"
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const OUT = `${ROOT}research/pdf-slots`
const H = 841.89
const INK = rgb(0.05, 0.12, 0.55)

const doc = await PDFDocument.load(
  new Uint8Array(readFileSync(`${ROOT}public/assets/tofes-101-official.pdf`)),
)
doc.registerFontkit(fontkit as Parameters<typeof doc.registerFontkit>[0])
const font: PDFFont = await doc.embedFont(
  new Uint8Array(readFileSync(`${ROOT}public/fonts/Heebo-Variable.ttf`)),
  { subset: true },
)
const p1 = doc.getPages()[0]!
const p2 = doc.getPages()[1]!

function cells(
  page: PDFPage,
  x0: number,
  x1: number,
  yTop: number,
  chars: string,
  count: number,
  size = 9,
) {
  const step = (x1 - x0) / count
  for (let i = 0; i < chars.length && i < count; i++) {
    const ch = chars[i]!
    const width = font.widthOfTextAtSize(ch, size)
    page.drawText(ch, {
      x: x0 + (i + 0.5) * step - width / 2,
      y: H - yTop,
      size,
      font,
      color: INK,
    })
  }
}

function text(page: PDFPage, value: string, xRight: number, yTop: number, size = 9) {
  const width = font.widthOfTextAtSize(value, size)
  page.drawText(value, { x: xRight - width, y: H - yTop, size, font, color: INK })
}

const dateDigits = (iso: string) => {
  const [y, m, d] = iso.split("-")
  return `${d}${m}${y}`
}

/* ------------------------------------------------------------ page 1 values */

cells(p1, 220.41, 285.31, 98.2, "2026", 4)

// employer (same free-line anchors as production) + deduction file grid
text(p1, 'מפעלי הצפון בע"מ', 534, 178.3)
text(p1, "החרושת 3, קריית ביאליק", 410, 178.3)
text(p1, "04-8765432", 204, 178.3)
cells(p1, 39.89, 130.29, 180.3, "12345678", 8) // printed 9 + 8 digits

// employee identity
text(p1, "רונית", 308.9, 231, 10)
text(p1, "כהן", 434, 231, 10)
cells(p1, 438.11, 540.21, 231, "234567890", 9, 9)
cells(p1, 119.01, 210.0, 231, dateDigits("1986-03-09"), 8)
// aliyah blank (not applicable in this profile)
// address
text(p1, "שדרות הנשיא", 388, 254)
text(p1, "88", 225.5, 254)
text(p1, "חיפה", 199, 254)
cells(p1, 29.23, 108.44, 254, "3456789", 7)
// contact
text(p1, "054-7654321", 202, 324.4)
text(p1, "ronit.cohen@example.com", 537, 323.4)

// work start date
cells(p1, 30.75, 121.39, 387, dateDigits("2026-01-01"), 8)

// children rows 0 and 1
const children = [
  { name: "נועה כהן", id: "312345678", birth: "2014-05-14" },
  { name: "איתי כהן", id: "323456789", birth: "2018-09-02" },
]
children.forEach((child, row) => {
  const baseline = 396.2 + row * 21.9
  text(p1, child.name, 514, baseline, 9)
  cells(p1, 346.91, 448.81, baseline, child.id, 9, 9)
  cells(p1, 258.01, 346.91, baseline, dateDigits(child.birth), 8, 9)
})

// spouse
text(p1, "אבי", 310, 706, 10)
text(p1, "כהן", 433, 706, 10)
cells(p1, 437.76, 539.23, 706, "345678901", 9, 9)
cells(p1, 119.33, 209.97, 706, dateDigits("1984-12-01"), 8, 9)

/* ------------------------------------------------------------ page 2 values */

// header ID (new)
text(p2, "234567890", 170.66, 27.0, 9)

// coordination row 0: name / address / fileNum tail / type / income / tax
text(p2, 'סטודיו אור בע"מ', 534, 557, 8)
text(p2, "הרצל 4, עכו", 441, 557, 8)
// printed 9 at x 235.75..241.03 on this baseline; tail starts right after it
p2.drawText("01234567", { x: 242.0, y: H - 557.29, size: 8, font, color: INK })
text(p2, "עבודה", 228, 557.2, 8)
text(p2, "4,200", 170, 558.2, 8)
text(p2, "620", 97, 558.3, 8)

// credit 4 date: the correct blank (was +87 pt)
text(p2, "15/03/2025", 318.64, 131.8, 8)
// credit 16 reserve days: the text underline (was +44 pt)
text(p2, "18", 364.0, 459.8, 8)

/* --------------------------------------------------------------------- write */

writeFileSync(`${OUT}/proposed.pdf`, await doc.save())
for (const page of [1, 2]) {
  execFileSync("gs", [
    "-q",
    "-dNOPAUSE",
    "-dBATCH",
    "-sDEVICE=png16m",
    "-r200",
    `-dFirstPage=${page}`,
    `-dLastPage=${page}`,
    `-sOutputFile=${OUT}/proposed-page${page}.png`,
    `${OUT}/proposed.pdf`,
  ])
}
console.log("wrote", `${OUT}/proposed.pdf`)
