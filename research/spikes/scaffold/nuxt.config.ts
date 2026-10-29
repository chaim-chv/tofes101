// Verified spike config — Nuxt 4.6.3 + @nuxt/ui 4.12.0 + @nuxtjs/i18n 10.6.0
export default defineNuxtConfig({
  compatibilityDate: '2026-10-29',
  devtools: { enabled: false },

  modules: ['@nuxt/ui', '@nuxtjs/i18n', '@pinia/nuxt', '@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],

  // Offline-first: precache the app shell + fonts + the official PDF.
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'טופס 101 — מילוי מקומי',
      short_name: 'טופס 101',
      lang: 'he',
      dir: 'rtl',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#0f766e',
      icons: []
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,ttf,json,pdf}'],
      // the module strips .html from precache URLs; 404/200 then 404 on plain static servers
      globIgnores: ['**/404.html', '**/200.html'],
      navigateFallback: '/',
      cleanupOutdatedCaches: true,
      clientsClaim: true
    },
    client: { registerPlugin: true, installPrompt: false }
  },

  // Self-host fonts: no Google/CDN requests at runtime or build.
  ui: { fonts: false },

  app: {
    head: {
      htmlAttrs: { lang: 'he', dir: 'rtl' },
      meta: [
        { name: 'robots', content: 'noindex' },
        {
          'http-equiv': 'Content-Security-Policy',
          content: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self'",
            "connect-src 'self'",
            "worker-src 'self'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'none'"
          ].join('; ')
        }
      ]
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
