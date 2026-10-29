---
id: eng/toolchain-versions
title: Toolchain versions — what we actually resolved (2026-10-29)
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [tooling, versions, bun, nuxt, nuxt-ui, pdf]
sources: [source/nuxt-4-installation, source/nuxt-ui-4-installation, source/vite-pwa-nuxt, source/pdf-lib-readme]
related: [eng/architecture, decision/adr-0001-stack, eng/repo-layout]
up: eng/architecture
---

# Toolchain versions (verified)

Environment: **bun 1.4.3**, **node v22.23.4**, macOS (darwin), 2026-10-29.
Every version below came from `npm view`, `package.json` in
`research/spikes/scaffold`, or a build log — not from memory.

## Runtime and framework

| Package | Version | Notes |
| --- | --- | --- |
| `bun` | 1.4.3 | package manager + scripts; `bun install`/`bun run` |
| `node` | 22.23.4 | Nuxt 4.6.3 engines: `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0` |
| `nuxt` | **4.6.3** | npm `latest`; published 2026-10-27. Nuxt 4 is the current stable major (no 5 in `dist-tags`) |
| `vue` | 3.5.44 | resolved by Nuxt |
| `vue-router` | 5.4.0 | resolved by Nuxt 4.6.3 |
| `vite` | 8.3.5 | build tool inside Nuxt |
| `nitropack` | 2.13.5 | static prerender |
| `@nuxt/ui` | **4.12.0** | npm `latest` |
| `tailwindcss` | 4.3.3 | CSS-first v4 (no `tailwind.config.js`) |
| `@nuxt/fonts` | 0.14.0 | auto-installed by UI; disabled with `ui.fonts: false` |
| `@nuxt/icon` | 2.5.1 declared / 2.6.2 resolved | local server bundle |
| `reka-ui` | 2.11.0 | headless primitives behind Nuxt UI |
| `@nuxtjs/i18n` | 10.6.0 | `strategy: 'no_prefix'` |
| `pinia` | **4.1.0** | new major; `@pinia/nuxt@1.0.3` peer-requires `^4.1.0` |
| `@pinia/nuxt` | 1.0.3 | |
| `pinia-plugin-persistedstate` | 4.7.1 | evaluated, **not used** |
| `idb-keyval` | 6.3.0 | chosen draft storage |
| `dexie` | 4.4.7 | evaluated, not used |
| `@vite-pwa/nuxt` | 1.1.1 | |
| `vite-plugin-pwa` | 1.3.0 | transitive |
| `workbox-build` / `workbox-window` | 7.4.1 | transitive |

### Major-version deltas we rely on

| Change | Verified effect |
| --- | --- |
| Nuxt 3 → 4 | source lives in `app/` (pages/components/composables/assets); Node 22+ is required; Vite 8; `future.compatibilityVersion` is the default |
| Nuxt UI 3 → 4 | Tailwind v4 is required (CSS-first, no `tailwind.config.js`); semantic colors configured via `app.config.ts`; `UApp` owns locale/direction; `ui.experimental.componentDetection` tree-shakes component CSS |
| Pinia 3 → 4 | `@pinia/nuxt@1.0.3` peer-requires `pinia ^4.1.0`; our persistence layer is custom, so API churn is contained |
| Vue Router 4 → 5 | create-nuxt 4.0.1's template pins `^5.4.0`; the root app pins `^4.5.0` and works. Pick one per lockfile |

### Repo root vs spike

The root app (live, 2026-10-29) resolves: `nuxt 4.6.3`, `vue 3.5.44`,
`vue-router 4.6.4` (package.json `^4.5.0`), `@nuxt/ui 4.12.0`,
`tailwindcss 4.3.3`, `typescript 5.9.3`, `@iconify-json/lucide 1.2.149`.

Differences from the spike, all deliberate/known:

- The create-nuxt 4.0.1 minimal template pinned `vue-router ^5.4.0`, so the spike
  resolved 5.4.0; the root pins `^4.5.0`. Nuxt 4.6 works with both, but do not
  mix lockfiles.
- Root has **no** `@nuxtjs/i18n`, **no** Pinia, **no** `@vite-pwa/nuxt` yet. It
  uses a 40-line `useLocale` composable with typed dictionaries. The spike
  verified the module versions; adoption is a separate PR.
- Root `typescript 5.9.3` avoids the `@nuxt/ui`/typescript-eslint peer warning
  the spike saw with TS 7.0.2.
- Root self-hosts Heebo through `@nuxt/fonts` at build time (two WOFF2 subsets,
  44.9 KB total); the spike disabled it and shipped a 122 KB TTF for PDF parity.

## PDF and text

| Package | Version | Notes |
| --- | --- | --- |
| `pdf-lib` | **1.17.1** | overlay/generate PDF |
| `@pdf-lib/fontkit` | **1.1.1** | TTF embedding/subsetting |
| `bidi-js` | **1.1.0** | UAX #9 levels, reordering, mirroring |
| `jspdf` | 4.2.1 | evaluated, rejected (see [eng/pdf-hebrew-rtl](pdf-hebrew-rtl.md)) |
| `@pdfme/generator` / `common` / `schemas` | 6.2.8 | evaluated, rejected |
| `pdfjs-dist` | 6.4.299 | used to extract official-PDF text coordinates |
| Heebo variable TTF | 122,012 bytes | OFL; from Google Fonts repo, self-hosted |

## Test and quality

| Package | Version |
| --- | --- |
| `vitest` | 5.0.5 |
| `@nuxt/test-utils` | 4.3.4 |
| `playwright` | 1.64.1 (`channel: 'chrome'`) |
| `@axe-core/playwright` / `axe-core` | 4.14.0 |
| `fake-indexeddb` | 6.2.6 |
| `typescript` | 7.0.2 (peer warning, see below) |

## Warnings we actually saw

1. `warn: incorrect peer dependency "typescript@7.0.2"` — `@nuxt/ui@4.12.0`
   accepts `^5.6.3 || ^6 || ^7`, but `@typescript-eslint` (via
   `@intlify/unplugin-vue-i18n`) wants `<6.1.0`. The build works; if lint breaks,
   pin `typescript@6.0.x` in devDependencies.
2. `bun install` / `bunx` fail with `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` on this
   machine (NetFree MITM CA) unless `NODE_TLS_REJECT_UNAUTHORIZED=0` is set.
   This is a **local environment** issue, not a project one; CI on GitHub is not
   affected.
3. `@vite-pwa/nuxt` prints `PWA v1.3.0` and `precache N entries` on generate.
4. Nuxt's prerender emits `ERROR (node:…) Warning: Setting
   NODE_TLS_REJECT_UNAUTHORIZED…` because of the same local env var; it does not
   fail the build.

## What we did **not** verify

- Safari/iOS runtime behavior (only Chrome 1.64.1 / Chrome channel was tested).
- Android Chrome install prompt and PWA display mode.
- Actual 3G network timing (Lighthouse simulates mobile throttling; see
  [eng/performance](performance.md)).
- Whether npm `typescript@7.0.2` is the Go-based compiler or the normal one in
  this registry snapshot; the peer warning is real either way.
