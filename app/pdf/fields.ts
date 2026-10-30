/**
 * FormState → printable overlay items. Pure data mapping, no pdf-lib.
 *
 * Read this file as a table: each row says "take field X, print it at anchor Y,
 * formatted like Z". The anchor names are the keys of `anchors.json`; a unit
 * test keeps the two in sync. Radio/checkbox groups are mapped value → the box
 * anchor that the taxpayer would actually tick on the paper form.
 *
 * Values that have no printed slot on the official form are deliberately not
 * mapped (see `app/pdf/README.md`).
 */
import type { FormState, RepeatItem, Signature } from "../form/types"
import { formatDate } from "../form/format"

export type PdfItem =
  | { anchor: string; text: string }
  | { anchor: string; mark: true }
  | { anchor: string; signature: Signature }

type Formatter = (value: unknown) => string

const asText: Formatter = (value) => {
  if (value === undefined || value === null) return ""
  return typeof value === "string" ? value.trim() : String(value)
}
const asDate: Formatter = (value) => (typeof value === "string" && value ? formatDate(value) : "")

type TextRule = {
  field: string
  anchor: string
  format?: Formatter
  /** Only print when the field is visible/was answered. */
  when?: (state: FormState) => boolean
}

const isPassport = (state: FormState) => state.values["employee.idKind"] === "passport"
const isId = (state: FormState) => !isPassport(state)
const isMarried = (state: FormState) => state.values["employee.maritalStatus"] === "married"
const isTrue = (state: FormState, id: string) => state.values[id] === true
const employerKnown = (state: FormState) => state.values["employer.unknown"] !== true

/** Scalar text slots, in reading order (page 1, then page 2). */
const TEXT_RULES: TextRule[] = [
  // page 1 · employer
  { field: "employer.name", anchor: "employer.name", when: employerKnown },
  { field: "employer.address", anchor: "employer.address", when: employerKnown },
  { field: "employer.phone", anchor: "employer.phone", when: employerKnown },
  { field: "employer.deductionFile", anchor: "employer.deductionFile", when: employerKnown },

  // page 1 · identity + address
  { field: "employee.firstName", anchor: "employee.firstName" },
  { field: "employee.lastName", anchor: "employee.lastName" },
  { field: "employee.idNum", anchor: "employee.idNum", when: isId },
  { field: "employee.passportNum", anchor: "employee.passportNum", when: isPassport },
  { field: "employee.birthDate", anchor: "employee.birthDate", format: asDate },
  { field: "employee.aliyahDate", anchor: "employee.aliyahDate", format: asDate, when: isId },
  { field: "employee.street", anchor: "employee.street" },
  { field: "employee.city", anchor: "employee.city" },
  { field: "employee.houseNum", anchor: "employee.houseNum" },
  { field: "employee.zip", anchor: "employee.zip" },
  { field: "employee.mobile", anchor: "employee.mobile" },
  { field: "employee.email", anchor: "employee.email" },
  { field: "employee.healthFundName", anchor: "employee.healthFundName", when: (s) => isTrue(s, "employee.healthFundMember") },

  // page 1 · spouse
  { field: "spouse.firstName", anchor: "spouse.firstName", when: isMarried },
  { field: "spouse.lastName", anchor: "spouse.lastName", when: isMarried },
  { field: "spouse.idNum", anchor: "spouse.idNum", when: isMarried },
  { field: "spouse.birthDate", anchor: "spouse.birthDate", format: asDate, when: isMarried },

  // page 1 · income
  { field: "income.startDate", anchor: "income.startDate", format: asDate },

  // page 2 · credit sub-values (the boxes themselves are MARK_RULES)
  { field: "credits.localityName", anchor: "credits.localityName", when: (s) => isTrue(s, "credits.locality") },
  { field: "credits.localityFrom", anchor: "credits.localityFrom", format: asDate, when: (s) => isTrue(s, "credits.locality") },
  { field: "credits.immigrantFrom", anchor: "credits.immigrantFrom", format: asDate, when: (s) => isTrue(s, "credits.immigrant") },
  {
    field: "credits.immigrantNoIncomeUntil",
    anchor: "credits.immigrantNoIncomeUntil",
    format: asDate,
    when: (s) => isTrue(s, "credits.immigrant"),
  },
  { field: "credits.serviceStart", anchor: "credits.serviceStart", format: asDate, when: (s) => isTrue(s, "credits.discharged") },
  { field: "credits.serviceEnd", anchor: "credits.serviceEnd", format: asDate, when: (s) => isTrue(s, "credits.discharged") },
  { field: "credits.reserveDays", anchor: "credits.reserveDays", when: (s) => isTrue(s, "credits.reserve") },
  {
    field: "credits.disabledChildCount",
    anchor: "credits.disabledChildCount",
    when: (s) => isTrue(s, "credits.disabledChild"),
  },

  // page 2 · declaration
  { field: "sign.date", anchor: "sign.date", format: asDate, when: (s) => Boolean(s.values["sign.signature"]) },
]

