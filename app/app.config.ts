import type { Locale } from "~/composables/useLocale"

export default defineAppConfig({
  ui: {
    colors: {
      primary: "teal",
      neutral: "slate",
    },
  },
}) satisfies { ui: { colors: Record<string, string> } }

export type AppConfig = { locale: Locale }
