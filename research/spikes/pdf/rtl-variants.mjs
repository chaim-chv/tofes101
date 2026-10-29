// Four variants of the same Hebrew+digits line, for pixel comparison against a
// Chrome-rendered reference (ground truth for bidi + shaping).
import fs from 'node:fs'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import bidiFactory from 'bidi-js'

const bidi = bidiFactory()
const L = 'שלום עולם 123'
const V = bidi.getReorderedString(L, bidi.getEmbeddingLevels(L, 'rtl'))
const fontBytes = fs.readFileSync('../scaffold/app/assets/fonts/Heebo-Variable.ttf')

const doc = await PDFDocument.create()
doc.registerFontkit(fontkit)
const font = await doc.embedFont(fontBytes, { subset: true })
const fk = font.embedder.font
const origLayout = fk.layout.bind(fk)
// forced-LTR font shares the same bytes but is a separate embed to compare fairly
const fontLtr = await doc.embedFont(fontBytes, { subset: true })
const fk2 = fontLtr.embedder.font
const orig2 = fk2.layout.bind(fk2)
fk2.layout = (s, features, script, language) => orig2(s, features, script, language, 'ltr')

const page = doc.addPage([595.28, 400])
const size = 36
const colors = {
  A: rgb(0, 0, 0), B: rgb(0.8, 0, 0), C: rgb(0, 0, 0.8), D: rgb(0, 0.5, 0)
}
const variants = [
  ['A', L, font], // logical, fontkit auto
  ['B', V, font], // bidi visual, fontkit auto
  ['C', V, fontLtr], // bidi visual, forced LTR
  ['D', L, fontLtr] // logical, forced LTR
]
let y = 340
for (const [tag, text, f] of variants) {
  page.drawText(text, { x: 40, y, size, font: f, color: colors[tag] })
  y -= 80
}
fs.writeFileSync('out/rtl-variants.pdf', await doc.save())
console.log(JSON.stringify({ L, V }))
