// Correct approach for pdf-lib + fontkit:
// fontkit reverses the WHOLE logical string for an RTL script, so we must not
// lay out runs separately (that swaps word order). Instead, pre-compensate:
//  - reverse every embedded LTR run (digits, English, amounts)
//  - mirror brackets in RTL context
// then draw the whole string once and let fontkit reverse it.
import bidiFactory from 'bidi-js'

const bidi = bidiFactory()
const MIRROR = new Map([
  ['(', ')'], [')', '('], ['[', ']'], [']', '['], ['{', '}'], ['}', '{'],
  ['<', '>'], ['>', '<'], ['«', '»'], ['»', '«'], ['‹', '›'], ['›', '‹']
])

export function prepareRtlLine(text, base = 'rtl') {
  const { levels } = bidi.getEmbeddingLevels(text, base)
  let out = ''
  let i = 0
  while (i < text.length) {
    const lvl = levels[i]
    let j = i + 1
    while (j < text.length && (levels[j] & 1) === (lvl & 1)) j++
    let seg = text.slice(i, j)
    if ((lvl & 1) === 0) {
      // LTR run inside the RTL paragraph -> reverse so global reversal restores it
      seg = [...seg].reverse().join('')
    } else {
      seg = [...seg].map((c) => MIRROR.get(c) ?? c).join('')
    }
    out += seg
    i = j
  }
  return out
}

export function drawRtlLine(page, font, text, { xRight, y, size, color }) {
  const s = prepareRtlLine(text)
  const w = font.widthOfTextAtSize(s, size)
  page.drawText(s, { x: xRight - w, y, size, font, color })
  return w
}
