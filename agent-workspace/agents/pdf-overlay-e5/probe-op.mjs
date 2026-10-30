import { getDocument, OPS } from '/Users/chv/develop/tofes101/research/spikes/pdf/node_modules/pdfjs-dist/legacy/build/pdf.mjs'
import fs from 'node:fs'
const data = new Uint8Array(fs.readFileSync('/Users/chv/develop/tofes101/public/assets/tofes-101-official.pdf'))
const doc = await getDocument({ data, useSystemFonts: false }).promise
const page = await doc.getPage(1)
const ol = await page.getOperatorList()
for(let i=0;i<ol.fnArray.length;i++){
  if(ol.fnArray[i]===OPS.constructPath){ console.log(i, Array.isArray(ol.argsArray[i]), ol.argsArray[i].map(a=>a&&a.constructor&&a.constructor.name), ol.argsArray[i][0]?.slice?.(0,10), ol.argsArray[i][1]?.slice?.(0,10)); break }
}
console.log('OPS.constructPath', OPS.constructPath, 'rect', OPS.rectangle, 'moveTo', OPS.moveTo, 'lineTo', OPS.lineTo)
