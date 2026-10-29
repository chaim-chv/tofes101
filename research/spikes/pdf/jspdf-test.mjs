// jsPDF 4.2.1 + embedded TrueType + bidi-js reordering.
// jsPDF does no shaping and no bidi, so a visual-order string is required.
import fs from 'node:fs'
import { jsPDF } from 'jspdf'
import bidiFactory from 'bidi-js'

const bidi = bidiFactory()
const reorder = (s) => bidi.getReorderedString(s, bidi.getEmbeddingLevels(s, 'rtl'))
const b64 = fs.readFileSync('../scaffold/app/assets/fonts/Heebo-Variable.ttf').toString('base64')

const doc = new jsPDF({ unit: 'pt', format: 'a4' })
doc.addFileToVFS('Heebo.ttf', b64)
doc.addFont('Heebo.ttf', 'Heebo', 'normal')
doc.setFont('Heebo')

const lines = [
  'שלום עולם 123',
  'סכום (12,345) ש״ח',
  'דוד כהן — Hello 2026',
  'משכורת חודשית: 12,345.00 ₪'
]
let y = 80
for (const l of lines) {
  doc.setFontSize(18)
  doc.text(reorder(l), 555, y, { align: 'right' })
  y += 40
}
fs.writeFileSync('out/jspdf-hebrew.pdf', Buffer.from(doc.output('arraybuffer')))
console.log('wrote out/jspdf-hebrew.pdf', doc.output('arraybuffer').byteLength)
