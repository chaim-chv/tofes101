// Deterministic RTL line layout for pdf-lib + fontkit.
//
// Empirically (fontkit 1.1.1 via @pdf-lib/fontkit):
//  * a string whose script is Hebrew is glyph-reversed as a whole, which also
//    reverses word order and embedded digits;
//  * a pure-Latin/digit string is drawn LTR.
// So we tokenise into bidi runs, split RTL runs into words + spaces, keep LTR
// runs intact, and place tokens right-to-left ourselves. Each Hebrew token is
// drawn alone (fontkit reverses its letters correctly), each LTR token is drawn
// alone (no reversal).
import bidiFactory from 'bidi-js'

const bidi = bidiFactory()
const MIRROR = new Map([
  ['(', ')'], [')', '('], ['[', ']'], [']', '['], ['{', '}'], ['}', '{'],
  ['<', '>'], ['>', '<'], ['«', '»'], ['»', '«'], ['‹', '›'], ['›', '‹']
])
const RTL_CHAR = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0780-\u07BF\uFB1D-\uFDFF\uFE70-\uFEFF]/

export function rtlTokens(text, base = 'rtl') {
  const { levels } = bidi.getEmbeddingLevels(text, base)
  const runs = []
  let start = 0
  for (let i = 1; i <= text.length; i++) {
    if (i === text.length || (levels[i] & 1) !== (levels[start] & 1)) {
      runs.push({ text: text.slice(start, i), rtl: (levels[start] & 1) === 1 })
      start = i
    }
  }
  const pieces = []
  for (const run of runs) {
    if (!run.rtl) {
      pieces.push(run.text)
      continue
    }
    // split Hebrew run into words and whitespace, keeping order
    for (const part of run.text.split(/(\s+)/)) {
      if (!part) continue
      pieces.push([...part].map((c) => MIRROR.get(c) ?? c).join(''))
    }
  }
  return pieces
}

export function measureRtl(font, text, size) {
  return rtlTokens(text).reduce((sum, t) => sum + font.widthOfTextAtSize(t, size), 0)
}

export function drawRtl(page, font, text, { xRight, y, size, color }) {
  const tokens = rtlTokens(text)
  const widths = tokens.map((t) => font.widthOfTextAtSize(t, size))
  const total = widths.reduce((a, b) => a + b, 0)
  let x = xRight - total
  // visual order = reverse logical token order for an RTL paragraph
  for (let i = tokens.length - 1; i >= 0; i--) {
    page.drawText(tokens[i], { x, y, size, font, color })
    x += widths[i]
  }
  return total
}

export function hasRtl(text) {
  return RTL_CHAR.test(text)
}
