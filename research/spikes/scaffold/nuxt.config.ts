// Verified spike config — Nuxt 4.6.3 + @nuxt/ui 4.12.0 + @nuxtjs/i18n 10.6.0
export default defineNuxtConfig({
  compatibilityDate: '2026-10-29',
  devtools: { enabled: false },

  modules: ['@nuxt/ui', '@nuxtjs/i18n', '@pinia/nuxt'],
  css: ['~/assets/css/main.css'],

  // Self-host fonts: no Google/CDN requests at runtime or build.
  ui: { fonts: false },

  app: {
    head: {
      htmlAttrs: { lang: 'he', dir: 'rtl' },
      meta: [{ name: 'robots', content: 'noindex' }]
    }
  },

  i18n: {
    defaultLocale: 'he',
    strategy: 'no_prefix',
    locales: [
      { code: 'he', language: 'he', dir: 'rtl', name: 'עברית', file: 'he.json' }
    ]
  },

  future: { compatibilityVersion: 4 }
})
