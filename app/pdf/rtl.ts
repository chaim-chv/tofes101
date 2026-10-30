/**
 * Deterministic Hebrew/Arabic line layout for pdf-lib + fontkit.
 *
 * Why this file exists (empirical, measured with pdf-lib 1.17 + fontkit 1.1):
 *  - fontkit reverses the glyphs of a Hebrew run, so the letters read correctly
 *    BUT the reversal also reverses word order and any embedded digits:
 *    `שלום עולם 123` renders as `שלום עולם 321` and a mixed line mirrors.
 *  - fontkit does **not** implement UAX #9 (the Unicode bidi algorithm).
 *  - Re-ordering the string with bidi-js before drawing double-reverses it.
 *
 * Working recipe (IoU 0.79–0.83 vs Chrome, see research/spikes/RESULTS.md §4):
 *  1. ask bidi-js for embedding levels, split into bidi runs;
 *  2. keep LTR runs intact (digits, Latin, email, IDs);
 *  3. split RTL runs into words + whitespace, mirror paired punctuation;
 *  4. lay tokens out ourselves from the right edge, drawing each token alone so
 *     fontkit only reverses the letters inside a single word.
 *
 * Numbers/IDs/dates must go through the same function — they are LTR runs, so
 * they stay intact while the surrounding Hebrew is placed right-to-left.
 */
import bidiFactory from "bidi-js"
import type { Color, PDFFont, PDFPage } from "pdf-lib"

const bidi = bidiFactory()

/** Paired characters Unicode mirrors when the run direction is RTL. */
const MIRROR = new Map([
  ["(", ")"],
  [")", "("],
  ["[", "]"],
  ["]", "["],
  ["{", "}"],
  ["}", "{"],
  ["<", ">"],
  [">", "<"],
  ["«", "»"],
  ["»", "«"],
  ["‹", "›"],
  ["›", "‹"],
])

/** Hebrew, Arabic, Syriac, Thaana, NKo and their presentation forms. */
const RTL_CHAR =
  /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0780-\u07BF\uFB1D-\uFDFF\uFE70-\uFEFF]/

export type RtlOptions = {
  /** Right edge of the line, in PDF points. */
  xRight: number
  /** Baseline, in PDF points measured from the bottom-left (pdf-lib space). */
  y: number
  size: number
  color?: Color
}

/**
 * Split a logical string into the drawable tokens, in logical order.
 * LTR tokens may contain spaces (bidi keeps `Hello 2026` together); RTL tokens
 * are single words or whitespace with mirrored punctuation.
 */
export function rtlTokens(text: string, base: "rtl" | "ltr" = "rtl"): string[] {
  if (!text) return []
  const { levels } = bidi.getEmbeddingLevels(text, base)
  const runs: Array<{ text: string; rtl: boolean }> = []
  let start = 0
  for (let i = 1; i <= text.length; i++) {
    if (i === text.length || ((levels[i] ?? 0) & 1) !== ((levels[start] ?? 0) & 1)) {
      runs.push({ text: text.slice(start, i), rtl: ((levels[start] ?? 0) & 1) === 1 })
      start = i
    }
  }

  const pieces: string[] = []
  for (const run of runs) {
    if (!run.rtl) {
      pieces.push(run.text)
      continue
    }
    // Split a Hebrew run into words and whitespace, keeping logical order.
    for (const part of run.text.split(/(\s+)/)) {
      if (!part) continue
      pieces.push([...part].map((c) => MIRROR.get(c) ?? c).join(""))
    }
  }
  return pieces
}

/** Width of a line as it will actually be drawn. */
export function measureRtl(font: PDFFont, text: string, size: number): number {
  return rtlTokens(text).reduce((sum, token) => sum + font.widthOfTextAtSize(token, size), 0)
}

/**
 * Draw one logical line right-to-left. Returns the drawn width in points.
 * The caller is responsible for fitting (`measureRtl` + a smaller size) — no
 * silent clipping here.
 */
export function drawRtl(page: PDFPage, font: PDFFont, text: string, options: RtlOptions): number {
  const { xRight, y, size, color } = options
  const tokens = rtlTokens(text)
  if (!tokens.length) return 0

  const widths = tokens.map((token) => font.widthOfTextAtSize(token, size))
  const total = widths.reduce((a, b) => a + b, 0)
  let x = xRight - total

  // Visual order for an RTL paragraph is the reverse of logical token order.
  for (let i = tokens.length - 1; i >= 0; i--) {
    page.drawText(tokens[i]!, { x, y, size, font, color })
    x += widths[i]!
  }
  return total
}

/** True when the string contains an RTL script character. */
export function hasRtl(text: string): boolean {
  return RTL_CHAR.test(text)
}
