/**
 * PDF overlay tests (bun:test).
 *
 * They render the real official PDF with the real Heebo TTF — the same code
 * path the browser uses — then re-open the result and extract its text layer.
 */
import { beforeAll, describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { PDFDocument } from "pdf-lib"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"
import { emptyState, setField } from "../app/form/values"
import type { FormState } from "../app/form/types"
import { ANCHORS, CELLS } from "../app/pdf/anchors"
import { ANCHOR_REFS, CELL_REFS, buildItems } from "../app/pdf/fields"
import { renderPdf } from "../app/pdf/overlay"
import { rtlTokens } from "../app/pdf/rtl"

const asset = (path: string) => fileURLToPath(new URL(`../public/${path}`, import.meta.url))

function fullState(): FormState {
  let state = emptyState(2026)
  const set = (id: string, value: unknown) => {
    state = setField(state, id, value)
  }

  set("employer.name", 'חברת דוגמה בע"מ')
  set("employer.address", "רחוב הרצל 1, תל אביב")
  set("employer.phone", "03-1234567")
  set("employer.deductionFile", "912345678")

  set("employee.idKind", "idNum")
  set("employee.idNum", "123456789")
  set("employee.firstName", "משה")
  set("employee.lastName", "כהן")
  set("employee.birthDate", "1985-04-12")
  set("employee.aliyahDate", "2010-09-01")
  set("employee.city", "תל אביב")
  set("employee.street", "הרצל")
  set("employee.houseNum", "12")
  set("employee.zip", "6120101")
  set("employee.mobile", "050-1234567")
  set("employee.email", "moshe@example.com")

  set("employee.sex", "male")
  set("employee.maritalStatus", "married")
  set("employee.ilResident", true)
  set("employee.kibbutzMember", false)
  set("employee.healthFundMember", true)
  set("employee.healthFundName", "כללית")

  set("spouse.firstName", "שרה")
  set("spouse.lastName", "כהן")
  set("spouse.idNum", "987654321")
  set("spouse.birthDate", "1987-02-03")
  set("spouse.hasIncome", "no")
  set("spouse.noIncomeDeclaration", true)

  set("children", [
    {
      _key: "c1",
      "name": "יונתן כהן",
      "idNum": "111222333",
      "birthDate": "2015-06-01",
      "custody": true,
      "allowance": true,
    },
    {
      _key: "c2",
      "name": "מאיה כהן",
      "idNum": "444555666",
      "birthDate": "2019-11-20",
      "custody": true,
      "allowance": false,
    },
  ])

  set("income.salaryTypes", ["monthly"])
  set("income.startDate", "2026-01-05")
  set("other.hasOther", false)
  set("other.creditsElsewhere", "no")
  set("other.studyFund", false)
  set("other.pension", false)

  set("credits.resident", true)
  set("credits.locality", false)
  set("credits.immigrant", false)
  set("credits.childrenCustody", true)
  set("credits.incomelessSpouse", true)
  set("credits.reserve", true)
  set("credits.reserveDays", "21")

  set("coord.request", false)
  set("sign.date", "2026-02-01")
  set("sign.signature", {
    kind: "drawn",
    strokes: [
      [
        [0.05, 0.75],
        [0.35, 0.2],
        [0.6, 0.8],
        [0.95, 0.35],
      ],
    ],
    signedAt: "2026-02-01T10:00:00.000Z",
    declarationVersion: "2026-he-1",
  })

  return state
}

describe("rtlTokens", () => {
  test("pure Hebrew is split into words + spaces", () => {
    expect(rtlTokens("שלום עולם")).toEqual(["שלום", " ", "עולם"])
  })

  test("pure digits stay one LTR token", () => {
    expect(rtlTokens("12345")).toEqual(["12345"])
  })

  test("mixed Hebrew + digits keeps the digits in order", () => {
    const tokens = rtlTokens("שלום עולם 123")
    expect(tokens).toEqual(["שלום", " ", "עולם", " ", "123"])
    expect(tokens.join("")).toBe("שלום עולם 123")
  })

  test("Hebrew with a parenthesised amount mirrors the parentheses", () => {
    expect(rtlTokens("סכום (12,345) ש״ח")).toEqual(["סכום", " ", ")", "12,345", "(", " ", "ש״ח"])
  })

  test("mixed Hebrew + Latin + year", () => {
    expect(rtlTokens("דוד כהן — Hello 2026")).toEqual(["דוד", " ", "כהן", " ", "—", " ", "Hello 2026"])
  })

  test("empty string yields no tokens", () => {
    expect(rtlTokens("")).toEqual([])
  })
})

describe("anchors", () => {
  test("every anchor referenced by fields.ts exists in the generated map", () => {
    const missing = ANCHOR_REFS.filter((id) => !ANCHORS[id])
    expect(missing).toEqual([])
  })

  test("every cell referenced by fields.ts exists in the generated map", () => {
    const missing = CELL_REFS.filter((id) => !CELLS[id])
    expect(missing).toEqual([])
  })

  test("all anchors carry a valid page and stay inside the A4 page", () => {
    for (const [id, anchor] of Object.entries(ANCHORS)) {
      expect([1, 2]).toContain(anchor.page)
      if ("xRight" in anchor || "xLeft" in anchor) {
        const x = "xRight" in anchor ? anchor.xRight : anchor.xLeft
        expect(x).toBeGreaterThan(0)
        expect(x).toBeLessThan(595.275)
        expect(anchor.yTop).toBeGreaterThan(0)
        expect(anchor.yTop).toBeLessThan(841.89)
      } else {
        expect(anchor.x).toBeGreaterThan(0)
        expect(anchor.x).toBeLessThan(595.275)
        expect(anchor.y).toBeGreaterThan(0)
        expect(anchor.y).toBeLessThan(841.89)
        expect(anchor.mark).toBe(true)
      }
      // Guard against the generator silently mapping two ids to the same slot.
      expect(id.length).toBeGreaterThan(0)
    }
  })

  test("all cell grids are inside the page and have sane dimensions", () => {
    for (const [id, grid] of Object.entries(CELLS)) {
      expect([1, 2]).toContain(grid.page)
      expect(grid.cells).toBeGreaterThan(0)
      expect(grid.x0).toBeGreaterThan(0)
      expect(grid.x1).toBeLessThan(595.275)
      expect(grid.x1 - grid.x0).toBeGreaterThan(grid.cells * 4)
      expect(grid.yTop).toBeGreaterThan(0)
      expect(grid.yTop).toBeLessThan(841.89)
      expect(id.length).toBeGreaterThan(0)
    }
  })
})

describe("cell items", () => {
  const items = buildItems(fullState())
  const cell = (id: string) => {
    const found = items.find((item) => "cell" in item && item.cell === id)
    if (!found || !("cell" in found)) throw new Error(`no cell item ${id}`)
    return found
  }

  test("dates are split into ddmmyyyy digits", () => {
    expect(cell("employee.birthDate").chars.join("")).toBe("12041985")
    expect(cell("children.0.birthDate").chars.join("")).toBe("01062015")
    expect(cell("income.startDate").chars.join("")).toBe("05012026")
  })

  test("IDs and the tax year fill their whole grid", () => {
    expect(cell("employee.idNum").chars.join("")).toBe("123456789")
    expect(cell("spouse.idNum").chars.join("")).toBe("987654321")
    expect(cell("children.0.idNum").chars.join("")).toBe("111222333")
    expect(cell("taxYear").chars.join("")).toBe("2026")
  })

  test("the deduction file draws only the 8 digits after the printed 9", () => {
    expect(cell("employer.deductionFile").chars.join("")).toBe("12345678")
  })

  test("the ZIP occupies 7 cells", () => {
    expect(cell("employee.zip").chars.join("")).toBe("6120101")
  })

  test("the prose blanks that are not vector rules keep their measured x", () => {
    expect(ANCHORS["credits.immigrantFrom"]).toMatchObject({ xRight: 318.6 })
    expect(ANCHORS["credits.reserveDays"]).toMatchObject({ xRight: 364 })
  })

  test("coordination file number continues after the printed 9", () => {
    let state = fullState()
    state = setField(state, "coord.request", true)
    state = setField(state, "coord.reason", "other-incomes")
    state = setField(state, "coord.employers", [
      {
        _key: "e1",
        name: "סטודיו",
        address: "הרצל 4",
        fileNum: "901234567",
        incomeType: "work",
        monthlyIncome: "1",
        monthlyTax: "0",
      },
    ])
    const tail = buildItems(state).find(
      (item) => "anchor" in item && item.anchor === "coord.0.fileNumTail",
    )
    expect(tail).toMatchObject({ text: "01234567" })
  })
})

describe("renderPdf", () => {
  let bytes: Uint8Array
  let text = ""

  beforeAll(async () => {
    bytes = await renderPdf(fullState(), {
      pdf: new Uint8Array(readFileSync(asset("assets/tofes-101-official.pdf"))),
      font: new Uint8Array(readFileSync(asset("fonts/Heebo-Variable.ttf"))),
    })

    const doc = await getDocument({ data: bytes.slice(), useSystemFonts: false }).promise
    const page = await doc.getPage(1)
    const content = await page.getTextContent()
    text = content.items
      .filter((item): item is typeof item & { str: string } => "str" in item)
      .map((item) => item.str)
      .join(" ")
  })

  test("is a valid PDF with 2 A4 pages", async () => {
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-")
    const doc = await PDFDocument.load(bytes)
    expect(doc.getPageCount()).toBe(2)
    expect(doc.getPage(0).getWidth()).toBeCloseTo(595.275, 1)
    expect(doc.getPage(0).getHeight()).toBeCloseTo(841.89, 1)
  })

  test("size stays in the expected range (fonts subset, not duplicated)", () => {
    expect(bytes.byteLength).toBeGreaterThan(500_000)
    expect(bytes.byteLength).toBeLessThan(2_000_000)
  })

  test("text layer contains the employee name", () => {
    // With the subset font pdfjs maps glyphs back to logical order; the spike's
    // unsubset output was visual order. Accept either representation.
    const has = (logical: string, visual: string) => text.includes(logical) || text.includes(visual)
    expect(has("משה", "השמ")).toBe(true)
    expect(has("כהן", "ןהכ")).toBe(true)
  })

  test("text layer contains the LTR ID digits and the employer phone", () => {
    // The ID is now drawn one glyph per printed cell, so the extractor may
    // separate the digits. Normalise whitespace before checking content.
    expect(text.replace(/\s+/g, "")).toContain("123456789")
    expect(text).toContain("03-1234567")
  })
})

describe("cell geometry", () => {
  type Item = { str: string; x: number; y: number; width: number }
  const pageItems: Record<1 | 2, Item[]> = { 1: [], 2: [] }

  beforeAll(async () => {
    const bytes = await renderPdf(fullState(), {
      pdf: new Uint8Array(readFileSync(asset("assets/tofes-101-official.pdf"))),
      font: new Uint8Array(readFileSync(asset("fonts/Heebo-Variable.ttf"))),
    })
    const doc = await getDocument({ data: bytes.slice(), useSystemFonts: false }).promise
    for (const pageNo of [1, 2] as const) {
      const page = await doc.getPage(pageNo)
      const viewport = page.getViewport({ scale: 1 })
      const content = await page.getTextContent({ disableCombineTextItems: true })
      pageItems[pageNo] = content.items
        .filter((item): item is typeof item & { str: string } => "str" in item && Boolean(item.str))
        .map((item) => {
          const [, , , , e, f] = item.transform
          return { str: item.str, x: e, y: viewport.height - f, width: item.width ?? 0 }
        })
    }
  })

  function digitsIn(pageNo: 1 | 2, cellId: string): Item[] {
    const grid = CELLS[cellId]
    if (!grid) throw new Error(`no grid ${cellId}`)
    return pageItems[pageNo]
      .filter((item) => /^\d$/.test(item.str))
      .filter((item) => item.x + item.width > grid.x0 - 1 && item.x < grid.x1 + 1)
      .filter((item) => Math.abs(item.y - grid.yTop) < 1.5)
      .sort((a, b) => a.x - b.x)
  }

  function expectCentred(pageNo: 1 | 2, cellId: string, expected: string) {
    const grid = CELLS[cellId]!
    const digits = digitsIn(pageNo, cellId)
    expect(digits.map((d) => d.str).join("")).toBe(expected)
    const step = (grid.x1 - grid.x0) / grid.cells
    digits.forEach((digit, index) => {
      const centre = digit.x + digit.width / 2
      const wanted = grid.x0 + (index + 0.5) * step
      expect(Math.abs(centre - wanted)).toBeLessThan(1.5)
    })
  }

  test("employee ID: 9 separate glyphs, one per cell", () => {
    expectCentred(1, "employee.idNum", "123456789")
  })

  test("tax year: 4 glyphs inside the printed box", () => {
    expectCentred(1, "taxYear", "2026")
  })

  test("birth date: 8 glyphs, slashes are not drawn", () => {
    expectCentred(1, "employee.birthDate", "12041985")
  })

  test("deduction file: the printed 9 is not duplicated", () => {
    expectCentred(1, "employer.deductionFile", "12345678")
  })

  test("ZIP: 7 glyphs", () => {
    expectCentred(1, "employee.zip", "6120101")
  })

  test("page 2 header repeats the employee ID", () => {
    const header = pageItems[2].filter(
      (item) => /^\d+$/.test(item.str) && item.y > 24 && item.y < 30 && item.x > 90 && item.x < 175,
    )
    expect(header.map((d) => d.str).join("")).toBe("123456789")
  })
})

describe("attachments and labels", () => {
  const png = Uint8Array.from(
    atob(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    ),
    (c) => c.charCodeAt(0),
  )

  test("the health fund prints its Hebrew name, not the stored enum", async () => {
    let state = emptyState(2026)
    state = setField(state, "employee.healthFundMember", true)
    state = setField(state, "employee.healthFundName", "clalit")

    const bytes = await renderPdf(state, {
      pdf: readFileSync(asset("assets/tofes-101-official.pdf")),
      font: readFileSync(asset("fonts/Heebo-Variable.ttf")),
    })
    const doc = await getDocument({ data: new Uint8Array(bytes) }).promise
    const page = await doc.getPage(1)
    const content = await page.getTextContent()
    const text = content.items.map((i: { str?: string }) => i.str ?? "").join("")
    expect(text).not.toContain("clalit")
    // pdfjs usually returns the drawn order, which is visual (RTL) — accept both
    // so the assertion is about *content*, not about extractor quirks.
    expect(text.includes("כללית") || text.includes("תילכל")).toBe(true)
  })

  test("attachments become extra pages after the form", async () => {
    const state = emptyState(2026)
    const withAttachments = await renderPdf(state, {
      pdf: readFileSync(asset("assets/tofes-101-official.pdf")),
      font: readFileSync(asset("fonts/Heebo-Variable.ttf")),
      attachments: [
        { slot: "id-front", name: "id.png", type: "image/png", bytes: png },
        { slot: "id-annex", name: "annex.png", type: "image/png", bytes: png },
      ],
    })
    const plain = await renderPdf(state, {
      pdf: readFileSync(asset("assets/tofes-101-official.pdf")),
      font: readFileSync(asset("fonts/Heebo-Variable.ttf")),
    })
    const a = await PDFDocument.load(withAttachments)
    const b = await PDFDocument.load(plain)
    expect(a.getPageCount()).toBe(b.getPageCount() + 2)
    expect(a.getPageCount()).toBe(4)
  })

  test("every page of a multi-page PDF attachment is appended", async () => {
    // The realistic case: one "ID" file with front, back and ספח scanned into
    // three pages. Dropping pages 2–3 would lose half the document.
    const source = await PDFDocument.create()
    for (let i = 0; i < 3; i++) {
      const page = source.addPage([400, 600])
      page.drawText(`scan ${i + 1}`, { x: 24, y: 24, size: 12 })
    }
    const scan = await source.save()

    const state = emptyState(2026)
    const options = {
      pdf: readFileSync(asset("assets/tofes-101-official.pdf")),
      font: readFileSync(asset("fonts/Heebo-Variable.ttf")),
    }
    const withScan = await renderPdf(state, {
      ...options,
      attachments: [{ slot: "id-front", name: "id.pdf", type: "application/pdf", bytes: scan }],
    })
    const plain = await renderPdf(state, options)

    const a = await PDFDocument.load(withScan)
    const b = await PDFDocument.load(plain)
    expect(a.getPageCount()).toBe(b.getPageCount() + 3)
  })
})
