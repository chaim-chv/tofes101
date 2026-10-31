import { describe, expect, test } from "bun:test"
import { schema } from "../app/form/schema"
import { stepViews, validateAll, visibleSteps } from "../app/form/engine"
import { answersFingerprint, emptyState, setField, applyInitials } from "../app/form/values"

function passportState() {
  let state = applyInitials(schema, emptyState(2026))
  state = setField(state, "employee.idKind", "passport")
  return state
}

describe("step navigation", () => {
  test("visibleIndex follows the visible list, not the schema list", () => {
    const state = passportState()
    const views = stepViews(schema, state, validateAll(schema, state))
    const visible = visibleSteps(schema, state)

    const income = views.find((v) => v.id === "income")!
    expect(income.index).toBe(schema.steps.findIndex((s) => s.id === "income"))
    expect(income.visibleIndex).toBe(visible.findIndex((s) => s.id === "income"))
    // The skipped children step must not shift the target of a rail click.
    expect(visible[income.visibleIndex]?.id).toBe("income")
  })

  test("skipped steps have visibleIndex -1", () => {
    const views = stepViews(schema, passportState(), validateAll(schema, passportState()))
    expect(views.find((v) => v.id === "children")?.status).toBe("skipped")
    expect(views.find((v) => v.id === "children")?.visibleIndex).toBe(-1)
  })
})

describe("signature fingerprint", () => {
  test("is stable for the same answers and independent of key order", () => {
    const a = setField(setField(emptyState(2026), "employee.firstName", "דנה"), "employee.city", "חיפה")
    const b = setField(setField(emptyState(2026), "employee.city", "חיפה"), "employee.firstName", "דנה")
    expect(answersFingerprint(a)).toBe(answersFingerprint(b))
  })

  test("changes when a covered answer changes", () => {
    const a = setField(emptyState(2026), "employee.firstName", "דנה")
    const b = setField(emptyState(2026), "employee.firstName", "דניאל")
    expect(answersFingerprint(a)).not.toBe(answersFingerprint(b))
  })

  test("ignores signature/date fields", () => {
    const a = emptyState(2026)
    const b = setField(a, "sign.date", "2026-10-31")
    expect(answersFingerprint(a)).toBe(answersFingerprint(b))
  })
})
