/**
 * Value helpers: defaults, emptiness, coercion. Pure.
 */
import type { FieldDef, FieldValue, FormState, FormValues, RepeatItem, Signature } from "./types"

export const SCHEMA_VERSION = 2
export const TAX_YEAR = 2026
export const DECLARATION_VERSION = "2026-he-1"

/**
 * Stable fingerprint of every answer that is covered by the declaration.
 * Signing-related fields are excluded so re-signing does not change it.
 *
 * This is not a security primitive; it exists so the UI can tell whether the
 * document changed after it was signed.
 */
export function answersFingerprint(state: FormState): string {
  const entries = Object.entries(state.values)
    .filter(([id]) => !id.startsWith("sign."))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  const text = JSON.stringify(entries)
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

export function emptyState(taxYear = TAX_YEAR): FormState {
  const now = new Date().toISOString()
  return {
    meta: {
      schema: SCHEMA_VERSION,
      taxYear,
      locale: "he",
      step: 0,
      stepId: "employer",
      createdAt: now,
      updatedAt: now,
      completed: {},
      declarationVersion: DECLARATION_VERSION,
    },
    values: {},
    hidden: {},
  }
}

/** The value a field starts with, before the user touches it. */
export function defaultValue(field: FieldDef): FieldValue {
  if (field.initial !== undefined) return field.initial as FieldValue
  switch (field.kind) {
    case "checkbox":
      return false
    case "checkboxGroup":
      return []
    case "date":
    case "text":
    case "select":
      return ""
    case "radio":
      return undefined
    case "signature":
      return undefined
    case "static":
      return undefined
    default:
      return undefined
  }
}

/**
 * Empty means "the user has not answered". `false` is a real answer for a
 * checkbox (unchecked is a choice the user made by leaving it), so only
 * `undefined` counts as empty there.
 */
export function isEmpty(field: FieldDef, value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === "string") return value.trim() === ""
  if (Array.isArray(value)) return value.length === 0
  if (field.kind === "checkbox") return value === undefined
  return false
}

export function getField(state: FormState, id: string): unknown {
  return state.values[id]
}

export function setField(state: FormState, id: string, value: unknown): FormState {
  return {
    ...state,
    meta: { ...state.meta, updatedAt: new Date().toISOString() },
    values: { ...state.values, [id]: value as FieldValue },
  }
}

/** Fill in declared initials once, without touching existing answers. */
export function applyInitials(schema: { allFields: readonly FieldDef[] }, state: FormState): FormState {
  let values = state.values
  let changed = false
  for (const field of schema.allFields) {
    if (field.initial === undefined || field.kind === "static") continue
    if (values[field.id] !== undefined) continue
    if (!changed) {
      values = { ...values }
      changed = true
    }
    values[field.id] = field.initial as FieldValue
  }
  return changed ? { ...state, values } : state
}

/* --------------------------------------------------------------- repeat rows */

/** Sub-field key inside a repeat row: `children.idNum` -> `idNum`. */
export function rowKey(fieldId: string): string {
  return fieldId.includes(".") ? fieldId.slice(fieldId.lastIndexOf(".") + 1) : fieldId
}

export function newRepeatItem(fields: readonly FieldDef[] | undefined): RepeatItem {
  const item: RepeatItem = { _key: crypto.randomUUID() }
  for (const f of fields ?? []) {
    if (f.kind === "static" || f.kind === "repeat") continue
    // Canonical row keys are bare (`idNum`, not `children.idNum`) so the UI, the
    // engine, the review and the PDF all read the same object shape.
    item[rowKey(f.id)] = defaultValue(f) ?? null
  }
  return item
}

export function addRepeatItem(state: FormState, fieldId: string, fields?: readonly FieldDef[]): FormState {
  const list = (state.values[fieldId] as RepeatItem[] | undefined) ?? []
  return setField(state, fieldId, [...list, newRepeatItem(fields)])
}

export function removeRepeatItem(state: FormState, fieldId: string, key: string): FormState {
  const list = (state.values[fieldId] as RepeatItem[] | undefined) ?? []
  return setField(state, fieldId, list.filter((i) => i._key !== key))
}

export function setRepeatItemValue(
  state: FormState,
  fieldId: string,
  key: string,
  subId: string,
  value: unknown,
): FormState {
  const list = (state.values[fieldId] as RepeatItem[] | undefined) ?? []
  return setField(
    state,
    fieldId,
    list.map((i) => (i._key === key ? { ...i, [subId]: value as FieldValue } : i)),
  )
}

export function repeatItems(state: FormState, fieldId: string): RepeatItem[] {
  const v = state.values[fieldId]
  return Array.isArray(v) ? (v as RepeatItem[]) : []
}

/* ----------------------------------------------------------------- signature */

export function isSigned(value: unknown): value is Signature {
  if (!value || typeof value !== "object") return false
  const s = value as Signature
  return (s.kind === "drawn" || s.kind === "typed") && typeof s.signedAt === "string"
}

/* ------------------------------------------------------------------ coercion */

export function asString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v)
}

export function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.replace(/[^\d.-]/g, ""))
    return Number.isFinite(n) ? n : null
  }
  return null
}

export function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : []
}

export function asBool(v: unknown): boolean {
  return v === true
}

/** Merge a partial patch into values without touching the rest. */
export function patchValues(state: FormState, patch: FormValues): FormState {
  return {
    ...state,
    meta: { ...state.meta, updatedAt: new Date().toISOString() },
    values: { ...state.values, ...patch },
  }
}
