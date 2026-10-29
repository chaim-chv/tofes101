import fs from 'node:fs'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { drawRtlLine, prepareRtlLine } from './lib/rtl-once.mjs'
const fontBytes = fs.readFileSync('../scaffold/app/assets/fonts/Heebo-Variable.ttf')
const doc = await PDFDocument.create()
doc.registerFontkit(fontkit)
const font = await doc.embedFont(fontBytes, { subset: true })
const page = doc.addPage([595.28, 520])
const size = 30
const lines = ['שלום עולם 123','סכום (12,345) ש״ח','דוד כהן — Hello 2026','משכורת חודשית: 12,345.00 ₪']
let y = 470
for (const l of lines) { drawRtlLine(page, font, l, { xRight: 555, y, size, color: rgb(0,0,0) }); console.log(JSON.stringify(l), '->', JSON.stringify(prepareRtlLine(l))); y -= 70 }
fs.writeFileSync('out/rtl-once.pdf', await doc.save())
