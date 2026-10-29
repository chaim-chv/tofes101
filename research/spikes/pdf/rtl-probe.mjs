// Controlled probe: does pdf-lib/fontkit already reorder Hebrew glyphs?
// Draws the logical string and the bidi-reordered string on separate lines.
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
const page = doc.addPage([595.28, 300])
const size = 36
const y1 = 220
const y2 = 140

page.drawText(logical, { x: 40, y: y1, size, font, color: rgb(0, 0, 0) })
page.drawText(visual, { x: 40, y: y2, size, font, color: rgb(0, 0, 0) })

console.log(JSON.stringify({ logical, visual, logicalWidth: font.widthOfTextAtSize(logical, size), visualWidth: font.widthOfTextAtSize(visual, size) }))
fs.writeFileSync('out/rtl-probe.pdf', await doc.save())
