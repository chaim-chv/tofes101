/**
 * Display formatting for values — used by the review screen, the print view and
 * (later) the PDF. Locale-aware, and the only place that knows how to turn a
 * stored value into human text.
 */
import type { FieldDef } from "./types"
import type { Locale, MessageKey } from "~/locales"
import { catalogFor } from "~/locales"
import { isSigned } from "./values"

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string

export function formatOptionLabel(
  field: FieldDef,
  value: unknown,
  locale: Locale,
): string {
  const catalog = catalogFor(locale)
  const option = field.options?.find((o) => o.value === value)
  if (option?.labelKey) return catalog[option.labelKey as MessageKey] ?? String(value)
  if (option?.label) return option.label
  return String(value)
}

export function formatDate(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return String(value ?? "")
  const [y, m, d] = value.split("-")
  return `${d}/${m}/${y}`
}

export function formatValue(
  field: FieldDef,
  value: unknown,
  locale: Locale,
  t: Translate,
): string {
  if (value === undefined || value === null || value === "") return ""
  switch (field.kind) {
    case "checkbox":
      return value === true ? t("opt.yes") : t("opt.no")
    case "date":
      return formatDate(value)
    case "radio":
    case "select":
      return formatOptionLabel(field, value, locale)
    case "checkboxGroup": {
      const list = Array.isArray(value) ? value : []
      return list.map((v) => formatOptionLabel(field, v, locale)).join(", ")
    }
    case "signature":
      return isSigned(value) ? (value.typedName ?? t("sign.signed")) : ""
    default:
      return String(value)
  }
}

/** "3 children · ages 2, 7, 12" style summary for repeaters. */
export function formatRepeat($field: FieldDef, items: unknown, locale: Locale): string {
  const list = Array.isArray(items) ? items : []
  if (!list.length) return ""
  return locale === "he" ? `${list.length} רשומות` : `${list.length} entries`
}
