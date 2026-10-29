// Force fontkit to lay out LTR so we can feed bidi-js visual-order strings.
import fs from 'node:fs'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import bidiFactory from 'bidi-js'

const bidi = bidiFactory()
const logical = 'שלום עולם 123'
const visual = bidi.getReorderedString(logical, bidi.getEmbeddingLevels(logical, 'rtl'))
const fontBytes = fs.readFileSync('../scaffold/app/assets/fonts/Heebo-Variable.ttf')

const doc = await PDFDocument.create()
doc.registerFontkit(fontkit)
const font = await doc.embedFont(fontBytes, { subset: true })
const fk = font.embedder.font
const origLayout = fk.layout.bind(fk)
fk.layout = (s, features, script, language) => origLayout(s, features, script, language, 'ltr')

const page = doc.addPage([595.28, 320])
const size = 32
const draw = (text, y, color) => {
  const w = font.widthOfTextAtSize(text, size)
  page.drawText(text, { x: 40, y, size, font, color })
  return +w.toFixed(2)
}

const a = draw(logical, 250, rgb(0, 0, 0)) // logical, forced LTR -> should be wrong
const b = draw(visual, 170, rgb(0.7, 0, 0)) // bidi visual, forced LTR -> should be correct
const c = draw('123 12,345.00 ₪', 90, rgb(0, 0.3, 0.7))
console.log(JSON.stringify({ logical, visual, widths: { a, b, c } }))
fs.writeFileSync('out/rtl-probe2.pdf', await doc.save())
