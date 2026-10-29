---
id: decision/adr-0001-stack
title: ADR-0001 — Stack: bun + Nuxt 4.6 + Nuxt UI 4.12, static generate
type: decision
status: verified
confidence: verified
updated: 2026-10-29
tags: [adr, stack, nuxt, nuxt-ui, bun, static]
sources: [source/nuxt-4-installation, source/nuxt-ui-4-installation, source/vite-pwa-nuxt]
related: [eng/architecture, eng/toolchain-versions, eng/repo-layout, decision/adr-0004-v1-scope]
up: eng/architecture
---

# ADR-0001 — Stack

**Date:** 2026-10-29 · **Status:** accepted

## Context

- Product: a **100% client-side** filler for Israeli form 101. No backend, no
  accounts, no emailing in v1. It must work offline and keep every answer on the
  device.
- The user fixed **bun + Nuxt + Nuxt UI**. Nuxt 4 and Nuxt UI 4 are the current
  majors (Nuxt `latest` = 4.6.3, published 2026-10-27; UI `latest` = 4.12.0).
  Nuxt 3 / UI 3 are previous majors; Nuxt 5 exists only as a nightly template.
- The form is long (160 fields, 10 sections), Hebrew-first with English from day
  one, and the output is a PDF/print artifact.

## Options

1. **Nuxt 4.6 + Nuxt UI 4.12 + `nuxt generate`** (chosen).
2. Nuxt 3.21 + Nuxt UI 3.3 — older majors; no reason to start a new app there.
3. Vite + Vue 3 + hand-rolled UI — less bundled, but re-implements forms, a11y,
   theming, i18n; slower to a correct Hebrew form.
4. Next/SvelteKit — contradicts the user's fixed stack.
5. SSR/Node server — would create a place where answers could be logged; rejected
   by the privacy model and ADR-0004.

## Decision

- **Runtime/package manager:** bun 1.4.3, node 22.23.4.
- **Framework:** `nuxt@4.6.3` with `app/` source dir, `vue@3.5.44`,
  `vue-router@5.4.0`, `vite@8.3.5`, Nitro 2.13.5.
- **UI:** `@nuxt/ui@4.12.0` + `tailwindcss@4.3.3` (CSS-first Tailwind v4, no
  `tailwind.config.js`).
- **State:** `pinia@4.1.0` + `@pinia/nuxt@1.0.3` (peer-verified).
- **i18n:** `@nuxtjs/i18n@10.6.0`, `strategy: 'no_prefix'`, `he` + `en`.
- **Offline:** `@vite-pwa/nuxt@1.1.1` (vite-plugin-pwa 1.3.0, Workbox 7.4.1).
- **Output:** `nuxt generate` → `.output/public`, deployed to any static host.
- **Three routes** — `/` (landing), `/form` (the 8-step form, steps as state),
  `/employer` (prefill-link generator). Route-level locales are *not* used; the
  locale is a reactive preference. Offline deep links must be precached exactly
  (see the `navigateFallback` trap in [eng/offline-pwa](../eng/offline-pwa.md)).

Verified bootstrap:

```bash
# create-nuxt 4.0.1; --packageManager bun writes the bun lockfile
npx --yes create-nuxt@latest tofes101 -t minimal --packageManager bun --no-gitInit
cd tofes101
bun install
bun add @nuxt/ui tailwindcss @nuxtjs/i18n pinia @pinia/nuxt
bun add -d @vite-pwa/nuxt vitest @nuxt/test-utils @axe-core/playwright
bun run generate      # .output/public
```

`bunx nuxi@latest init` (nuxi init **v4.0.1**, same CLI as create-nuxt) is
equivalent. On this machine bunx/bun install need
`NODE_TLS_REJECT_UNAUTHORIZED=0` because of a local MITM CA; CI does not.

## Consequences

- We inherit Nuxt UI's defaults, including **contrast failures** (`primary-500` +
  white = 2.21:1, `text-dimmed` placeholders = 2.63:1). We override
  `--ui-primary` to teal-700 and `--ui-text-dimmed` to slate-600; axe then passes.
  This is a permanent theming task, not a one-off.
- Initial first-load is ~235 KB gzip; Nuxt UI + i18n are the main cost. Budgets
  and reduction steps are in [eng/performance](../eng/performance.md).
- `typescript@7.0.2` triggers a peer warning from `@typescript-eslint`; if lint
  breaks, pin TS 6.0.x. The UI itself accepts TS 7.
- Pinia 4 is a new major; the persistence layer is ours
  ([ADR-0003](adr-0003-draft-storage.md)), so Pinia API churn is contained to the
  store.
- Static hosting means no runtime env vars, no secrets, no server logs of
  answers — the privacy story stays provable.

## Revisit if

- Nuxt 5 becomes stable (currently nightly only) or Nuxt UI 5 changes the theming
  contract.
- Initial bundle cannot get under ~200 KB gzip without fighting the framework.
- `@nuxtjs/i18n` 10 stops supporting the single-route/no-prefix mode we rely on.
- A required output (e.g. qualified e-signature, server-side PDF/A) forces a
  backend — that would be a product change, not just a stack change.
