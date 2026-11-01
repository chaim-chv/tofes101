/**
 * Generates `app/pdf/anchors.json` from the official flat PDF.
 *
 *   bun run tools/pdf/build-anchors.ts
 *
 * Why generate it: the official form has no AcroForm fields and no field names.
 * The only stable facts are the printed labels and the checkbox glyphs, so each
 * anchor is derived from the label's measured position plus a small, explicit
 * offset (documented per rule). The output is committed; re-run this script
 * whenever the Tax Authority publishes a new edition and update the rules whose
 * offsets no longer land inside the box.
 *
 * Coordinates are PDF points from the **top-left** of the page:
 *   - text anchors: `xRight` = right edge of the line, `yTop` = baseline;
 *   - mark anchors: `x`/`y` = centre of the printed checkbox glyph.
 * `app/pdf/overlay.ts` converts `yTop` to pdf-lib's bottom-left space.
 *
 * Build-time only. Uses the pdfjs legacy build (no DOM, no network).
 */
import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { getDocument, OPS } from "pdfjs-dist/legacy/build/pdf.mjs"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const PDF_PATH = `${ROOT}public/assets/tofes-101-official.pdf`
const OUT_PATH = `${ROOT}app/pdf/anchors.json`

type PageNo = 1 | 2

type RawItem = {
  text: string
  /** Visual left edge, PDF points. */
  x: number
  /** Baseline measured from the top of the page, PDF points. */
  y: number
  w: number
  h: number
  dir?: string
}

type TextRule = {
  id: string
  page: PageNo
  /** Substring of the printed label; trimmed exact match when `exact`. */
  label: string
  exact?: boolean
  /** Optional y window (distance from top) to disambiguate repeated labels. */
  within?: [number, number]
  /** Explicit right edge (cell edge). Defaults to label right edge + `dx`. */
  xRight?: number
  /** Explicit left edge for a fixed LTR run (the deduction-file tail). */
  xLeft?: number
  dx?: number
  /** Baseline offset from the label baseline. */
  dy: number
  size?: number
  maxWidth?: number
}

/**
 * A printed cell grid. The bounds are derived from the tick strokes, not from
 * the box border: several columns have an inset double border.
 *
 * `edges` says what the first/last tick means:
 *  - "internal": every tick separates two cells (x0 = first − step);
 *  - "left": the first tick is the left edge of the writing area;
 *  - "both": the first and last ticks are the outer edges (tax year).
 */
type GridRule = {
  id: string
  page: PageNo
  /** y window that contains the tick row (top-left points). */
  within: [number, number]
  /** x window that isolates this grid from other columns in the same row. */
  xWithin: [number, number]
  cells: number
  edges: "internal" | "left" | "both"
  /** Writing baseline. */
  yTop: number
  size?: number
  /** Expected cell groups (e.g. [2,2,4]); also selects the tall ticks. */
  groups?: number[]
  /** Characters already printed on the paper (not drawn by us). */
  preprinted?: string
  fill?: "start" | "end" | "center"
}

type MarkRule = {
  id: string
  page: PageNo
  /** Printed text next to the box ("כן", "לא", a whole sentence…). */
  label: string
  /** Group label used to pick the right copy of an ambiguous "כן"/"לא". */
  context?: string
  glyph?: "o" | "q"
  within?: [number, number]
}

const items: Record<PageNo, RawItem[]> = { 1: [], 2: [] }

/** Short vertical strokes: the printed cell ticks and date separators. */
type Tick = { x: number; top: number; len: number }
const ticks: Record<PageNo, Tick[]> = { 1: [], 2: [] }

let pdfDoc: Awaited<ReturnType<typeof getDocument>["promise"]> | undefined

async function loadItems() {
  const data = new Uint8Array(readFileSync(PDF_PATH))
  const doc = await getDocument({ data, useSystemFonts: false }).promise
  pdfDoc = doc
  for (const pageNo of [1, 2] as const) {
    const page = await doc.getPage(pageNo)
    const viewport = page.getViewport({ scale: 1 })
    const content = await page.getTextContent()
    items[pageNo] = content.items
      .filter((item): item is typeof item & { str: string } => "str" in item && Boolean(item.str.trim()))
      .map((item) => {
        const [, , c, d, e, f] = item.transform
        return {
          text: item.str,
          x: round(e),
          y: round(viewport.height - f),
          w: round(item.width ?? 0),
          h: round(Math.hypot(c, d)),
          dir: item.dir,
        }
      })
  }
}