/* ---------------------------------------------------------- checkbox groups */

const equals = (expected: unknown) => (value: unknown) => value === expected
const truthy = (value: unknown) => value === true
const includes = (needle: unknown) => (value: unknown) => Array.isArray(value) && value.includes(needle)

type MarkRule = { field: string; anchor: string; is: (value: unknown) => boolean }

const MARK_RULES: MarkRule[] = [
  { field: "employee.sex", anchor: "employee.sex.male", is: equals("male") },
  { field: "employee.sex", anchor: "employee.sex.female", is: equals("female") },

  { field: "employee.maritalStatus", anchor: "employee.maritalStatus.single", is: equals("single") },
  { field: "employee.maritalStatus", anchor: "employee.maritalStatus.married", is: equals("married") },
  { field: "employee.maritalStatus", anchor: "employee.maritalStatus.divorced", is: equals("divorced") },
  { field: "employee.maritalStatus", anchor: "employee.maritalStatus.widowed", is: equals("widowed") },
  { field: "employee.maritalStatus", anchor: "employee.maritalStatus.separated", is: equals("separated") },

  { field: "employee.ilResident", anchor: "employee.ilResident.yes", is: equals(true) },
  { field: "employee.ilResident", anchor: "employee.ilResident.no", is: equals(false) },

  { field: "employee.healthFundMember", anchor: "employee.healthFundMember.yes", is: equals(true) },
  { field: "employee.healthFundMember", anchor: "employee.healthFundMember.no", is: equals(false) },

  { field: "spouse.hasIncome", anchor: "spouse.hasIncome.yes", is: equals("yes") },
  { field: "spouse.hasIncome", anchor: "spouse.hasIncome.no", is: equals("no") },
  { field: "spouse.noIncomeDeclaration", anchor: "spouse.noIncomeDeclaration", is: truthy },
  { field: "spouse.incomeTypes", anchor: "spouse.incomeTypes.work", is: includes("work") },
  { field: "spouse.incomeTypes", anchor: "spouse.incomeTypes.other", is: includes("other") },

  { field: "income.salaryTypes", anchor: "income.salaryTypes.monthly", is: includes("monthly") },
  { field: "income.salaryTypes", anchor: "income.salaryTypes.additional", is: includes("additional") },
  { field: "income.salaryTypes", anchor: "income.salaryTypes.partial", is: includes("partial") },
  { field: "income.salaryTypes", anchor: "income.salaryTypes.daily", is: includes("daily") },
  { field: "income.salaryTypes", anchor: "income.salaryTypes.allowance", is: includes("allowance") },
  { field: "income.salaryTypes", anchor: "income.salaryTypes.scholarship", is: includes("scholarship") },

  { field: "other.hasOther", anchor: "other.hasOther.yes", is: equals(true) },
  { field: "other.hasOther", anchor: "other.hasOther.no", is: equals(false) },
  { field: "other.types", anchor: "other.types.monthly", is: includes("monthly") },
  { field: "other.types", anchor: "other.types.additional", is: includes("additional") },
  { field: "other.types", anchor: "other.types.partial", is: includes("partial") },
  { field: "other.types", anchor: "other.types.daily", is: includes("daily") },
  { field: "other.types", anchor: "other.types.allowance", is: includes("allowance") },
  { field: "other.types", anchor: "other.types.scholarship", is: includes("scholarship") },
  { field: "other.creditsElsewhere", anchor: "other.creditsElsewhere.mine", is: equals("no") },
  { field: "other.creditsElsewhere", anchor: "other.creditsElsewhere.elsewhere", is: equals("yes") },
  { field: "other.studyFund", anchor: "other.studyFund", is: truthy },
  { field: "other.pension", anchor: "other.pension", is: truthy },

  ...([
    "credits.resident",
    "credits.disabled",
    "credits.locality",
    "credits.immigrant",
    "credits.incomelessSpouse",
    "credits.singleParentSeparate",
    "credits.childrenCustody",
    "credits.toddlers",
    "credits.soleParent",
    "credits.nonCustodySupport",
    "credits.disabledChild",
    "credits.alimony",
    "credits.youngEmployee",
    "credits.discharged",
    "credits.studies",
    "credits.reserve",
  ] as const).map((field, index) => ({
    field,
    anchor: `credits.${index + 1}`,
    is: truthy,
  })),
  { field: "credits.disabledMonthly", anchor: "credits.2b", is: truthy },

  { field: "coord.reason", anchor: "coord.reason.no-previous-income", is: equals("no-previous-income") },
  { field: "coord.reason", anchor: "coord.reason.other-incomes", is: equals("other-incomes") },
  { field: "coord.reason", anchor: "coord.reason.approved", is: equals("approved") },
  { field: "coord.approved", anchor: "coord.approved", is: truthy },
]

