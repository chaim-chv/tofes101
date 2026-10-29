// Prototype: overlay Hebrew values onto the OFFICIAL flat PDF (no AcroForm).
// Verified against pdf-lib 1.17.1 + @pdf-lib/fontkit 1.1.1 + bidi-js 1.1.0.
import fs from 'node:fs'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { drawRtl } from './lib/rtl-tokens.mjs'

const fontBytes = fs.readFileSync('../scaffold/app/assets/fonts/Heebo-Variable.ttf')
const sigBytes = fs.readFileSync('signature-spike.png')

const pdfDoc = await PDFDocument.load(fs.readFileSync('tofes-101-official.pdf'))
pdfDoc.registerFontkit(fontkit)
const font = await pdfDoc.embedFont(fontBytes, { subset: true })
const sig = await pdfDoc.embedPng(sigBytes)
const page = pdfDoc.getPage(0)
const H = page.getHeight() // 841.89

const ink = rgb(0.05, 0.12, 0.55)

// xRight = right edge of the value box; y = baseline measured FROM TOP (like the
// coordinates extracted with pdfjs), converted to PDF bottom-left here.
function placeRtl(text, { xRight, yTop, size = 9, color = ink }) {
  const width = drawRtl(page, font, text, { xRight, y: H - yTop, size, color })
  return { text, width: +width.toFixed(2) }
}

const log = {}
log.lastName = placeRtl('כהן', { xRight: 391, yTop: 226, size: 10 })
log.firstName = placeRtl('דוד', { xRight: 276, yTop: 226, size: 10 })
log.id = placeRtl('123456789', { xRight: 492, yTop: 226, size: 10 })
log.year = placeRtl('2026', { xRight: 330, yTop: 112, size: 10 })
log.employer = placeRtl('חברת דוגמה בע"מ', { xRight: 521, yTop: 172, size: 9 })

// signature image in the "חתימת העובד/ת" row (bottom-left)
page.drawImage(sig, { x: 96, y: 52, width: 120, height: 40 })

const bytes = await pdfDoc.save()
fs.mkdirSync('out', { recursive: true })
fs.writeFileSync('out/filled-official.pdf', bytes)
console.log(JSON.stringify({ bytes: bytes.length, log }, null, 2))
