// Extract text items with accurate positions from the official flat PDF.
// Verified with pdfjs-dist 6.4.299 (legacy build, Node).
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import fs from 'node:fs'

const data = new Uint8Array(fs.readFileSync('tofes-101-official.pdf'))
const doc = await getDocument({ data, useSystemFonts: false }).promise
const page = await doc.getPage(1)
const vp = page.getViewport({ scale: 1 })
const { items } = await page.getTextContent()

const out = items
  .filter((i) => 'str' in i && i.str.trim())
  .map((i) => {
    const [a, b, c, d, e, f] = i.transform
    const width = i.width ?? 0
    return {
      text: i.str,
      x: +e.toFixed(1),
      y: +(vp.height - f).toFixed(1), // PDF bottom-left -> distance from top
      w: +width.toFixed(1),
      h: +Math.hypot(c, d).toFixed(1),
      dir: i.dir
    }
  })

fs.writeFileSync('official-text-items.json', JSON.stringify(out, null, 1))
const wanted = ['שם משפחה', 'שם פרטי', 'מספר זהות', 'חתימת העובד', 'שנת המס', 'מעסיק']
for (const w of wanted) {
  const hits = out.filter((i) => i.text.includes(w))
  console.log(w, hits.slice(0, 4))
}
console.log('items:', out.length, 'page', vp.width, 'x', vp.height)
