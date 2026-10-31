import { describe, expect, test } from "bun:test"
import { schema } from "../app/form/schema"
import {
  canAdvance,
  hiddenCount,
  isRequired,
  isVisible,
  progress,
  resolveEntryStep,
  stepViews,
  updateHidden,
  validateAll,
  validateField,
  visibleSteps,
} from "../app/form/engine"
import { emptyState, setField, addRepeatItem, applyInitials, newRepeatItem } from "../app/form/values"
import { ageAt, israeliId, parseDate } from "../app/form/validators"
import type { FormState } from "../app/form/types"

function stateWith(values: Record<string, unknown>): FormState {
  let state = emptyState(2026)
  for (const [id, value] of Object.entries(values)) state = setField(state, id, value)
  return state
}

const field = (id: string) => {
  const f = schema.allFields.find((x) => x.id === id)
  if (!f) throw new Error(`no field ${id}`)
  return f
}

describe("id validation", () => {
  test("accepts valid Israeli IDs", () => {
    for (const id of ["000000018", "123456782", "000000026"]) {
      expect(israeliId()(id, stateWith({})).length).toBe(0)
    }
  })

  test("rejects a bad check digit, a short number and all zeros", () => {
    expect(israeliId()("123456789", stateWith({})).map((i) => i.code)).toEqual(["id.checksum"])
    expect(israeliId()("12345678", stateWith({})).map((i) => i.code)).toEqual(["id.length"])
    expect(israeliId()("000000000", stateWith({})).map((i) => i.code)).toEqual(["id.zero"])
  })

  test("empty is not an error here (required is a separate rule)", () => {
    expect(israeliId()("", stateWith({})).length).toBe(0)
  })
})

describe("dates", () => {
  test("parses only real ISO dates", () => {
    expect(parseDate("2026-02-30")).toBeNull()
    expect(parseDate("2026-13-01")).toBeNull()
    expect(parseDate("2026-02-28")?.getUTCDate()).toBe(28)
    expect(parseDate("28/02/2026")).toBeNull()
  })

  test("age is birthday-aware", () => {
    const on = new Date(Date.UTC(2026, 9, 29)) // 29 Oct 2026
    expect(ageAt("2008-10-29", on)).toBe(18)
    expect(ageAt("2008-10-30", on)).toBe(17)
    expect(ageAt("2008-11-01", on)).toBe(17)
  })
})

describe("visibility", () => {
  test("passport holders lose the children step", () => {
    const idHolder = stateWith({ "employee.idKind": "idNum" })
    const passport = stateWith({ "employee.idKind": "passport" })
    expect(visibleSteps(schema, idHolder).map((s) => s.id)).toContain("children")
    expect(visibleSteps(schema, passport).map((s) => s.id)).not.toContain("children")
  })

  test("spouse fields appear only when married", () => {
    const single = stateWith({ "employee.maritalStatus": "single" })
    const married = stateWith({ "employee.maritalStatus": "married" })
    expect(isVisible(field("spouse.firstName"), single)).toBe(false)
    expect(isVisible(field("spouse.firstName"), married)).toBe(true)
  })

  test("hidden sub-fields follow their parent answer", () => {
    const noFund = stateWith({ "employee.healthFundMember": false })
    const yesFund = stateWith({ "employee.healthFundMember": true })
    expect(isVisible(field("employee.healthFundName"), noFund)).toBe(false)
    expect(isVisible(field("employee.healthFundName"), yesFund)).toBe(true)
  })

  test("other income opens its detail block only when true", () => {
    const none = stateWith({ "other.hasOther": false })
    const some = stateWith({ "other.hasOther": true })
    expect(isVisible(field("other.types"), none)).toBe(false)
    expect(isVisible(field("other.types"), some)).toBe(true)
  })

  test("credits are blocked when the user uses them elsewhere", () => {
    const elsewhere = stateWith({ "other.hasOther": true, "other.creditsElsewhere": "yes" })
    expect(isVisible(field("credits.resident"), elsewhere)).toBe(false)
    expect(isVisible(field("credits.blocked"), elsewhere)).toBe(true)
  })
})

