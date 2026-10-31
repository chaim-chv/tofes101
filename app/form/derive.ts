/**
 * Derived values — computed from the answers, never stored as user input.
 * Pure, and shared by the review screen, the print view and the PDF.
 */
import type { FormState, RepeatItem } from "./types"
import { ageAt, parseDate } from "./validators"
import { asBool, asString, repeatItems } from "./values"

export const CHILD_BANDS = [
  { id: "bornThisYear", labelKey: "band.bornThisYear", from: 0, to: 0 },
  { id: "age1to2", labelKey: "band.age1to2", from: 1, to: 2 },
  { id: "age3", labelKey: "band.age3", from: 3, to: 3 },
  { id: "age4to5", labelKey: "band.age4to5", from: 4, to: 5 },
  { id: "age6to17", labelKey: "band.age6to17", from: 6, to: 17 },
  { id: "age18", labelKey: "band.age18", from: 18, to: 18 },
] as const

export type ChildBandId = (typeof CHILD_BANDS)[number]["id"]

export type Derived = {
  today: Date
  taxYearEnd: Date
  employeeAge: number | null
  employeeAgeAtYearEnd: number | null
  isMinor: boolean
  children: Array<{ key: string; ageAtYearEnd: number | null; band: ChildBandId | "outOfRange"; name: string }>
  childCount: number
  childBands: Record<ChildBandId, number>
  creditsElsewhere: boolean
  creditSectionBlocked: boolean
  claimedItems: string[]
}

export function derive(state: FormState): Derived {
  const today = new Date()
  const taxYear = state.meta.taxYear
  const taxYearEnd = new Date(Date.UTC(taxYear, 11, 31))

  const birth = parseDate(state.values["employee.birthDate"])
  const employeeAge = birth ? ageAt(birth, today) : null
  const employeeAgeAtYearEnd = birth ? ageAt(birth, taxYearEnd) : null

  const children = repeatItems(state, "children").map((child) => {
    const age = ageAt(parseDate(child["birthDate"]), taxYearEnd)
    return {
      key: String(child._key),
      name: asString(child["name"]),
      ageAtYearEnd: age,
      band: age === null ? ("outOfRange" as const) : bandFor(age, taxYear),
    }
  })

  const childBands = Object.fromEntries(CHILD_BANDS.map((b) => [b.id, 0])) as Record<ChildBandId, number>
  for (const c of children) {
    if (c.band !== "outOfRange") childBands[c.band] += 1
  }

  const creditsElsewhere =
    asBool(state.values["other.hasOther"]) && state.values["other.creditsElsewhere"] === "yes"

  const claimedItems = CREDIT_ITEMS.filter((id) => asBool(state.values[`credits.${id}`]))

  return {
    today,
    taxYearEnd,
    employeeAge,
    employeeAgeAtYearEnd,
    isMinor: employeeAgeAtYearEnd !== null && employeeAgeAtYearEnd < 18,
    children,
    childCount: children.filter((c) => c.band !== "outOfRange").length,
    childBands,
    creditsElsewhere,
    creditSectionBlocked: creditsElsewhere,
    claimedItems,
  }
}

/**
 * Which band a child falls into for the tax year.
 *
 * Note: the bands are *age during the tax year*, and the official form keys them
 * to the child's age on 31 December. A child born in the tax year is band 0 even
 * though their age at year end may be 0 — same result, kept explicit for clarity.
 */
export function bandFor(ageAtYearEnd: number, taxYear: number): ChildBandId | "outOfRange" {
  if (ageAtYearEnd < 0 || ageAtYearEnd > 18) return "outOfRange"
  if (ageAtYearEnd === 0) return "bornThisYear"
  for (const band of CHILD_BANDS) {
    if (ageAtYearEnd >= band.from && ageAtYearEnd <= band.to) return band.id
  }
  // ageAtYearEnd is > 18 or unhandled; the guard above should have caught it
  void taxYear
  return "outOfRange"
}

export const CREDIT_ITEMS = [
  "resident",
  "disabled",
  "locality",
  "immigrant",
  "incomelessSpouse",
  "singleParentSeparate",
  "childrenCustody",
  "toddlers",
  "soleParent",
  "nonCustodySupport",
  "disabledChild",
  "alimony",
  "youngEmployee",
  "discharged",
  "studies",
  "reserve",
] as const

export type CreditItem = (typeof CREDIT_ITEMS)[number]

/** Credit items whose sub-form is open, for the review screen. */
export function openCreditDetails(state: FormState): string[] {
  return CREDIT_ITEMS.filter((id) => asBool(state.values[`credits.${id}`]))
}

export function spousePresent(state: FormState): boolean {
  return state.values["employee.maritalStatus"] === "married"
}

export function hasOtherIncome(state: FormState): boolean {
  return asBool(state.values["other.hasOther"])
}

export function childRows(state: FormState): RepeatItem[] {
  return repeatItems(state, "children")
}
