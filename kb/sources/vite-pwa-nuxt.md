---
id: source/vite-pwa-nuxt
title: "@vite-pwa/nuxt — Nuxt 3/4 integration docs"
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: Vite PWA (vite-pwa-org.netlify.app)
url: https://vite-pwa-org.netlify.app/frameworks/nuxt.html
retrieved: 2026-10-29
tags: [pwa, service-worker, nuxt, workbox]
---

# @vite-pwa/nuxt

Verified 2026-10-29 (docs say "Nuxt 3"; the package works with Nuxt 4 — see the
spike results):

- Install `@vite-pwa/nuxt`, add it to `modules`, put the `vite-plugin-pwa`
  options under the `pwa` key.
- The module registers a client plugin exposing `$pwa`
  (`swActivated`, `offlineReady`, `needRefresh`, `updateServiceWorker`,
  `getSWRegistration`, install prompt helpers).
- `pwa.client.registerPlugin` defaults to **true** *only if the whole `client`
  object is omitted*. If you pass `client: { installPrompt: false }`, you must
  also pass `registerPlugin: true` — otherwise no service worker is registered.
- `VitePwaManifest` / `NuxtPwaManifest` (or `NuxtPwaAssets`) components inject
  the manifest `<link>` and icons; manifest is not injected automatically.
- `pwa.registerType: 'autoUpdate'` sets `skipWaiting` + `clientsClaim` when the
  client plugin or an injected register script is enabled.
- `pwa.workbox.navigateFallback` defaults to the app base URL; beware with
  prerendered sub-routes (see [eng/offline-pwa](../../eng/offline-pwa.md)).