describe("requiredness", () => {
  test("employer name is required unless marked unknown", () => {
    expect(isRequired(field("employer.name"), stateWith({}))).toBe(true)
    expect(isRequired(field("employer.name"), stateWith({ "employer.unknown": true }))).toBe(false)
  })

  test("email is optional, mobile is required", () => {
    expect(isRequired(field("employee.email"), stateWith({}))).toBe(false)
    expect(isRequired(field("employee.mobile"), stateWith({}))).toBe(true)
  })
})

describe("validation", () => {
  test("required field reports exactly one error", () => {
    const issues = validateField(field("employee.firstName"), stateWith({}))
    expect(issues).toHaveLength(1)
    expect(issues[0]?.code).toBe("required")
  })

  test("invalid ID is reported once, not twice", () => {
    const issues = validateField(field("employee.idNum"), stateWith({ "employee.idNum": "123456789" }))
    expect(issues.map((i) => i.code)).toEqual(["id.checksum"])
  })

  test("start date must be inside the tax year", () => {
    const bad = validateField(field("income.startDate"), stateWith({ "income.startDate": "2025-05-01" }))
    expect(bad.map((i) => i.messageKey)).toContain("err.date.outsideTaxYear")
    const good = validateField(field("income.startDate"), stateWith({ "income.startDate": "2026-05-01" }))
    expect(good).toHaveLength(0)
  })

  test("mobile must be an Israeli mobile number", () => {
    const bad = validateField(field("employee.mobile"), stateWith({ "employee.mobile": "031234567" }))
    expect(bad.map((i) => i.code)).toContain("phone.mobile")
    const good = validateField(field("employee.mobile"), stateWith({ "employee.mobile": "0501234567" }))
    expect(good).toHaveLength(0)
  })

  test("hidden fields are never validated", () => {
    const single = stateWith({ "employee.maritalStatus": "single" })
    expect(validateField(field("spouse.firstName"), single)).toHaveLength(0)
  })
})

describe("step gating", () => {
  test("identity step cannot advance while empty", () => {
    const empty = stateWith({})
    expect(canAdvance(schema, empty, "identity").ok).toBe(false)
  })

  test("identity step advances once the required answers are valid", () => {
    const ok = stateWith({
      "employee.idKind": "idNum",
      "employee.idNum": "123456782",
      "employee.firstName": "דנה",
      "employee.lastName": "כהן",
      "employee.birthDate": "1990-01-01",
    })
    expect(canAdvance(schema, ok, "identity").errors).toEqual([])
  })

  test("a skipped step is not validated", () => {
    const passport = stateWith({
      "employee.idKind": "passport",
      "employee.passportCountry": "France",
      "employee.passportNum": "X123",
      "employee.firstName": "Jean",
      "employee.lastName": "Dupont",
      "employee.birthDate": "1990-01-01",
    })
    expect(canAdvance(schema, passport, "children").ok).toBe(true)
  })
})

describe("hidden answers are never lost", () => {
  test("turning a branch off keeps the answers and records them as hidden", () => {
    let state = stateWith({ "employee.maritalStatus": "married" })
    state = setField(state, "spouse.firstName", "יוסי")
    state = updateHidden(schema, setField(state, "employee.maritalStatus", "single"))
    expect(state.values["spouse.firstName"]).toBe("יוסי")
    expect(hiddenCount(state)).toBeGreaterThan(0)
  })

  test("turning it back on restores visibility without retyping", () => {
    let state = stateWith({ "employee.maritalStatus": "married" })
    state = setField(state, "spouse.firstName", "יוסי")
    state = updateHidden(schema, setField(state, "employee.maritalStatus", "single"))
    state = updateHidden(schema, setField(state, "employee.maritalStatus", "married"))
    expect(isVisible(field("spouse.firstName"), state)).toBe(true)
    expect(state.values["spouse.firstName"]).toBe("יוסי")
    expect(hiddenCount(state)).toBe(0)
  })
})

describe("steps and progress", () => {
  test("progress counts only visible steps", () => {
    const passport = stateWith({ "employee.idKind": "passport" })
    const p = progress(schema, passport)
    expect(p.total).toBe(visibleSteps(schema, passport).length)
    expect(p.pct).toBe(0)
  })

  test("step views mark skipped steps", () => {
    const passport = stateWith({ "employee.idKind": "passport" })
    const views = stepViews(schema, passport, validateAll(schema, passport))
    expect(views.find((v) => v.id === "children")?.status).toBe("skipped")
  })

  test("deep-linking past an invalid step redirects to it", () => {
    const state = stateWith({})
    const entry = resolveEntryStep(schema, state, 5)
    expect(entry.redirected).toBe(true)
    expect(entry.index).toBeLessThan(5)
  })
})

