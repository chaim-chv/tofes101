---
id: eng/offline-pwa
title: Offline / PWA — service worker, precache, updates, verified gotchas
type: concept
status: verified
confidence: verified
updated: 2026-11-01
tags: [pwa, service-worker, offline, workbox, nuxt]
sources: [source/vite-pwa-nuxt, source/webkit-itp-7day-storage]
related: [eng/architecture, eng/privacy-enforcement, eng/storage-draft, decision/adr-0001-stack]
up: eng/architecture
---

# Offline / PWA

> **Not shipped in v1.** This is the 2026-10-29 spike result, written against the
> scaffold stack (`@nuxtjs/i18n`, `@pinia/nuxt`, `@vite-pwa/nuxt`). The root app
> has no service worker or manifest yet (`PLAN.md` Phase 2) and uses a custom
> `useLocale` instead of i18n — re-verify every config below before adopting it.

**Goal:** open the app once, then fill the form on a plane / in a basement / with
the radio off. The app shell, the font, the official PDF and all step chunks are
precached; the draft is in IndexedDB.

Verified with `@vite-pwa/nuxt` **1.1.1** (`vite-plugin-pwa` 1.3.0, Workbox 7.4.1)
on Nuxt 4.6.3. Spike: `research/spikes/scaffold/`.

## 1. Working config

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxtjs/i18n', '@pinia/nuxt', '@vite-pwa/nuxt'],
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
      icons: [/* 192, 512, maskable — required for install */]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,ttf,json,pdf}'],
      globIgnores: ['**/404.html', '**/200.html'],
      navigateFallback: '/',
      cleanupOutdatedCaches: true,
      clientsClaim: true
    },
    client: {
      registerPlugin: true,   // REQUIRED if you pass `client` at all — see 2.1
      installPrompt: false
    }
  }
})
```

Generated with `bun run generate`: **32 precache entries, 968.70 KiB**,
`.output/public/sw.js` + `workbox-9c191d2f.js`.

## 2. Three real failures (all reproduced)

### 2.1 No service worker at all

`@vite-pwa/nuxt` does:

```js
const client = options.client ?? { registerPlugin: true, installPrompt: false, ... }
```

Passing `client: { installPrompt: false }` replaces the whole default object, so
`registerPlugin` becomes `undefined` → **no registration plugin is added**. The
build still emits `sw.js`, but the browser never registers it. Fix: always pass
`registerPlugin: true` when customising `client`.

Symptom seen: `navigator.serviceWorker.getRegistrations()` → `[]`, no `/sw.js`
request, `navigator.serviceWorker.ready` never resolves.

### 2.2 Precache URLs `404` and `200`

The module's manifest transform strips `.html` from every precache entry:
`404.html` → `404`, `200.html` → `200`. On a plain static server (and any host
without clean-URL rewrites) those URLs return 404, **the Workbox install fails,
and Chrome drops the registration** — again no SW, no error in the page console.

Fix: `globIgnores: ['**/404.html', '**/200.html']`. Alternatively deploy to a host
that maps extensionless routes. Verify by grepping `sw.js` for `url:"404"`.

### 2.3 `navigateFallback: '/'` serves the home page for every deep link

A reload of `/draft-test/` while offline rendered the **home page** (`h1` changed
from "draft storage probe" to "טופס 101 — סקיצת בדיקה"). Cause: the precache key
is `draft-test` (no trailing slash), the navigation URL is `/draft-test/`, so it
misses the precache and Workbox's `navigateFallback` serves `/`.

The repo has three routes (`/`, `/form`, `/employer`), so this is not
hypothetical. Fixes, in order of preference:

1. Precache each route under the **same URL the server serves** (watch trailing
   slashes). Nuxt's manifest transform strips `.html` and does not add `/`.
2. Test each route with `context.setOffline(true)` + `page.goto(route)`.
3. If a route is still missed, add it to `workbox.additionalManifestEntries`
   explicitly, or set `navigateFallback: null` and accept a network error for
   unknown paths.
4. The form's steps stay **state**, so only `/form` needs to work offline.

## 3. Verified offline behavior

`research/spikes/scaffold/scripts/offline-test.mjs`:

```json
{
  "sw": { "scope": "http://localhost:3013/", "active": true, "controlled": true },
  "reloadOk": true,
  "controlledAfter": true,
  "errors": []
}
```

Sequence: load → wait for `navigator.serviceWorker.ready` → `context.setOffline(true)`
→ `page.reload()` → the Hebrew form renders with no network. The font is served
from the precache (`Heebo loaded`), no requests leave localhost.

## 4. Update strategy

- `autoUpdate` is convenient but silently swaps the SW; a reload during data
  entry can lose focus and (if the draft debounce has not flushed) the last
  keystrokes.
- Preferred for a form: `registerType: 'prompt'` + a toast
  "גרסה חדשה זמינה — עדכן עכשיו / אחר כך" and `updateServiceWorker(true)`
  only after `autosave.flush()`.
- Never reload mid-step without flushing; hook the update to the review step or
  to an explicit button.
- Keep `cleanupOutdatedCaches: true`; version the SW via the generated revision
  hash.
- `skipWaiting` + `clientsClaim` (autoUpdate) can leave an old tab running new
  code; if we use prompt mode, do not set them manually.

## 5. Caching policy

| Asset | Strategy |
| --- | --- |
| `index.html`, `_payload.json`, `_i18n/*` | precache, network-first for updates |
| `_nuxt/*` hashed JS/CSS | precache, immutable |
| `/fonts/Heebo-Variable.ttf` | precache, immutable |
| `/forms/tofes-101-2026.pdf` (553 KB) | precache only if "PDF offline" is a launch requirement; otherwise runtime cache on first use |
| PDF library chunk (~516 KB gz) | **exclude from precache**; runtime cache after first PDF generation (otherwise first install is > 1.5 MB) |
| Everything else | no runtime caching; no external origins |

Cache headers on the host: `sw.js` and `index.html` → `no-cache`; hashed assets
→ `public, max-age=31536000, immutable`.

## 6. Install and Safari

- Manifest needs 192/512 PNG icons (maskable) for install; the spike manifest has
  an empty icon list, so it is **not installable yet** — add real icons.
- iOS Safari has no `beforeinstallprompt`; show a "Share → Add to Home Screen"
  hint instead.
- Home-screen installation exempts the app from Safari's 7-day storage eviction
  ([source/webkit-itp-7day-storage](../sources/webkit-itp-7day-storage.md)).
  This is the main reason to nudge installation.
- A service worker requires HTTPS (localhost is exempt for dev).

## 7. Tests

- Offline reload of `/` after one visit (done).
- Offline **first** load (no SW yet) → must show a normal network error page, not
  a blank screen.
- Update flow: change a string, rebuild, reload twice, confirm the new SW takes
  over and the draft survives.
- No external requests in the SW scope (network log, `check-privacy`).
- `navigator.storage.estimate()` and `persist()` behavior on Safari/iOS (not yet
  tested — see risks).
