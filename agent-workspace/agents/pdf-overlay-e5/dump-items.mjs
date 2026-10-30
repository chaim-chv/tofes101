import { getDocument } from '/Users/chv/develop/tofes101/research/spikes/pdf/node_modules/pdfjs-dist/legacy/build/pdf.mjs'
import fs from 'node:fs'
const data = new Uint8Array(fs.readFileSync('/Users/chv/develop/tofes101/public/assets/tofes-101-official.pdf'))
const doc = await getDocument({ data, useSystemFonts: false }).promise
for (let p = 1; p <= 2; p++) {
  const page = await doc.getPage(p)
  const vp = page.getViewport({ scale: 1 })
  const { items } = await page.getTextContent()
  const out = items.filter(i => 'str' in i && i.str.trim()).map(i => {
    const [a,b,c,d,e,f] = i.transform
    return { text: i.str, x: +e.toFixed(1), y: +(vp.height - f).toFixed(1), w: +(i.width ?? 0).toFixed(1), h: +Math.hypot(c,d).toFixed(1), dir: i.dir }
  })
  fs.writeFileSync(`/Users/chv/develop/tofes101/agent-workspace/agents/pdf-overlay-e5/page${p}.json`, JSON.stringify(out, null, 1))
  console.log('page', p, 'items', out.length, 'size', vp.width, vp.height)
}