/**
 * Cell ticks are vector strokes, not text. Walk the content stream, track the
 * CTM (each tick is drawn inside `q 1 0 0 1 x y cm ... Q`), keep vertical
 * segments 3–8.5 pt long, and flip them to top-left coordinates.
 */
type Matrix = [number, number, number, number, number, number]

function multiply(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ]
}

async function loadTicks() {
  if (!pdfDoc) throw new Error("loadItems() must run first")
  for (const pageNo of [1, 2] as const) {
    const page = await pdfDoc.getPage(pageNo)
    const height = page.getViewport({ scale: 1 }).height
    const ops = await page.getOperatorList()
    let ctm: Matrix = [1, 0, 0, 1, 0, 0]
    const stack: Matrix[] = []
    const apply = (m: Matrix, x: number, y: number) => ({
      x: m[0] * x + m[2] * y + m[4],
      y: m[1] * x + m[3] * y + m[5],
    })

    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i]
      if (fn === OPS.save) {
        stack.push([...ctm] as Matrix)
        continue
      }
      if (fn === OPS.restore) {
        ctm = stack.pop() ?? [1, 0, 0, 1, 0, 0]
        continue
      }
      if (fn === OPS.transform) {
        const t = (ops.argsArray[i] as number[]).slice(0, 6)
        if (t.length === 6) ctm = multiply(ctm, t as Matrix)
        continue
      }
      if (fn !== OPS.constructPath) continue

      const args = ops.argsArray[i] as unknown[]
      // pdfjs v6: [opIdx, [drawOps], minMax]; drawOps is numeric-keyed.
      const path = (args[1] as Array<Record<string, number>> | undefined)?.[0]
      if (!path) continue
      let cursor: { x: number; y: number } | null = null
      let start: { x: number; y: number } | null = null
      let k = 0
      while (k < Object.keys(path).length) {
        const op = path[k]
        if (op === 0 || op === 1) {
          const point = apply(ctm, path[k + 1] ?? 0, path[k + 2] ?? 0)
          if (op === 1 && cursor && Math.abs(cursor.x - point.x) < 0.1) {
            const top = Math.min(height - cursor.y, height - point.y)
            const len = Math.abs(cursor.y - point.y)
            if (len >= 3 && len <= 8.5) {
              ticks[pageNo].push({ x: round(point.x), top: round(top), len: round(len) })
            }
          }
          cursor = point
          if (op === 0) start = cursor
          k += 3
        } else if (op === 2 || op === 3) {
          const last = op === 2 ? 6 : 4
          cursor = apply(ctm, path[k + last - 1] ?? 0, path[k + last] ?? 0)
          k += op === 2 ? 7 : 5
        } else if (op === 4) {
          cursor = start
          k += 1
        } else {
          k += 1
        }
      }
    }
  }
}

const round = (n: number) => Math.round(n * 10) / 10
const centre = (item: RawItem) => ({ x: item.x + item.w / 2, y: item.y + item.h / 2 })
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y)

function matches(item: RawItem, label: string, exact = false) {
  const text = item.text.trim()
  return exact ? text === label.trim() : text.includes(label.trim())
}

function findLabel(page: PageNo, label: string, options: {
  exact?: boolean
  within?: [number, number]
} = {}): RawItem {
  const candidates = items[page].filter(
    (item) =>
      matches(item, label, options.exact) &&
      (!options.within || (item.y >= options.within[0] && item.y <= options.within[1])),
  )
  if (!candidates.length) {
    throw new Error(`label not found: ${JSON.stringify(label)} on page ${page}`)
  }
  return candidates[0]
}