describe("full validation", () => {
  test("an empty form reports errors only for visible required fields", () => {
    const result = validateAll(schema, stateWith({}))
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors.every((e) => e.severity === "error")).toBe(true)
    // the children step has no required fields until a row exists
    expect(result.byStep.children ?? []).toEqual([])
  })

  test("a repeated row validates its sub-fields", () => {
    let state = stateWith({ "employee.idKind": "idNum" })
    state = addRepeatItem(state, "children", field("children").fields)
    const result = validateAll(schema, state)
    expect(result.errors.some((e) => e.field.startsWith("children."))).toBe(true)
  })
})


describe("strict identity rules", () => {
  test("letters in an ID are reported, not silently stripped", () => {
    const issues = validateField(field("employee.idNum"), stateWith({ "employee.idNum": "12a456782" }))
    expect(issues.map((i) => i.code)).toEqual(["id.digits"])
  })

  test("spouse cannot share the employee's ID", () => {
    const state = stateWith({
      "employee.idNum": "123456782",
      "spouse.idNum": "123456782",
      "employee.maritalStatus": "married",
    })
    expect(validateField(field("spouse.idNum"), state).map((i) => i.code)).toContain("id.duplicate")
  })

  test("two children cannot share an ID", () => {
    let state = stateWith({ "employee.idKind": "idNum", "children": [] })
    const childFields = field("children").fields
    state = addRepeatItem(state, "children", childFields)
    state = addRepeatItem(state, "children", childFields)
    const rows = state.values.children as Array<Record<string, unknown>>
    rows[0]!.idNum = "000000026"
    rows[1]!.idNum = "000000026"
    state = setField(state, "children", rows)
    const keys = validateAll(schema, state).errors.map((e) => e.messageKey)
    expect(keys).toContain("err.id.duplicateRow")
  })

  test("a child cannot reuse a parent's ID", () => {
    let state = stateWith({ "employee.idKind": "idNum", "employee.idNum": "123456782", "children": [] })
    state = addRepeatItem(state, "children", field("children").fields)
    const rows = state.values.children as Array<Record<string, unknown>>
    rows[0]!.idNum = "123456782"
    state = setField(state, "children", rows)
    expect(validateAll(schema, state).errors.some((e) => e.code === "id.duplicate")).toBe(true)
  })
})

