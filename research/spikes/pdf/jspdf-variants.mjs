import fs from 'node:fs'
import { jsPDF } from 'jspdf'
import bidiFactory from 'bidi-js'
const bidi=bidiFactory(); const reorder=s=>bidi.getReorderedString(s,bidi.getEmbeddingLevels(s,'rtl'))
const b64=fs.readFileSync('../scaffold/app/assets/fonts/Heebo-Variable.ttf').toString('base64')
const L='דוד כהן — Hello 2026 123'
const doc=new jsPDF({unit:'pt',format:'a4'})
doc.addFileToVFS('Heebo.ttf',b64); doc.addFont('Heebo.ttf','Heebo','normal'); doc.setFont('Heebo'); doc.setFontSize(16)
const variants=[['reorder+default',reorder(L),false],['logical+default',L,false],['reorder+r2l',reorder(L),true],['logical+r2l',L,true]]
let y=80
for(const [tag,text,r2l] of variants){ doc.setR2L(r2l); doc.text(tag,40,y); doc.text(text,555,y,{align:'right'}); y+=40 }
fs.writeFileSync('out/jspdf-variants.pdf',Buffer.from(doc.output('arraybuffer')))
console.log(variants.map(v=>[v[0],v[1]]))