/* ------------------------------------------------------------- repeat rows */

/** Visible rows on the paper form that we fill. */
export const CHILD_ROWS = 5
export const COORD_ROWS = 3

const coordIncomeTypeLabel: Record<string, string> = {
  work: "עבודה",
  allowance: "קצבה",
  scholarship: "מלגה",
  other: "אחר",
}

function repeat(state: FormState, id: string): RepeatItem[] {
  const value = state.values[id]
  return Array.isArray(value) ? (value as RepeatItem[]) : []
}

function pushText(items: PdfItem[], anchor: string, value: unknown, format: Formatter = asText) {
  const text = format(value)
  if (text) items.push({ anchor, text })
}

function buildChildren(items: PdfItem[], state: FormState) {
  repeat(state, "children").slice(0, CHILD_ROWS).forEach((child, row) => {
    pushText(items, `children.${row}.name`, child["name"])
    pushText(items, `children.${row}.idNum`, child["idNum"])
    pushText(items, `children.${row}.birthDate`, child["birthDate"], asDate)
    if (child["custody"] === true) items.push({ anchor: `children.${row}.custody`, mark: true })
    if (child["allowance"] === true) items.push({ anchor: `children.${row}.allowance`, mark: true })
  })
}

function buildCoordination(items: PdfItem[], state: FormState) {
  if (state.values["coord.request"] !== true || state.values["coord.reason"] !== "other-incomes") return
  repeat(state, "coord.employers").slice(0, COORD_ROWS).forEach((employer, row) => {
    pushText(items, `coord.${row}.name`, employer["name"])
    pushText(items, `coord.${row}.address`, employer["address"])
    pushText(items, `coord.${row}.fileNum`, employer["fileNum"])
    const type = asText(employer["incomeType"])
    pushText(items, `coord.${row}.incomeType`, coordIncomeTypeLabel[type] ?? type)
    pushText(items, `coord.${row}.monthlyIncome`, employer["monthlyIncome"])
    pushText(items, `coord.${row}.monthlyTax`, employer["monthlyTax"])
  })
}

/* ---------------------------------------------------------------- main API */

/**
 * Every anchor id this module can emit. The sync test compares it with
 * `anchors.json`, so a renamed/removed slot fails in CI instead of printing
 * nothing at runtime.
 */
export const ANCHOR_REFS: readonly string[] = Array.from(
  new Set([
    "taxYear",
    ...TEXT_RULES.map((rule) => rule.anchor),
    ...MARK_RULES.map((rule) => rule.anchor),
    "employee.kibbutzMember.no",
    "employee.kibbutzIncome.yes",
    "employee.kibbutzIncome.no",
    "sign.signature",
    ...Array.from({ length: CHILD_ROWS }, (_, row) => [
      `children.${row}.name`,
      `children.${row}.idNum`,
      `children.${row}.birthDate`,
      `children.${row}.custody`,
      `children.${row}.allowance`,
    ]).flat(),
    ...Array.from({ length: COORD_ROWS }, (_, row) => [
      `coord.${row}.name`,
      `coord.${row}.address`,
      `coord.${row}.fileNum`,
      `coord.${row}.incomeType`,
      `coord.${row}.monthlyIncome`,
      `coord.${row}.monthlyTax`,
    ]).flat(),
  ]),
)

/** Build the ordered overlay list for a complete form state. */
export function buildItems(state: FormState): PdfItem[] {
  const items: PdfItem[] = []
  items.push({ anchor: "taxYear", text: String(state.meta.taxYear) })

  for (const rule of TEXT_RULES) {
    if (rule.when && !rule.when(state)) continue
    pushText(items, rule.anchor, state.values[rule.field], rule.format ?? asText)
  }

  // Kibbutz membership is printed as a yes/no box plus a second question about
  // where the income goes; the paper form has no standalone "yes" box for it.
  if (state.values["employee.kibbutzMember"] === false) {
    items.push({ anchor: "employee.kibbutzMember.no", mark: true })
  } else if (state.values["employee.kibbutzMember"] === true) {
    const income = state.values["employee.kibbutzIncome"]
    items.push({ anchor: income === false ? "employee.kibbutzIncome.no" : "employee.kibbutzIncome.yes", mark: true })
  }

  for (const rule of MARK_RULES) {
    if (rule.is(state.values[rule.field])) items.push({ anchor: rule.anchor, mark: true })
  }

  buildChildren(items, state)
  buildCoordination(items, state)

  const signature = state.values["sign.signature"] as Signature | undefined
  if (signature && typeof signature === "object") items.push({ anchor: "sign.signature", signature })

  // The form prints one box for "approved coordination" even when it is reached
  // via the reason radio AND the confirmation checkbox.
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.anchor}:${"mark" in item ? "mark" : "text"}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