describe("field format rules", () => {
  test("deductions file number: 9 digits, starts with 9, valid check digit", () => {
    const valid = validateField(field("employer.deductionFile"), stateWith({ "employer.deductionFile": "900000001" }))
    expect(valid).toHaveLength(0)
    expect(validateField(field("employer.deductionFile"), stateWith({ "employer.deductionFile": "123456789" })).map((i) => i.code)).toEqual(["deduction.prefix"])
    expect(validateField(field("employer.deductionFile"), stateWith({ "employer.deductionFile": "900000002" })).map((i) => i.code)).toEqual(["deduction.checksum"])
    expect(validateField(field("employer.deductionFile"), stateWith({ "employer.deductionFile": "9000000011" })).map((i) => i.code)).toEqual(["length"])
  })

  test("only one main salary type may be selected", () => {
    const issues = validateField(field("income.salaryTypes"), stateWith({ "income.salaryTypes": ["monthly", "daily"] }))
    expect(issues.map((i) => i.code)).toContain("select.max")
    expect(validateField(field("income.salaryTypes"), stateWith({ "income.salaryTypes": ["monthly", "allowance"] }))).toHaveLength(0)
  })

  test("a child must be under 19 at the end of the tax year", () => {
    let state = stateWith({ "employee.idKind": "idNum" })
    state = addRepeatItem(state, "children", field("children").fields)
    const rows = state.values.children as Array<Record<string, unknown>>
    rows[0]!.name = "ילד"
    rows[0]!.idNum = "000000018"
    rows[0]!.birthDate = "2000-01-01"
    state = setField(state, "children", rows)
    expect(validateField(field("children"), state).map((i) => i.code)).toContain("child.tooOld")
  })

  test("aliyah cannot be before the date of birth", () => {
    const issues = validateField(
      field("employee.aliyahDate"),
      stateWith({ "employee.birthDate": "1990-01-01", "employee.aliyahDate": "1980-01-01" }),
    )
    expect(issues.map((i) => i.code)).toContain("date.order")
  })

  test("service dates cannot be in the future or equal", () => {
    expect(
      validateField(
        field("credits.serviceEnd"),
        stateWith({ "credits.discharged": true, "credits.serviceEnd": "2999-01-01" }),
      ).map((i) => i.code),
    ).toContain("date.future")
    const equal = stateWith({
      "credits.discharged": true,
      "credits.serviceStart": "2020-01-01",
      "credits.serviceEnd": "2020-01-01",
    })
    expect(validateField(field("credits.serviceStart"), equal).map((i) => i.code)).toContain("date.order")
    expect(validateField(field("credits.serviceEnd"), equal).map((i) => i.code)).toContain("date.order")
  })

  test("coordination amounts must be numbers and are required", () => {
    let state = stateWith({ "coord.request": true, "coord.reason": "other-incomes" })
    state = addRepeatItem(state, "coord.employers", field("coord.employers").fields)
    const rows = state.values["coord.employers"] as Array<Record<string, unknown>>
    rows[0]!.name = "מעסיק"
    rows[0]!.address = "כתובת"
    rows[0]!.fileNum = "900000001"
    rows[0]!.incomeType = "work"
    rows[0]!.monthlyIncome = "abc"
    rows[0]!.monthlyTax = "-5"
    state = setField(state, "coord.employers", rows)
    const codes = validateField(field("coord.employers"), state).map((i) => i.code)
    expect(codes.filter((c) => c === "number")).toHaveLength(2)
  })

  test("postal code is 5 or 7 digits", () => {
    expect(validateField(field("employee.zip"), stateWith({ "employee.zip": "123456" })).map((i) => i.code)).toEqual(["zip"])
    expect(validateField(field("employee.zip"), stateWith({ "employee.zip": "6120101" }))).toHaveLength(0)
  })

  test("unparseable dates are rejected, not silently accepted", () => {
    expect(
      validateField(field("sign.date"), stateWith({ "sign.signature": { kind: "typed" }, "sign.date": "2026-02-30" })).map((i) => i.code),
    ).toEqual(["date.invalid"])
  })

  test("a hidden spouse ID does not block the visible employee ID", () => {
    let state = stateWith({
      "employee.idKind": "idNum",
      "employee.idNum": "123456782",
      "employee.maritalStatus": "single",
      "spouse.idNum": "123456782",
    })
    state = updateHidden(schema, state)
    expect(validateField(field("employee.idNum"), state)).toHaveLength(0)
  })

  test("the young-employee credit needs someone aged 16–17 in the tax year", () => {
    const tooOld = stateWith({ "employee.birthDate": "1990-01-01", "credits.youngEmployee": true })
    expect(validateField(field("credits.youngEmployee"), tooOld).map((i) => i.code)).toContain("credits.youngEmployeeAge")
    const eligible = stateWith({ "employee.birthDate": "2010-01-01", "credits.youngEmployee": true })
    expect(validateField(field("credits.youngEmployee"), eligible)).toHaveLength(0)
    // A stale spouse date from a closed branch must not make a single person eligible.
    const staleSpouse = stateWith({
      "employee.birthDate": "1990-01-01",
      "employee.maritalStatus": "single",
      "spouse.birthDate": "2010-01-01",
      "credits.youngEmployee": true,
    })
    expect(validateField(field("credits.youngEmployee"), staleSpouse).map((i) => i.code)).toContain(
      "credits.youngEmployeeAge",
    )
  })
})

describe("defaults", () => {
  test("identity defaults to an Israeli ID, not a passport", () => {
    const state = applyInitials(schema, emptyState(2026))
    expect(state.values["employee.idKind"]).toBe("idNum")
  })

  test("a new child row starts in the employee's custody", () => {
    const item = newRepeatItem(field("children").fields)
    expect(item.custody).toBe(true)
  })

  test("initials never overwrite an answered field", () => {
    const answered = setField(emptyState(2026), "employee.idKind", "passport")
    expect(applyInitials(schema, answered).values["employee.idKind"]).toBe("passport")
  })
})
