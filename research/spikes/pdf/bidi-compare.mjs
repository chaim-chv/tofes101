// Proof that pdf-lib does NOT apply the Unicode bidi algorithm: same string,
// drawn once raw and once after bidi-js reordering.
import fs from 'node:fs'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import bidiFactory from 'bidi-js'

const bidi = bidiFactory()
const reorder = (s) => bidi.getReorderedString(s, bidi.getEmbeddingLevels(s, 'rtl'))
const fontBytes = fs.readFileSync('../scaffold/app/assets/fonts/Heebo-Variable.ttf')

const doc = await PDFDocument.create()
doc.registerFontkit(fontkit)
const font = await doc.embedFont(fontBytes, { subset: true })
const page = doc.addPage([595.28, 841.89])
const H = page.getHeight()

const lines = [
  ['raw  ', 'שלום עולם 123'],
  ['bidi ', 'שלום עולם 123'],
  ['raw  ', 'סכום (12,345) ש״ח'],
  ['bidi ', 'סכום (12,345) ש״ח'],
  ['raw  ', 'דוד כהן — Hello 2026'],
  ['bidi ', 'דוד כהן — Hello 2026']
]

let yTop = 80
for (const [tag, text] of lines) {
  const visual = tag.trim() === 'bidi' ? reorder(text) : text
  const w = font.widthOfTextAtSize(visual, 18)
  page.drawText(tag, { x: 40, y: H - yTop, size: 9, font, color: rgb(0.4, 0.4, 0.4) })
  page.drawText(visual, { x: 520 - w, y: H - yTop, size: 18, font, color: rgb(0.05, 0.12, 0.55) })
  yTop += 42
}

page.drawText('pdf-lib 1.17.1 + @pdf-lib/fontkit 1.1.1 + bidi-js 1.1.0', {
  x: 40,
  y: 40,
  size: 8,
  font,
  color: rgb(0.5, 0.5, 0.5)
})

fs.writeFileSync('out/bidi-compare.pdf', await doc.save())
console.log('wrote out/bidi-compare.pdf')
