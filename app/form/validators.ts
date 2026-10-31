/**
 * Reusable validators. Every validator returns `Issue[]` (empty = valid) and is
 * pure. They are composed on `FieldDef.validate`, never duplicated in a
 * component.
 */
import type { FieldValue, FormState, Issue, Validator } from "./types"
import type { MessageKey } from "~/locales"
import { isSigned } from "./values"

export function issue(
  field: string,
  messageKey: MessageKey,
  code: string,
  severity: "error" | "warning" = "error",
  params?: Record<string, string | number>,
): Issue {
  return { field, code, severity, messageKey, params }
}

/* --------------------------------------------------------------------- dates */

export function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const parts = value.split("-").map(Number)
  const y = parts[0] ?? NaN
  const m = parts[1] ?? NaN
  const d = parts[2] ?? NaN
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null
  const date = new Date(Date.UTC(y, m - 1, d))
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null
  return date
}

/** Whole years between `birth` and `on`, birthday-aware. */
export function ageAt(birth: string | Date | null | undefined, on: Date): number | null {
  const b = birth instanceof Date ? birth : parseDate(birth)
  if (!b) return null
  let age = on.getUTCFullYear() - b.getUTCFullYear()
  const beforeBirthday =
    on.getUTCMonth() < b.getUTCMonth() ||
    (on.getUTCMonth() === b.getUTCMonth() && on.getUTCDate() < b.getUTCDate())
  if (beforeBirthday) age -= 1
  return age
}

/** Tax year end (31 December) in UTC. */
export function endOfTaxYear(taxYear: number): Date {
  return new Date(Date.UTC(taxYear, 11, 31))
}

/* ---------------------------------------------------------------- validators */

/* ---------------------------------------------------------------- identifiers */

/** Luhn (mod 10) check over a digits-only string. */
function luhnOk(raw: string): boolean {
  let sum = 0
  for (let i = 0; i < raw.length; i++) {
    const d = Number(raw[i]) * (i % 2 === 0 ? 1 : 2)
    sum += d < 10 ? d : d - 9
  }
  return sum % 10 === 0
}

export function israeliId(): Validator {
  return (value, _state) => {
    const typed = typeof value === "string" ? value.trim() : ""
    if (typed.length === 0) return []
    // Reject letters/symbols instead of silently stripping them: a user who
    // typed "12a456782" must be told, not quietly given an ID they did not type.
    if (/[^0-9]/.test(typed)) return [issue("", "err.digitsOnly", "id.digits")]
    const raw = typed
    if (raw.length !== 9) return [issue("", "err.id.length", "id.length")]
    if (/^0+$/.test(raw)) return [issue("", "err.id.invalid", "id.zero")]
    return luhnOk(raw) ? [] : [issue("", "err.id.invalid", "id.checksum")]
  }
}

/**
 * Deduction-file number ("מספר תיק ניכויים"): exactly 9 digits, starts with 9,
 * and carries the same Luhn check digit as an Israeli ID.
 */
export function deductionFileNumber(): Validator {
  return (value) => {
    const raw = typeof value === "string" ? value.trim() : ""
    if (!raw) return []
    if (/[^0-9]/.test(raw)) return [issue("", "err.digitsOnly", "deduction.digits")]
    if (raw.length !== 9) return [issue("", "err.deductionFile.length", "deduction.length")]
    if (raw[0] !== "9") return [issue("", "err.deductionFile.prefix", "deduction.prefix")]
    return luhnOk(raw) ? [] : [issue("", "err.deductionFile.invalid", "deduction.checksum")]
  }
}

/** Israeli postal code: 5 digits (legacy) or 7 digits. */
export function israeliZip(): Validator {
  return (value) => {
    const raw = typeof value === "string" ? value.trim() : ""
    if (!raw) return []
    return /^\d{5}(\d{2})?$/.test(raw) ? [] : [issue("", "err.zip.invalid", "zip")]
  }
}

export function israeliPhone(opts: { mobile?: boolean } = {}): Validator {
  return (value) => {
    const raw = typeof value === "string" ? value.replace(/[\s-]/g, "") : ""
    if (!raw) return []
    if (!/^0\d{7,9}$/.test(raw)) return [issue("", "err.phone.invalid", "phone.shape")]
    if (opts.mobile && !/^05\d{8}$/.test(raw)) return [issue("", "err.phone.mobile", "phone.mobile")]
    return []
  }
}

