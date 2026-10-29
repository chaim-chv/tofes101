/**
 * Reusable validators. Every validator returns `Issue[]` (empty = valid) and is
 * pure. They are composed on `FieldDef.validate`, never duplicated in a
 * component.
 */
import type { FieldValue, FormState, Issue, Validator } from "./types"
import type { MessageKey } from "~/locales"

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

export function israeliId(): Validator {
  return (value, _state) => {
    const raw = typeof value === "string" ? value.replace(/\D/g, "") : ""
    if (raw.length === 0) return []
    if (raw.length !== 9) return [issue("", "err.id.length", "id.length")]
    if (/^0+$/.test(raw)) return [issue("", "err.id.invalid", "id.zero")]
    let sum = 0
    for (let i = 0; i < 9; i++) {
      const d = Number(raw[i]) * (i % 2 === 0 ? 1 : 2)
      sum += d < 10 ? d : d - 9
    }
    return sum % 10 === 0 ? [] : [issue("", "err.id.invalid", "id.checksum")]
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
    const today = new Date()
    return d.getTime() > today.getTime() ? [issue("", "err.date.future", "date.future")] : []
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

/** For date fields that must be on/after another date field. */
export function afterField(otherId: string): Validator {
  return (value, state) => {
    const a = parseDate(value)
    const b = parseDate(state.values[otherId])
    if (!a || !b) return []
    return a.getTime() < b.getTime() ? [issue("", "err.date.beforeOther", "date.order")] : []
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
