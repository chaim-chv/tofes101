/**
 * Locale + message lookup. Two catalogs, typed keys, no i18n dependency.
 *
 * The schema references `MessageKey`s, so a missing translation is a TypeScript
 * error, not a blank line at runtime.
 */
import {
  DIR,
  isGendered,
  HTML_LANG,
  LOCALE_LABEL,
  catalogFor,
  locales,
  type Locale,
  type MessageKey,
} from "~/locales"

const STORAGE_KEY = "tofes101.locale"

export type Gender = "m" | "f"

export function useLocale() {
  const locale = useState<Locale>("locale", () => "he")
  /** Set from the form's `מין` answer so every message agrees with it. */
  const gender = useState<Gender | null>("form-gender", () => null)

  function setGender(next: Gender | null) {
    gender.value = next
  }

  function setLocale(next: Locale) {
    locale.value = next
    if (import.meta.client) {
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* storage may be unavailable; the locale is cosmetic */
      }
    }
  }

  /** Called once on mount: stored choice, else the browser's preference. */
  function init() {
    if (!import.meta.client) return
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (saved && locales.includes(saved)) {
      locale.value = saved
      return
    }
    if (navigator.language?.toLowerCase().startsWith("en")) locale.value = "en"
  }

  function toggle() {
    setLocale(locale.value === "he" ? "en" : "he")
  }

  /** Translate, with `{name}` interpolation and masculine/feminine selection. */
  function t(key: MessageKey, vars?: Record<string, string | number>): string {
    const entry = catalogFor(locale.value)[key]
    const raw = isGendered(entry)
      ? gender.value === "f"
        ? entry.f
        : entry.m
      : ((entry as string | undefined) ?? (key as string))
    if (!vars) return raw
    return raw.replace(/\{(\w+)\}/g, (_, k: string) =>
      vars[k] === undefined ? `{${k}}` : String(vars[k]),
    )
  }

  const dir = computed(() => DIR[locale.value])
  const lang = computed(() => HTML_LANG[locale.value])
  const localeName = computed(() => LOCALE_LABEL[locale.value])

  return { locale, setLocale, init, toggle, t, dir, lang, localeName, locales, LOCALE_LABEL, gender, setGender }
}

export type { Locale, MessageKey }