export function email(): Validator {
  return (value) => {
    const s = typeof value === "string" ? value.trim() : ""
    if (!s) return []
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) ? [] : [issue("", "err.email.invalid", "email")]
  }
}

export function notFuture(): Validator {
  return (value) => {
    const d = parseDate(value)
    if (!d) return []
    // Compare calendar days, not instants: at 01:00 in Israel, today's UTC
    // midnight is still in the "future" and would be rejected.
    const today = new Date()
    const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    return d.getTime() > todayUtc ? [issue("", "err.date.future", "date.future")] : []
  }
}

/** A date that is present but not a real ISO calendar date. */
export function validDate(): Validator {
  return (value) => {
    if (typeof value !== "string" || value.trim() === "") return []
    return parseDate(value) ? [] : [issue("", "err.date.invalid", "date.invalid")]
  }
}

export function dateInTaxYear(taxYearOf: (state: FormState) => number): Validator {
  return (value, state) => {
    const d = parseDate(value)
    if (!d) return []
    const year = taxYearOf(state)
    const y = d.getUTCFullYear()
    return y === year ? [] : [issue("", "err.date.outsideTaxYear", "date.year", "error", { year })]
  }
}

export function ageBetween(min: number, max: number, birthFieldId: string): Validator {
  return (value, state) => {
    const birth = state.values[birthFieldId]
    const age = ageAt(birth as string, new Date())
    if (age === null) return []
    if (age < min)
      return [issue("", "err.age.tooYoung", "age.min", "error", { age, min })]
    if (age > max) return [issue("", "err.age.tooOld", "age.max", "error", { age, max })]
    return []
  }
}

/** For date fields that must be strictly after another date field. */
export function afterField(otherId: string): Validator {
  return (value, state) => {
    const a = parseDate(value)
    const b = parseDate(state.values[otherId])
    if (!a || !b) return []
    return a.getTime() <= b.getTime() ? [issue("", "err.date.beforeOther", "date.order")] : []
  }
}

/** For date fields that must be strictly before another date field. */
export function beforeField(otherId: string): Validator {
  return (value, state) => {
    const a = parseDate(value)
    const b = parseDate(state.values[otherId])
    if (!a || !b) return []
    return a.getTime() >= b.getTime() ? [issue("", "err.date.afterOther", "date.order")] : []
  }
}

/** For date fields that may be equal to, but not earlier than, another field. */
export function notBeforeField(
  otherId: string,
  messageKey: MessageKey = "err.date.beforeOther",
): Validator {
  return (value, state) => {
    const a = parseDate(value)
    const b = parseDate(state.values[otherId])
    if (!a || !b) return []
    return a.getTime() < b.getTime() ? [issue("", messageKey, "date.order")] : []
  }
}

/** Age on 31 December of the form's tax year — the age the form asks about. */
export function ageAtTaxYearEnd(value: unknown, state: FormState): number | null {
  const d = parseDate(value)
  return d ? ageAt(d, endOfTaxYear(state.meta.taxYear)) : null
}

export function ageAtTaxYearEndBetween(min: number, max: number): Validator {
  return (value, state) => {
    const age = ageAtTaxYearEnd(value, state)
    if (age === null) return []
    if (age < min)
      return [issue("", "err.age.tooYoung", "age.min", "error", { age, min })]
    if (age > max) return [issue("", "err.age.tooOld", "age.max", "error", { age, max })]
    return []
  }
}

/** Children are listed on the form only until the tax year they turn 19. */
export function childAgeAtTaxYearEnd(): Validator {
  return (value, state) => {
    const age = ageAtTaxYearEnd(value, state)
    if (age === null) return []
    if (age < 0) return [issue("", "err.child.notBorn", "child.notBorn", "error", { age })]
    if (age > 18) return [issue("", "err.child.tooOld", "child.tooOld", "error", { age })]
    return []
  }
}

/**
 * Two people in one form cannot share an ID. Returns a duplicate error when this
 * field equals any of `others` (and, for repeaters, any sibling row).
 */
