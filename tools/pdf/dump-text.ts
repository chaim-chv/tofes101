/**
 * Diagnostic: dump the text layer of the official PDF with coordinates.
 *
 *   bun run tools/pdf/dump-text.ts [page] [ymin] [ymax] [xmin] [xmax]
 *
 * Coordinates are PDF points from the top-left, same convention as anchors.json.
 */
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const PDF = `${ROOT}public/assets/tofes-101-official.pdf`

const [pageArg, yminArg, ymaxArg, xminArg, xmaxArg] = process.argv.slice(2)
const pages = pageArg ? [Number(pageArg)] : [1, 2]
const ymin = yminArg ? Number(yminArg) : -Infinity
const ymax = ymaxArg ? Number(ymaxArg) : Infinity
const xmin = xminArg ? Number(xminArg) : -Infinity
const xmax = xmaxArg ? Number(xmaxArg) : Infinity

const data = new Uint8Array(readFileSync(PDF))
const doc = await getDocument({ data, useSystemFonts: false }).promise
const round = (n: number) => Math.round(n * 100) / 100

for (const pageNo of pages) {
  const page = await doc.getPage(pageNo)
  const viewport = page.getViewport({ scale: 1 })
  const content = await page.getTextContent()
  const rows = content.items
    .filter((i): i is typeof i & { str: string } => "str" in i && Boolean(i.str.trim()))
    .map((i) => {
      const [, , c, d, e, f] = i.transform as number[]
      return {
        str: i.str,
        x: round(e),
        y: round(viewport.height - f),
        w: round(i.width ?? 0),
        h: round(Math.hypot(c ?? 0, d ?? 0)),
        dir: i.dir,
      }
    })
    .filter((r) => r.y >= ymin && r.y <= ymax && r.x + r.w >= xmin && r.x <= xmax)
    .sort((a, b) => a.y - b.y || a.x - b.x)

  console.log(`# page ${pageNo}  (${rows.length} items)`)
  for (const r of rows) {
    console.log(
      `y=${String(r.y).padStart(7)}  x=${String(r.x).padStart(7)}  w=${String(r.w).padStart(6)}  h=${String(r.h).padStart(5)}  dir=${r.dir ?? "-"}  ${JSON.stringify(r.str)}`,
    )
  }
}
