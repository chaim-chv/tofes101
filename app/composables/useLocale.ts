/**
 * Minimal i18n: two dictionaries, one reactive locale, no dependency.
 *
 * Why not @nuxtjs/i18n for v1: we need exactly two locales, no routing
 * strategy, no plural rules beyond Intl, and we want the message keys to be
 * literally the same object across the app so the form schema can reference
 * them. If routing-level locales become a requirement, swap this out — the
 * call sites (`t('key')`) stay the same.
 */
import he from "~/locales/he"
import en from "~/locales/en"

export type Locale = "he" | "en"

const messages = { he, en } as const
export type MessageKey = keyof typeof he

const STORAGE_KEY = "tofes101.locale"

export function useLocale() {
  const locale = useState<Locale>("locale", () => "he")

  function apply(l: Locale) {
    locale.value = l
    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_KEY, l)
      } catch {
        /* private mode / storage full: ignore, locale is cosmetic */
      }
    }
  }

  function init() {
    if (!import.meta.client) return
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (saved === "he" || saved === "en") locale.value = saved
    else if (navigator.language?.toLowerCase().startsWith("en")) locale.value = "en"
  }

  function toggle() {
    apply(locale.value === "he" ? "en" : "he")
  }

  /** Translate. Falls back to the key so a missing string is visible, not blank. */
  function t(key: MessageKey, vars?: Record<string, string | number>): string {
    const raw = (messages[locale.value] as Record<string, string>)[key] ?? key
    if (!vars) return raw
    return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`))
  }

  return { locale, apply, init, toggle, t }
}