export function distinctFrom(others: readonly string[], labelKeys: Record<string, string> = {}): Validator {
  return (value, state) => {
    const raw = typeof value === "string" ? value.trim() : ""
    if (!raw) return []
    for (const other of others) {
      // A value kept in a closed branch must not block a visible answer: the
      // user cannot see or edit it (answers are never deleted, see ADR).
      if (state.hidden[other]) continue
      const theirs = typeof state.values[other] === "string" ? String(state.values[other]).trim() : ""
      if (theirs && theirs === raw) {
        void labelKeys
        return [issue("", "err.id.duplicate", "id.duplicate")]
      }
    }
    return []
  }
}

export function oneOf(values: readonly (string | number | boolean)[]): Validator {
  return (value) => {
    if (value === undefined || value === null || value === "") return []
    return values.includes(value as string) ? [] : [issue("", "err.invalidOption", "option")]
  }
}

export function atLeastOne(): Validator {
  return (value) =>
    Array.isArray(value) && value.length > 0 ? [] : [issue("", "err.selectAtLeastOne", "select.one")]
}

/** For checkbox groups where only one of `values` may be picked. */
export function atMostOneOf(values: readonly string[]): Validator {
  return (value) => {
    if (!Array.isArray(value)) return []
    const picked = value.filter((v) => values.includes(String(v)))
    return picked.length > 1
      ? [issue("", "err.selectAtMostOne", "select.max", "error", { max: 1 })]
      : []
  }
}

/** Whole number in a closed range (counts, days). */
export function integerRange(min: number, max: number): Validator {
  return (value) => {
    const s = typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : ""
    if (!s) return []
    if (!/^\d+$/.test(s)) return [issue("", "err.digitsOnly", "digits")]
    const n = Number(s)
    return n < min || n > max
      ? [issue("", "err.number.range", "range", "error", { min, max })]
      : []
  }
}

/** Positive/zero money amount with up to two decimal places. */
export function decimalRange(min: number, max: number): Validator {
  return (value) => {
    const s = typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : ""
    if (!s) return []
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(s)) return [issue("", "err.number.invalid", "number")]
    const n = Number(s.replace(",", "."))
    return n < min || n > max
      ? [issue("", "err.number.range", "range", "error", { min, max })]
      : []
  }
}

/** A signature must be a real drawn/typed signature object, not any truthy value. */
export function signature(): Validator {
  return (value) => (isSigned(value) ? [] : [issue("", "err.signature.invalid", "signature")])
}

/** The 16–17 credit can only be claimed when the employee or spouse is that age in the tax year. */
export function youngEmployeeEligible(): Validator {
  return (value, state) => {
    if (value !== true) return []
    const employeeAge = ageAtTaxYearEnd(state.values["employee.birthDate"], state)
    const spouseAge =
      state.values["employee.maritalStatus"] === "married"
        ? ageAtTaxYearEnd(state.values["spouse.birthDate"], state)
        : null
    const employeeEligible = employeeAge !== null && employeeAge >= 16 && employeeAge < 18
    const spouseEligible = spouseAge !== null && spouseAge >= 16 && spouseAge < 18
    if (employeeEligible || spouseEligible) return []
    return [issue("", "err.credits.youngEmployeeAge", "credits.youngEmployeeAge")]
  }
}

export function maxLength(n: number): Validator {
  return (value) => {
    const s = typeof value === "string" ? value : ""
    return s.length <= n ? [] : [issue("", "err.tooLong", "length", "error", { max: n })]
  }
}

export function digitsOnly(): Validator {
  return (value) => {
    const s = typeof value === "string" ? value : ""
    if (!s) return []
    return /^\d+$/.test(s) ? [] : [issue("", "err.digitsOnly", "digits")]
  }
}

/** Run validators in order, stop at the first issue (better UX than a wall). */
export function firstOf(...validators: Validator[]): Validator {
  return (value, state) => {
    for (const v of validators) {
      const issues = v(value, state)
      if (issues.some((i) => i.severity === "error")) return issues
    }
    return []
  }
}

/** Prefix the field id on issues that validators left blank. */
export function stamp(fieldId: string, issues: Issue[]): Issue[] {
  return issues.map((i) => (i.field ? i : { ...i, field: fieldId }))
}

export type { Validator, FieldValue, FormState }
