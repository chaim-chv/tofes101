// Validate the run-based bidi layout against a Chrome-rendered reference.
import fs from 'node:fs'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { drawBidiLine } from './lib/bidi-text.mjs'

const fontBytes = fs.readFileSync('../scaffold/app/assets/fonts/Heebo-Variable.ttf')
const doc = await PDFDocument.create()
doc.registerFontkit(fontkit)
const font = await doc.embedFont(fontBytes, { subset: true })

const page = doc.addPage([595.28, 520])
const size = 30
const lines = [
  'שלום עולם 123',
  'סכום (12,345) ש״ח',
  'דוד כהן — Hello 2026',
  'משכורת חודשית: 12,345.00 ₪'
]
let y = 470
for (const l of lines) {
  drawBidiLine(page, font, l, { xRight: 555, y, size, color: rgb(0, 0, 0) })
  y -= 70
}
fs.writeFileSync('out/bidi-runs.pdf', await doc.save())
console.log('wrote out/bidi-runs.pdf')
