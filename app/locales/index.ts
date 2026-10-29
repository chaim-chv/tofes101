import he from "./he"
import en from "./en"

export const messages = { he, en } as const
export type Locale = keyof typeof messages
export type MessageKey = keyof typeof he
export type Catalog = Record<MessageKey, string>

export const locales: Locale[] = ["he", "en"]

export const LOCALE_LABEL: Record<Locale, string> = { he: "עברית", en: "English" }
export const DIR: Record<Locale, "rtl" | "ltr"> = { he: "rtl", en: "ltr" }
export const HTML_LANG: Record<Locale, string> = { he: "he", en: "en" }

export function catalogFor(locale: Locale): Catalog {
  return messages[locale] as Catalog
}
