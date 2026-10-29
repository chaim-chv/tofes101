---
id: source/nuxt-ui-4-installation
title: Nuxt UI 4 — Installation for Nuxt (official docs)
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: Nuxt UI (ui.nuxt.com)
url: https://ui.nuxt.com/docs/getting-started/installation/nuxt
retrieved: 2026-10-29
tags: [nuxt-ui, tailwind, setup]
---

# Nuxt UI 4 installation

Verified 2026-10-29:

```bash
bun add @nuxt/ui tailwindcss
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css']
})
```

```css
/* app/assets/css/main.css */
@import "tailwindcss";
@import "@nuxt/ui";
```

- Wrap the app in `<UApp>`; it is required for toasts, tooltips and programmatic
  overlays.
- `@nuxt/icon`, `@nuxt/fonts` and `@nuxtjs/color-mode` are registered
  automatically — do not add them to `modules`.
- `ui.fonts: false` disables the bundled `@nuxt/fonts` module (we use it to keep
  every font request same-origin).
- `ui.experimental.componentDetection` (4.1+) tree-shakes component CSS.
- The page states the current major is 4.x; npm `latest` resolved to **4.12.0**
  on 2026-10-29.
