import { describe, expect, test } from "bun:test"
import { documentChecklist, documentStatus, documentsSummary } from "../app/form/documents"
import type { DocumentRequirement } from "../app/form/documents"
import { emptyState, setField } from "../app/form/values"
import type { FormState } from "../app/form/types"

function stateWith(values: Record<string, unknown>): FormState {
  let s = emptyState(2026)
  for (const [k, v] of Object.entries(values)) s = setField(s, k, v)
  return s
}

const ids = (s: FormState) => documentChecklist(s).map((d) => d.id)

function need(s: FormState, id: string): DocumentRequirement {
  const found = documentChecklist(s).find((d) => d.id === id)
  if (!found) throw new Error(`missing document need ${id}`)
  return found
}

const idHolder = () => stateWith({ "employee.idKind": "idNum" })

describe("document checklist", () => {
  test("an ID holder is asked only for the ID copy", () => {
    expect(ids(idHolder())).toEqual(["id"])
  })

  test("the ID copy is a required identity document, not 'recommended'", () => {
    const doc = need(idHolder(), "id")
    expect(doc.level).toBe("identity")
    expect(doc.noteKey).toBe("doc.note.id")
  })

  test("a passport holder is asked for passport + residence permit", () => {
    expect(ids(stateWith({ "employee.idKind": "passport" }))).toEqual(["passport", "residence"])
  })

  test("being separated adds the assessor certificate as a claim document", () => {
    const s = stateWith({ "employee.idKind": "idNum", "employee.maritalStatus": "separated" })
    const doc = need(s, "assessor")
    expect(doc.level).toBe("credit")
    expect(doc.handover).toBe(true)
  })

  test("the disabled item pulls its monthly stipend proof too", () => {
    const s = stateWith({
      "employee.idKind": "idNum",
      "credits.disabled": true,
      "credits.disabledMonthly": true,
    })
    expect(ids(s)).toContain("disability")
    expect(ids(s)).toContain("stipend")
  })

  test("immigrant type picks the right certificate", () => {
    const oleh = stateWith({ "credits.immigrant": true, "credits.immigrantType": "immigrant" })
    const back = stateWith({ "credits.immigrant": true, "credits.immigrantType": "returning" })
    expect(ids(oleh)).toContain("immigrant")
    expect(ids(back)).toContain("immigrant")
  })

  test("coordination reason decides which proof is needed", () => {
    const none = stateWith({ "coord.request": true, "coord.reason": "no-previous-income" })
    const others = stateWith({ "coord.request": true, "coord.reason": "other-incomes" })
    const approved = stateWith({ "coord.request": true, "coord.reason": "approved" })
    expect(ids(none)).toContain("noIncome")
    expect(ids(others)).toContain("payslips")
    expect(ids(approved)).toContain("approval")
    expect(need(approved, "approval").level).toBe("coordination")
  })

  test("turning an answer off removes its document again", () => {
    const on = stateWith({ "employee.idKind": "idNum", "credits.studies": true })
    const off = stateWith({ "employee.idKind": "idNum", "credits.studies": false })
    expect(ids(on)).toContain("form119")
    expect(ids(off)).not.toContain("form119")
  })
})

describe("document status", () => {
  test("one multi-page ID file satisfies the ID + annex requirement", () => {
    const id = need(idHolder(), "id")
    expect(documentStatus(id, new Set())).toBe("missing")
    expect(documentStatus(id, new Set(["id-front"]))).toBe("attached")
    expect(documentStatus(id, new Set(["id-annex"]))).toBe("attached")
  })

  test("passport and residence each need their own slot", () => {
    const s = stateWith({ "employee.idKind": "passport" })
    expect(documentStatus(need(s, "passport"), new Set())).toBe("missing")
    expect(documentStatus(need(s, "passport"), new Set(["passport"]))).toBe("attached")
    expect(documentStatus(need(s, "residence"), new Set(["passport"]))).toBe("missing")
  })

  test("documents the app cannot carry are marked for hand-over", () => {
    const s = stateWith({ "employee.idKind": "idNum", "credits.studies": true })
    expect(documentStatus(need(s, "form119"), new Set(["id-front"]))).toBe("handover")
  })

  test("summary counts uploadable documents separately from hand-over ones", () => {
    const s = stateWith({ "employee.idKind": "idNum", "credits.studies": true })
    const all = documentChecklist(s)
    expect(documentsSummary(all, new Set(["id-front"]))).toEqual({
      needed: 2,
      uploadable: 1,
      attached: 1,
      missing: 0,
    })
    expect(documentsSummary(all, new Set())).toEqual({
      needed: 2,
      uploadable: 1,
      attached: 0,
      missing: 1,
    })
  })
})
