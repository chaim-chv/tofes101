// Minimal bidi line layout for pdf-lib + fontkit.
//
// WHY: fontkit (inside pdf-lib) already reverses glyph order for RTL scripts and
// shapes Hebrew correctly, but it does NOT run the Unicode bidi algorithm. So a
// logical string like "שלום 123" renders its digits mirrored. Feeding a
// bidi-reordered string makes it worse (fontkit reverses it again).
//
// FIX: split the line into bidi runs with bidi-js, draw each run as its own
// string (fontkit handles RTL runs; LTR runs are drawn as-is), and lay the runs
// out right-to-left for a Hebrew paragraph.
import bidiFactory from 'bidi-js'

const bidi = bidiFactory()

const MIRROR = new Map([
  ['(', ')'], [')', '('], ['[', ']'], [']', '['], ['{', '}'], ['}', '{'],
  ['<', '>'], ['>', '<'], ['«', '»'], ['»', '«'], ['‹', '›'], ['›', '‹']
])

/** Split into runs of equal bidi level; returns logical-order runs. */
export function bidiRuns(text, base = 'rtl') {
  const { levels } = bidi.getEmbeddingLevels(text, base)
  const runs = []
  let start = 0
  for (let i = 1; i <= text.length; i++) {
    if (i === text.length || (levels[i] & 1) !== (levels[start] & 1)) {
      const raw = text.slice(start, i)
      const rtl = (levels[start] & 1) === 1
      const str = rtl ? [...raw].map((c) => MIRROR.get(c) ?? c).join('') : raw
      runs.push({ text: str, rtl })
      start = i
    }
  }
  return runs
}

/** Total width of a line at a given font size. */
export function bidiWidth(font, text, size, base = 'rtl') {
  return bidiRuns(text, base).reduce((sum, r) => sum + font.widthOfTextAtSize(r.text, size), 0)
}

/**
 * Draw one logical line, right-aligned at xRight, baseline y (PDF coordinates).
 * Returns the drawn width.
 */
export function drawBidiLine(page, font, text, { xRight, y, size, color, base = 'rtl' }) {
  const runs = bidiRuns(text, base)
  const widths = runs.map((r) => font.widthOfTextAtSize(r.text, size))
  const total = widths.reduce((a, b) => a + b, 0)
  // Visual order for an RTL paragraph is the reverse of logical run order:
  // the last logical run sits leftmost. Each run's own glyphs are reversed by
  // fontkit when the run is RTL.
  let x = xRight - total
  for (let i = runs.length - 1; i >= 0; i--) {
    page.drawText(runs[i].text, { x, y, size, font, color })
    x += widths[i]
  }
  return total
}
