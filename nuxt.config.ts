// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxt/ui"],

  compatibilityDate: "2026-10-01",

  // Static output: the whole app is files. No server, by design.
  ssr: true,
  nitro: { preset: "static" },

  css: ["~/assets/css/main.css"],

  // Keep component names exactly as written (`FormField`, `StepProgress`) instead
  // of prefixing them by folder. One name per concept, everywhere.
  components: [{ path: "~/components", pathPrefix: false }],

  // Icons must be bundled at build time. Without this, @nuxt/icon falls back to
  // fetching from api.iconify.design at runtime — an outbound request that leaks
  // every page view. Enforced by scripts/check-privacy.ts.
  icon: {
    // Static site: nothing to serve at runtime, so scan the source and ship only
    // the icons we actually use. Without this, @nuxt/icon falls back to
    // api.iconify.design (blocked by our CSP, but it means missing icons).
    serverBundle: false,
    clientBundle: { scan: true },
  },

  app: {
    head: {
      htmlAttrs: { dir: "rtl", lang: "he" },
      meta: [
        { charset: "utf-8" },
        {
          // Belt to the privacy gate's braces: even if some library ships a
          // default endpoint, the browser refuses to talk to it.
          // 'unsafe-inline' for script-src is needed by Nuxt's hydration
          // bootstrap; everything that could exfiltrate data (connect/img/font/
          // form-action/frame) is locked to 'self'. See kb/eng/privacy-enforcement.md.
          "http-equiv": "Content-Security-Policy",
          content:
            "default-src 'self'; connect-src 'self'; img-src 'self' data: blob:; " +
            "font-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; " +
            "object-src 'none'; base-uri 'none'; form-action 'none'",
        },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        // never leak the URL (which may carry the employer payload) to third parties
        { name: "referrer", content: "no-referrer" },
        { name: "color-scheme", content: "light dark" },
      ],
      script: [
        {
          // Capture the URL fragment before Nuxt's router touches the history
          // entry. The employer prefill payload lives in `#e=…` (ADR-0005) and
          // must survive hydration.
          tagPosition: "head",
          innerHTML: "window.__INITIAL_HASH=location.hash;",
        },
      ],
    },
  },

  ui: {
    // Hebrew-first: keep the primary palette calm and institutional.
    theme: { colors: ["primary", "success", "warning", "error", "info", "neutral"] },
  },

  runtimeConfig: {
    public: {
      appName: "טופס 101",
    },
  },

  typescript: { strict: true },

  devtools: { enabled: true },

  vite: { build: { sourcemap: false } },
})
