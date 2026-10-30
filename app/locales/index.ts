import he from "./he"
import en from "./en"

export const messages = { he, en } as const
export type Locale = keyof typeof messages
export type MessageKey = keyof typeof he

/**
 * A message is a plain string, or a masculine/feminine pair. Hebrew addresses the
 * reader directly ("אני מקבל" / "אני מקבלת"), and a slash form ("מקבל/ת") is
 * both longer and impersonal, so gendered entries are first-class.
 */
export type Entry = string | { m: string; f: string }
export type Catalog = Record<MessageKey, Entry>

export function isGendered(entry: Entry): entry is { m: string; f: string } {
  return typeof entry === "object" && entry !== null
}

export const locales: Locale[] = ["he", "en"]

export const LOCALE_LABEL: Record<Locale, string> = { he: "עברית", en: "English" }
export const DIR: Record<Locale, "rtl" | "ltr"> = { he: "rtl", en: "ltr" }
export const HTML_LANG: Record<Locale, string> = { he: "he", en: "en" }

export function catalogFor(locale: Locale): Catalog {
  return messages[locale] as Catalog
}
