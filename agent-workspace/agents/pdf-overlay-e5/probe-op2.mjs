import { getDocument, OPS } from '/Users/chv/develop/tofes101/research/spikes/pdf/node_modules/pdfjs-dist/legacy/build/pdf.mjs'
import fs from 'node:fs'
const data = new Uint8Array(fs.readFileSync('/Users/chv/develop/tofes101/public/assets/tofes-101-official.pdf'))
const doc = await getDocument({ data, useSystemFonts: false }).promise
const page = await doc.getPage(1)
const ol = await page.getOperatorList()
let n=0
for(let i=0;i<ol.fnArray.length;i++){
  if(ol.fnArray[i]===OPS.constructPath){ console.log('args0',ol.argsArray[i][0],'coords',Array.from(ol.argsArray[i][1]), 'minmax', ol.argsArray[i][2]); if(++n>5)break }
}
