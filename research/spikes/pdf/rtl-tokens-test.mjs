import fs from 'node:fs'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { drawRtl, rtlTokens } from './lib/rtl-tokens.mjs'
const fontBytes = fs.readFileSync('../scaffold/app/assets/fonts/Heebo-Variable.ttf')
const doc = await PDFDocument.create()
doc.registerFontkit(fontkit)
const font = await doc.embedFont(fontBytes, { subset: true })
const page = doc.addPage([595.28, 560])
const size = 30
const lines = ['שלום עולם 123','סכום (12,345) ש״ח','דוד כהן — Hello 2026','משכורת חודשית: 12,345.00 ₪','Hello דוד 2026','123456789']
let y = 510
for (const l of lines) { drawRtl(page, font, l, { xRight: 555, y, size, color: rgb(0,0,0) }); console.log(JSON.stringify(l), '->', JSON.stringify(rtlTokens(l))); y -= 70 }
fs.writeFileSync('out/rtl-tokens.pdf', await doc.save())