function resolveText(rule: TextRule) {
  const label = findLabel(rule.page, rule.label, { exact: rule.exact, within: rule.within })
  const base = {
    page: rule.page,
    yTop: round(label.y + rule.dy),
    ...(rule.size ? { size: rule.size } : {}),
    ...(rule.maxWidth ? { maxWidth: rule.maxWidth } : {}),
  }
  if (rule.xLeft !== undefined) return { ...base, xLeft: round(rule.xLeft) }
  return { ...base, xRight: round(rule.xRight ?? label.x + label.w + (rule.dx ?? 0)) }
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

function resolveGrid(rule: GridRule) {
  const candidates = ticks[rule.page]
    .filter((t) => t.top >= rule.within[0] && t.top <= rule.within[1])
    .filter((t) => t.x >= rule.xWithin[0] && t.x <= rule.xWithin[1])
    .sort((a, b) => a.x - b.x)

  // Deduplicate near-identical strokes (the same tick can appear in two paths).
  const xs: number[] = []
  for (const tick of candidates) {
    if (!xs.length || tick.x - xs[xs.length - 1]! > 0.4) xs.push(tick.x)
  }
  if (xs.length < 2) throw new Error(`grid ${rule.id}: need at least 2 ticks, found ${xs.length}`)

  const step = median(xs.slice(1).map((x, i) => x - xs[i]!))
  let x0: number
  let x1: number
  if (rule.edges === "both") {
    x0 = xs[0]!
    x1 = xs[xs.length - 1]!
  } else if (rule.edges === "left") {
    x0 = xs[0]!
    x1 = xs[xs.length - 1]! + step
  } else {
    x0 = xs[0]! - step
    x1 = xs[xs.length - 1]! + step
  }
  const cells = Math.round((x1 - x0) / step)
  if (cells !== rule.cells) {
    throw new Error(`grid ${rule.id}: detected ${cells} cells, expected ${rule.cells} (${xs.join(", ")})`)
  }

  // The taller strokes are the printed day/month separators. Their boundary
  // indices must match the declared groups, otherwise the row moved.
  const groups = rule.groups
  if (groups) {
    const tall = candidates.filter((t) => t.len >= 6).map((t) => Math.round((t.x - x0) / step))
    const expected: number[] = []
    let sum = 0
    for (const size of groups.slice(0, -1)) {
      sum += size
      expected.push(sum)
    }
    const actual = [...new Set(tall)].filter((b) => b > 0 && b < cells).sort((a, b) => a - b)
    if (actual.join(",") !== expected.join(",")) {
      throw new Error(`grid ${rule.id}: separators at ${actual.join(",")}, expected ${expected.join(",")}`)
    }
  }

  return {
    page: rule.page,
    x0: round(x0),
    x1: round(x1),
    yTop: round(rule.yTop),
    cells: rule.cells,
    ...(rule.size ? { size: rule.size } : {}),
    ...(groups ? { groups } : {}),
    ...(rule.preprinted ? { preprinted: rule.preprinted } : {}),
    ...(rule.fill ? { fill: rule.fill } : {}),
  }
}

function resolveMark(rule: MarkRule) {
  const context = rule.context ? findLabel(rule.page, rule.context) : undefined
  const candidates = items[rule.page]
    .filter((item) => matches(item, rule.label))
    .filter((item) => !rule.within || (item.y >= rule.within[0] && item.y <= rule.within[1]))
  if (!candidates.length) throw new Error(`option label not found: ${rule.label} (page ${rule.page})`)

  // Ambiguous "כן"/"לא": choose the copy closest to its group label.
  const label = context
    ? candidates.reduce((best, item) =>
        distance(centre(item), centre(context)) < distance(centre(best), centre(context)) ? item : best,
      )
    : candidates[0]

  const glyph = rule.glyph ?? "o"
  // Every printed box sits immediately to the *right* of its label text. This
  // filter is what keeps the credit items on page 2 away from the small count
  // boxes of the children table (which are nearer, but to the left).
  const rightOfLabel = (item: RawItem) => item.x + item.w / 2 >= label.x + label.w - 1
  const allGlyphs = items[rule.page].filter((item) => item.text.trim() === glyph)
  const sideGlyphs = allGlyphs.filter(rightOfLabel)
  const glyphs = sideGlyphs.length ? sideGlyphs : allGlyphs
  if (!glyphs.length) throw new Error(`no ${glyph} glyphs on page ${rule.page}`)
  const target = centre(label)
  const nearest = glyphs.reduce((best, item) =>
    distance(centre(item), target) < distance(centre(best), target) ? item : best,
  )

  // The glyph's baseline is NOT the visual centre of the box: the printed
  // square rises ~9.2 pt above the baseline at the form's 10 pt size, so its
  // centre is baseline − 4.8. The visible square is also ~0.7 pt left of the
  // glyph advance centre (right side bearing).
  return {
    page: rule.page,
    x: round(nearest.x + nearest.w / 2 - 0.7),
    y: round(nearest.y - 4.8),
    mark: true as const,
    size: 8,
  }
}

/* ----------------------------------------------------------------- text map */

const TEXT: TextRule[] = [
  // ---- page 1 · employer (row box 154.2–185.4)
  { id: "employer.name", page: 1, label: "שם", exact: true, within: [150, 170], dx: -2, dy: 14, size: 9, maxWidth: 118 },
  { id: "employer.address", page: 1, label: "כתובת", exact: true, within: [150, 170], dx: -1.7, dy: 14, size: 9, maxWidth: 198 },
  { id: "employer.phone", page: 1, label: "מספר טלפון", exact: true, within: [150, 170], dx: -1.3, dy: 13.6, size: 9, maxWidth: 72 },

  // ---- page 1 · employee identity (row 213.2–236.5; value baseline 231)
  { id: "employee.firstName", page: 1, label: "שם פרטי", exact: true, within: [210, 225], dx: 1, dy: 12.7, size: 10, maxWidth: 100 },
  { id: "employee.lastName", page: 1, label: "שם משפחה", exact: true, within: [210, 225], dx: 0.8, dy: 12.7, size: 10, maxWidth: 120 },

  // ---- page 1 · address (sub-labels sit below the writing line at y≈254)
  { id: "employee.street", page: 1, label: "רחוב/שכונה", exact: true, within: [260, 268], xRight: 388, dy: -10.5, size: 9, maxWidth: 152 },
  { id: "employee.city", page: 1, label: "עיר/ישוב", exact: true, within: [260, 268], xRight: 199, dy: -10.5, size: 9, maxWidth: 88 },
  { id: "employee.houseNum", page: 1, label: "מספר", exact: true, within: [260, 268], xRight: 225.5, dy: -10.5, size: 9, maxWidth: 20 },

  // ---- page 1 · contact row (labels at 313–314, writing baseline 323.4)
  { id: "employee.mobile", page: 1, label: "מספר טלפון נייד", within: [310, 320], dx: -0.5, dy: 10, size: 9, maxWidth: 120 },
  { id: "employee.email", page: 1, label: "כתובת דואר אלקטרוני", within: [310, 320], dx: -0.6, dy: 9.5, size: 9, maxWidth: 170 },

  // ---- page 1 · health fund name (short rule left of "כן, שם הקופה")
  { id: "employee.healthFundName", page: 1, label: "כן, שם הקופה", within: [295, 305], xRight: 62, dy: 1, size: 8, maxWidth: 32 },

  // ---- page 1 · spouse (top row 686.8–710.8; value baseline 706)
  { id: "spouse.firstName", page: 1, label: "שם פרטי", exact: true, within: [685, 700], dx: 0.5, dy: 13.5, size: 10, maxWidth: 100 },
  { id: "spouse.lastName", page: 1, label: "שם משפחה", exact: true, within: [685, 700], dx: 0.1, dy: 13.5, size: 10, maxWidth: 120 },

  // ---- page 2 · header identity (the form repeats the employee ID on page 2)
  { id: "header.idNum", page: 2, label: "מספר זהות", within: [20, 30], xRight: 170.66, dy: 3.8, size: 9, maxWidth: 75 },

  // ---- page 2 · credit sub-values (all sit on the printed underline rules)
  { id: "credits.localityName", page: 2, label: "מתגוררים ביישוב", within: [115, 122], xRight: 438, dy: 1.3, size: 8, maxWidth: 140 },
  { id: "credits.localityFrom", page: 2, label: "מתאריך", exact: true, within: [100, 110], xRight: 329.6, dy: 1.9, size: 8, maxWidth: 74 },
  { id: "credits.immigrantFrom", page: 2, label: "אני עולה חדש/ה מתאריך", within: [125, 140], xRight: 318.6, dy: 0.4, size: 8, maxWidth: 74 },
  { id: "credits.immigrantNoIncomeUntil", page: 2, label: "לא היתה לי הכנסה בישראל", within: [140, 152], xRight: 248.6, dy: 2.5, size: 8, maxWidth: 56 },
  { id: "credits.serviceStart", page: 2, label: "תאריך תחילת השירות", within: [415, 430], xRight: 247.9, dy: 1.6, size: 8, maxWidth: 54 },
  { id: "credits.serviceEnd", page: 2, label: "תאריך סיום השירות", within: [415, 430], xRight: 116.9, dy: 2.6, size: 8, maxWidth: 57 },
  { id: "credits.reserveDays", page: 2, label: "שירתתי כלוחם/לוחמת מילואים", within: [455, 465], xRight: 364, dy: 0.6, size: 8, maxWidth: 44 },
  { id: "credits.disabledChildCount", page: 2, label: "אני הורה ל", exact: true, within: [360, 370], xRight: 465.2, dy: 1.9, size: 8, maxWidth: 18 },

  // ---- page 2 · declaration (writing lines at y = 655.9)
  { id: "sign.signature", page: 2, label: "חתימת המבקש/ת", within: [655, 670], xRight: 121, dy: -9.2, size: 10, maxWidth: 82 },
  { id: "sign.date", page: 2, label: "תאריך", exact: true, within: [655, 670], xRight: 226, dy: -7.3, size: 9, maxWidth: 84 },

  // ---- page 1 · children table (up to 5 visible rows; pitch 21.9, first baseline 396.2)
  ...Array.from({ length: 5 }, (_, row): TextRule[] => [
    { id: `children.${row}.name`, page: 1, label: "שם", exact: true, within: [370, 380], xRight: 514, dy: 20.7 + row * 21.9, size: 9, maxWidth: 62 },
  ]).flat(),

  // ---- page 2 · coordination table (3 rows; rows at 546.2/560.4/574.6, baseline 557 + 14.2·r)
  ...Array.from({ length: 3 }, (_, row): TextRule[] => {
    const dy = 14.6 + row * 14.2
    return [
      { id: `coord.${row}.name`, page: 2, label: "ש ם", within: [535, 550], xRight: 534, dy, size: 8, maxWidth: 88 },
      { id: `coord.${row}.address`, page: 2, label: "כ ת ו ב ת", within: [535, 550], xRight: 441, dy, size: 8, maxWidth: 126 },
      { id: `coord.${row}.fileNum`, page: 2, label: "מספר תיק ניכויים", within: [535, 550], xRight: 307, dy, size: 8, maxWidth: 64 },
      { id: `coord.${row}.fileNumTail`, page: 2, label: "מספר תיק ניכויים", within: [535, 550], xLeft: 242, dy, size: 8, maxWidth: 64 },
      { id: `coord.${row}.incomeType`, page: 2, label: "סוג ההכנסה", within: [520, 535], xRight: 228, dy: dy + 14, size: 8, maxWidth: 56 },
      { id: `coord.${row}.monthlyIncome`, page: 2, label: "הכנסה חודשית", within: [520, 535], xRight: 170, dy: dy + 14, size: 8, maxWidth: 74 },
      { id: `coord.${row}.monthlyTax`, page: 2, label: "המס שנוכה", within: [520, 535], xRight: 97, dy: dy + 14, size: 8, maxWidth: 66 },
    ]
  }).flat(),
]

/* ------------------------------------------------------------------ cell map */

/**
 * The printed cell grids. Bounds are tick-derived (see `resolveGrid`), so a new
 * edition that moves a row fails loudly instead of drifting.
 */
const GRIDS: GridRule[] = [
  { id: "taxYear", page: 1, within: [88, 100], xWithin: [215, 290], cells: 4, edges: "both", yTop: 98.2, size: 9 },

  // The pre-printed 9 lives in the margin cell [28.69, 39.89]; the eight
  // writing cells start at the first tick.
  {
    id: "employer.deductionFile",
    page: 1,
    within: [175, 184],
    xWithin: [38, 131],
    cells: 8,
    edges: "left",
    yTop: 180.3,
    size: 9,
    preprinted: "9",
  },

  // employee identity row (tall date separators + thin cell ticks)
  { id: "employee.aliyahDate", page: 1, within: [228, 234], xWithin: [28, 119.5], cells: 8, edges: "internal", groups: [2, 2, 4], yTop: 231, size: 9 },
  { id: "employee.birthDate", page: 1, within: [228, 234], xWithin: [118.5, 210.5], cells: 8, edges: "internal", groups: [2, 2, 4], yTop: 231, size: 9 },
  { id: "employee.idNum", page: 1, within: [228, 234], xWithin: [437, 541], cells: 9, edges: "internal", yTop: 231, size: 9 },

  // address row
  { id: "employee.zip", page: 1, within: [252, 259], xWithin: [28, 109], cells: 7, edges: "internal", yTop: 254, size: 9 },
  { id: "employee.passportNum", page: 1, within: [259, 266], xWithin: [391, 541], cells: 13, edges: "left", yTop: 259.8, size: 9 },

  // work-start date box (section ד)
  { id: "income.startDate", page: 1, within: [383, 389], xWithin: [30, 122], cells: 8, edges: "internal", groups: [2, 2, 4], yTop: 387, size: 9 },

  // children (5 visible rows; baseline/pitch as in the previous text rules)
  ...Array.from({ length: 5 }, (_, row): GridRule[] => {
    const yTop = 396.2 + row * 21.9
    return [
      {
        id: `children.${row}.birthDate`,
        page: 1,
        within: [391 + row * 21.9, 400.5 + row * 21.9],
        xWithin: [256, 348],
        cells: 8,
        edges: "internal",
        groups: [2, 2, 4],
        yTop,
        size: 9,
      },
      {
        id: `children.${row}.idNum`,
        page: 1,
        within: [391 + row * 21.9, 400.5 + row * 21.9],
        xWithin: [346, 449],
        cells: 9,
        edges: "internal",
        yTop,
        size: 9,
      },
    ]
  }).flat(),

  // spouse row + the second-line passport grid
  { id: "spouse.aliyahDate", page: 1, within: [702, 709], xWithin: [28, 120], cells: 8, edges: "internal", groups: [2, 2, 4], yTop: 706, size: 9 },
  { id: "spouse.birthDate", page: 1, within: [702, 709], xWithin: [119, 210.5], cells: 8, edges: "internal", groups: [2, 2, 4], yTop: 706, size: 9 },
  { id: "spouse.idNum", page: 1, within: [702, 709], xWithin: [437, 540], cells: 9, edges: "internal", yTop: 706, size: 9 },
  { id: "spouse.passportNum", page: 1, within: [730, 734], xWithin: [420, 540], cells: 13, edges: "internal", yTop: 731.9, size: 9 },
]

/* ----------------------------------------------------------------- mark map */

const MARKS: MarkRule[] = [
  // page 1 · sex
  { id: "employee.sex.male", page: 1, label: "זכר", within: [280, 295] },
  { id: "employee.sex.female", page: 1, label: "נקבה", within: [295, 310] },
  // page 1 · marital status
  { id: "employee.maritalStatus.single", page: 1, label: "רווק/ה", within: [280, 295] },
  { id: "employee.maritalStatus.married", page: 1, label: "נשוי/אה", within: [280, 295] },
  { id: "employee.maritalStatus.divorced", page: 1, label: "גרוש/ה", within: [280, 295] },
  { id: "employee.maritalStatus.widowed", page: 1, label: "אלמן/ה", within: [295, 310] },
  { id: "employee.maritalStatus.separated", page: 1, label: "פרוד/ה", within: [295, 310] },
  // page 1 · residency / kibbutz / health fund (ambiguity resolved by context label)
  { id: "employee.ilResident.yes", page: 1, label: "כן", context: "תושב ישראל", within: [280, 295] },
  { id: "employee.ilResident.no", page: 1, label: "לא", context: "תושב ישראל", within: [295, 310] },
  { id: "employee.kibbutzMember.no", page: 1, label: "לא", context: "חבר קיבוץ/מושב שיתופי", within: [280, 295] },
  { id: "employee.kibbutzIncome.yes", page: 1, label: "ממעסיק זה מועברות לקיבוץ", within: [280, 295] },
  { id: "employee.kibbutzIncome.no", page: 1, label: "ממעסיק זה אינן מועברות לקיבוץ", within: [295, 310] },
  { id: "employee.healthFundMember.no", page: 1, label: "לא", context: "חבר בקופת חולים", within: [280, 295] },
  { id: "employee.healthFundMember.yes", page: 1, label: "כן, שם הקופה", within: [295, 310] },
  // page 1 · spouse income
  { id: "spouse.hasIncome.yes", page: 1, label: "יש לבן/בת הזוג הכנסה", within: [720, 730] },
  { id: "spouse.hasIncome.no", page: 1, label: "אין לבן/בת הזוג כל הכנסה", within: [720, 730] },
  { id: "spouse.noIncomeDeclaration", page: 1, label: "אין לבן/בת הזוג כל הכנסה", within: [720, 730] },
  { id: "spouse.incomeTypes.work", page: 1, glyph: "q", label: "עבודה/קצבה/עסק", within: [720, 730] },
  { id: "spouse.incomeTypes.other", page: 1, glyph: "q", label: "הכנסה אחרת", within: [720, 730] },
  // page 1 · income from this employer (boxes at x≈238, y 366.5…426.5)
  { id: "income.salaryTypes.monthly", page: 1, label: "משכורת חודש", exact: true, within: [360, 372] },
  { id: "income.salaryTypes.additional", page: 1, label: "משכורת בעד משרה נוספת", exact: true, within: [372, 384] },
  { id: "income.salaryTypes.partial", page: 1, label: "משכורת חלקית", exact: true, within: [384, 396] },
  { id: "income.salaryTypes.daily", page: 1, label: "שכר עבודה", within: [396, 408] },
  { id: "income.salaryTypes.allowance", page: 1, label: "קצבה", exact: true, within: [408, 420] },
  { id: "income.salaryTypes.scholarship", page: 1, label: "מלגה", exact: true, within: [420, 432] },
  // page 1 · other income
  { id: "other.hasOther.no", page: 1, label: "אין לי הכנסות אחרות", within: [455, 470] },
  { id: "other.hasOther.yes", page: 1, label: "יש לי הכנסות אחרות כמפורט", within: [480, 495] },
  { id: "other.types.monthly", page: 1, label: "משכורת חודש", exact: true, within: [495, 505] },
  { id: "other.types.additional", page: 1, label: "משכורת בעד משרה נוספת", exact: true, within: [505, 516] },
  { id: "other.types.partial", page: 1, label: "משכורת חלקית", exact: true, within: [516, 527] },
  { id: "other.types.daily", page: 1, label: "שכר עבודה", within: [495, 505] },
  { id: "other.types.allowance", page: 1, label: "קצבה", exact: true, within: [505, 516] },
  { id: "other.types.scholarship", page: 1, label: "מלגה", exact: true, within: [516, 527] },
  { id: "other.creditsElsewhere.mine", page: 1, glyph: "q", label: "אבקש לקבל נקודות זיכוי", within: [540, 555] },
  { id: "other.creditsElsewhere.elsewhere", page: 1, glyph: "q", label: "אני מקבל/ת נקודות זיכוי", within: [560, 575] },
  { id: "other.studyFund", page: 1, glyph: "q", label: "אין מפרישים עבורי לקרן השתלמות", within: [588, 600] },
  { id: "other.pension", page: 1, glyph: "q", label: "אין מפרישים עבורי לקצבה", within: [620, 632] },

  // page 2 · section ח — 16 credit items + 2ב
  { id: "credits.1", page: 2, label: "אני תושב/ת ישראל." },
  { id: "credits.2", page: 2, label: "אני נכה" },
  { id: "credits.2b", page: 2, label: "בנוסף, אני מקבל תגמול חודשי" },
  { id: "credits.3", page: 2, label: "אני תושב/ת קבוע/ה בישוב מזכה" },
  { id: "credits.4", page: 2, label: "אני עולה חדש/ה מתאריך" },
  { id: "credits.5", page: 2, label: "בגין בן/בת זוגי המתגורר" },
  { id: "credits.6", page: 2, label: "אני הורה במשפחה חד הורית" },
  { id: "credits.7", page: 2, label: "בגין ילדיי שבחזקתי" },
  { id: "credits.8", page: 2, label: "בגין ילדיי המפורטים בחלק ג. ימולא" },
  { id: "credits.9", page: 2, label: "אני הורה יחיד" },
  { id: "credits.10", page: 2, label: "בגין ילדיי שאינם בחזקתי" },
  { id: "credits.11", page: 2, label: "אני הורה ל", exact: true },
  { id: "credits.12", page: 2, label: "בגין מזונות לבן/בת זוגי לשעבר." },
  { id: "credits.13", page: 2, label: "מלאו לי או לבן/בת זוגי" },
  { id: "credits.14", page: 2, label: "אני חייל/ת משוחרר/ת" },
  { id: "credits.15", page: 2, label: "בגין סיום לימודים לתואר אקדמי" },
  { id: "credits.16", page: 2, label: "שירתתי כלוחם/לוחמת מילואים" },

  // page 2 · section ט — coordination reasons
  { id: "coord.reason.no-previous-income", page: 2, label: "לא היתה לי הכנסה מתחילת שנת המס הנוכחית" },
  { id: "coord.reason.other-incomes", page: 2, label: "יש לי הכנסות נוספות ממשכורת" },
  { id: "coord.reason.approved", page: 2, label: "פקיד השומה אישר תיאום" },
  { id: "coord.approved", page: 2, label: "פקיד השומה אישר תיאום" },
]

/* ------------------------------------------------- children checkbox columns */

/**
 * The children table has no glyphs in its checkbox columns — the cells are
 * printed rules. Column centres come from the header numerals `1`/`2` (which
 * sit inside those cells); vertical centre = 391.3 + 21.9·row, measured from
 * the table's horizontal rules (header bottom 380.3, pitch 21.9).
 */
function childrenMarks() {
  const out: Record<string, ReturnType<typeof resolveMark>> = {}
  for (const [column, label] of [["custody", "1"], ["allowance", "2"]] as const) {
    const header = findLabel(1, label, { exact: true, within: [370, 380] })
    for (let row = 0; row < 5; row++) {
      out[`children.${row}.${column}`] = {
        page: 1,
        x: round(header.x + header.w / 2),
        y: round(391.3 + row * 21.9),
        mark: true,
        size: 8,
      }
    }
  }
  return out
}

/* -------------------------------------------------------------------- main */

await loadItems()
await loadTicks()

const anchors: Record<string, unknown> = {}
for (const rule of TEXT) anchors[rule.id] = resolveText(rule)
for (const rule of MARKS) anchors[rule.id] = resolveMark(rule)
Object.assign(anchors, childrenMarks())

const cells: Record<string, unknown> = {}
for (const rule of GRIDS) cells[rule.id] = resolveGrid(rule)

const sorted = Object.fromEntries(Object.keys(anchors).sort().map((key) => [key, anchors[key]]))
const sortedCells = Object.fromEntries(Object.keys(cells).sort().map((key) => [key, cells[key]]))
const hash = createHash("sha256").update(readFileSync(PDF_PATH)).digest("hex")
const payload = {
  $comment:
    "GENERATED — do not hand-edit. Regenerate with `bun run tools/pdf/build-anchors.ts`. " +
    "Coordinates are PDF points from the top-left: text = { xRight|xLeft, yTop(baseline) }, " +
    "mark = centre of the printed box, cells = x0..x1 / count / yTop(baseline). " +
    `Source PDF sha256: ${hash}.`,
  source: {
    file: "public/assets/tofes-101-official.pdf",
    sha256: hash,
    pages: 2,
    pageSize: { width: 595.275, height: 841.89 },
  },
  anchors: sorted,
  cells: sortedCells,
}

writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`)
console.log(`wrote ${Object.keys(sorted).length} anchors + ${Object.keys(sortedCells).length} cells → ${OUT_PATH}`)
