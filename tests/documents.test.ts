import { describe, expect, test } from "bun:test"
import { documentChecklist, requiredDocuments } from "../app/form/documents"
import { emptyState, setField } from "../app/form/values"
import type { FormState } from "../app/form/types"

function stateWith(values: Record<string, unknown>): FormState {
  let s = emptyState(2026)
  for (const [k, v] of Object.entries(values)) s = setField(s, k, v)
  return s
}

const ids = (s: FormState) => documentChecklist(s).map((d) => d.id)

describe("document checklist", () => {
  test("an ID holder is asked only for the ID copy", () => {
    expect(ids(stateWith({ "employee.idKind": "idNum" }))).toEqual(["id"])
  })

  test("a passport holder is asked for passport + residence permit", () => {
    expect(ids(stateWith({ "employee.idKind": "passport" }))).toEqual(["passport", "residence"])
  })

  test("being separated adds the assessor certificate, as required", () => {
    const s = stateWith({ "employee.idKind": "idNum", "employee.maritalStatus": "separated" })
    const docs = documentChecklist(s)
    expect(docs.find((d) => d.id === "assessor")?.required).toBe(true)
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
  })

  test("turning an answer off removes its document again", () => {
    const on = stateWith({ "employee.idKind": "idNum", "credits.studies": true })
    const off = stateWith({ "employee.idKind": "idNum", "credits.studies": false })
    expect(ids(on)).toContain("form119")
    expect(ids(off)).not.toContain("form119")
  })

  test("requiredDocuments is a subset", () => {
    const s = stateWith({ "employee.idKind": "passport", "credits.locality": true })
    const all = documentChecklist(s)
    const req = requiredDocuments(s)
    expect(req.length).toBeLessThanOrEqual(all.length)
    expect(req.every((r) => r.required)).toBe(true)
  })
})
