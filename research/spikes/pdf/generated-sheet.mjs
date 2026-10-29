// Generated (not overlaid) A4 Hebrew document: right-aligned, wrapped, mixed digits.
import fs from 'node:fs'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { drawRtl, measureRtl } from './lib/rtl-tokens.mjs'
const fontBytes = fs.readFileSync('../scaffold/app/assets/fonts/Heebo-Variable.ttf')

const doc = await PDFDocument.create()
doc.registerFontkit(fontkit)
const font = await doc.embedFont(fontBytes, { subset: true })
const page = doc.addPage([595.28, 841.89])
const H = page.getHeight()
const ink = rgb(0.1, 0.1, 0.1)
const RIGHT = 545

function wrap(text, size, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (measureRtl(font, next, size) > maxWidth && line) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

function paragraph(text, { yTop, size = 12, leading = 18, color = ink }) {
  const lines = wrap(text, size, RIGHT - 50)
  lines.forEach((line, i) => {
    drawRtl(page, font, line, { xRight: RIGHT, y: H - (yTop + i * leading), size, color })
  })
  return yTop + lines.length * leading
}

const title = 'נספח לטיוטת טופס 101'
const tw = measureRtl(font, title, 22)
drawRtl(page, font, title, { xRight: (595.28 + tw) / 2, y: H - 70, size: 22, color: rgb(0.04, 0.3, 0.2) })

let y = 120
const rows = [
  ['שם משפחה', 'כהן'],
  ['שם פרטי', 'דוד'],
  ['מספר זהות', '123456789'],
  ['שנת מס', '2026'],
  ['מעסיק', 'חברת דוגמה בע"מ'],
  ['משכורת חודשית', '12,345.00 ₪']
]
for (const [label, value] of rows) {
  drawRtl(page, font, `${label}:`, { xRight: RIGHT, y: H - y, size: 11, color: rgb(0.45, 0.45, 0.45) })
  drawRtl(page, font, value, { xRight: RIGHT, y: H - (y + 18), size: 13, color: ink })
  page.drawLine({ start: { x: 50, y: H - (y + 26) }, end: { x: RIGHT, y: H - (y + 26) }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  y += 46
}

y += 20
y = paragraph(
  'הנתונים בטופס זה נשמרים במכשיר שלך בלבד ואינם נשלחים לשרת. ניתן לייצא קובץ JSON לגיבוי ולשחזר אותו בכל מכשיר. ' +
    'סכום הברוטו החודשי הוא 12,345.00 ש״ח, ומספר שעות העבודה 182.5.',
  { yTop: y, size: 12, leading: 20 }
)

paragraph(
  'חתימה אלקטרונית: החתימה המצורפת היא תמונת חתימה שהוזנה על ידי המשתמש. אין לראות בה חתימה אלקטרונית מאושרת.',
  { yTop: y + 20, size: 10, color: rgb(0.45, 0.45, 0.45) }
)

fs.writeFileSync('out/generated-hebrew.pdf', await doc.save())
console.log('wrote out/generated-hebrew.pdf')
