---
id: eng/architecture
title: Architecture — client-only Nuxt app, layers, data flow, threat model
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [architecture, nuxt, offline, privacy, pdf]
sources: [source/nuxt-4-installation, source/nuxt-ui-4-installation, source/vite-pwa-nuxt]
related: [decision/adr-0001-stack, decision/adr-0002-pdf-strategy, decision/adr-0003-draft-storage, eng/repo-layout, eng/storage-draft, eng/pdf-generation, eng/privacy-enforcement, eng/offline-pwa, eng/form-schema-model, flow/form-101-service, ux/print-export]
up: index
---

# Architecture

**One static bundle. No backend. No account. The browser is the product.**

The app fills Israeli form 101 (טופס 101), keeps the draft in IndexedDB, and
produces (a) a PDF overlaid on the official form and/or (b) a print-perfect page.
Everything — schema, rules, fonts, the blank official PDF — is shipped as static
assets and cached by a service worker.

Stack is fixed by the product owner: **bun + Nuxt + Nuxt UI**. See
[decision/adr-0001-stack](../decisions/adr-0001-stack.md). Verified versions:
[eng/toolchain-versions](toolchain-versions.md).

## 1. Layers

```
┌──────────────────────────────────────────────────────────────────────┐
│ Presentation (Vue 3.5 / Nuxt 4.6 / Nuxt UI 4.12)                     │
│  app/pages/index.vue        landing / trust copy                      │
│  app/pages/form/index.vue   the form; 8 steps are state, not URLs     │
│  app/pages/employer.vue     employer prefill-link generator           │
│  app/components/steps/*     one lazily-loaded component per step      │
│  app/components/fields/*    field renderer (text/date/select/…)       │
│  app/components/review/*    review + error summary                    │
│  app/components/output/*    print sheet + PDF download                │
└───────────────▲──────────────────────────────────────┬───────────────┘
                │ answers / errors                     │ render
┌───────────────┴──────────────────────────────────────▼───────────────┐
│ Domain (pure TS, no Vue, no DOM)                                     │
│  app/domain/form/schema.ts      sections, fields, steps, rules        │
│  app/domain/form/validate.ts    field + cross-field validators        │
│  app/domain/form/compute.ts     derived values (age, totals)          │
│  app/domain/form/conditions.ts  visibleWhen / requiredWhen evaluator  │
│  app/domain/pdf/field-map.ts    field path -> PDF box (page,x,y,w)    │
│  app/domain/pdf/render.ts       pdf-lib overlay + bidi text           │
└───────────────▲──────────────────────────────────────┬───────────────┘
                │ Draft envelope                       │ bytes
┌───────────────┴──────────────────────────────────────▼───────────────┐
│ Infrastructure                                                       │
│  app/stores/draft.ts      Pinia 4 store (answers, ui, dirty)  [new]  │
│  app/utils/draft.ts       IndexedDB (idb-keyval), migrations, export  │
│  app/plugins/autosave.ts  debounce + flush hooks + BroadcastChannel  │
│  app/composables/useLocale.ts  lightweight he/en dictionaries        │
│  app/locales/{he,en}.ts   typed message objects (current)             │
│  app/utils/format.ts      Intl he-IL / en-IL, bidi-safe formatting   │
│  public/fonts/Heebo-Variable.ttf  source TTF for PDF (UI uses woff2)   │
│  public/forms/tofes-101-2026.pdf  official blank artifact            │
└──────────────────────────────────────────────────────────────────────┘
```

Rules:

- **Domain never imports Vue or Nuxt.** It can be unit-tested in Node and reused
  by the PDF renderer and the review screen.
- **The store never owns validation.** It holds answers + UI state; validators
  read the store snapshot.
- **Only `app/domain/pdf` touches `pdf-lib`.** It is dynamically imported on the
  output step, so the ~516 KB gzip library is not on the first-paint path.
- **Only `app/utils/draft.ts` touches IndexedDB.** One module owns the schema
  version and migrations.

## 2. Module map

| Area | Path (planned, v1) | Status |
| --- | --- | --- |
| App shell | `app/app.vue` (`UApp :locale`, htmlAttrs) | live at repo root |
| Landing | `app/pages/index.vue` | live |
| Form | `app/pages/form/index.vue` (8 steps as state) | live skeleton |
| Employer link | `app/pages/employer.vue` + `shared/employer-link.ts` | live skeleton |
| Locale | `app/composables/useLocale.ts` + `app/locales/{he,en}.ts` | live (no i18n module) |
| Steps | `app/components/steps/Step*.vue` | planned |
| Field renderer | `app/components/fields/Field*.vue` | planned |
| Schema | `app/domain/form/schema.ts` | model defined in [eng/form-schema-model](form-schema-model.md) |
| Validation | `app/domain/form/validate.ts` | validators sourced from [flow/form-101-field-spec](../flow/form-101-field-spec.md) |
| Draft store | `app/stores/draft.ts` + `app/utils/draft.ts` | working spike (`research/spikes/scaffold/app/utils/draft.ts`) |
| Autosave | `app/plugins/autosave.client.ts` | working spike |
| PDF | `app/domain/pdf/*` | working spike (`research/spikes/pdf/`) |
| Print sheet | `app/components/output/PrintSheet.vue` + `@page` CSS | print path verified via Chrome |
| i18n | lightweight `app/locales/{he,en}.ts` | live; @nuxtjs/i18n 10 verified as alternative |
| PWA | `nuxt.config.ts` `pwa` block + `public/` icons | verified offline |
| Privacy gate | `scripts/check-privacy.ts` (already in repo) | verified concept |

## 3. Data flow

```
user types
  │
  ▼
Field component ── v-model ──► Pinia draft store (answers[path])
  │                                   │
  │ blur / step change / 800 ms       │ watch
  ▼                                   ▼
validateField(path)             autosave.schedule()
  │                                   │
  │ errors[path]                      ▼
  └────────────► UI              saveDraft(envelope) ──► IndexedDB
                                      │
                                      ├─ BroadcastChannel('tofes101-draft')
                                      └─ on conflict: banner "another tab saved"

Output step:
  answers ──► compute ──► render PDF (pdf-lib overlay) ──► Blob download
                   └────► PrintSheet HTML ──► window.print() (fallback)
```

The official PDF has **no AcroForm fields**, so output is an overlay onto the
official 2-page artifact, not a form fill. Full reasoning:
[eng/pdf-generation](pdf-generation.md) and
[decision/adr-0002-pdf-strategy](../decisions/adr-0002-pdf-strategy.md).

## 4. Where the schema lives

- **Code is the schema.** `app/domain/form/schema.ts` exports a typed
  `defineFormSchema()` result; conditions and computations are TypeScript
  functions (no `eval`, no runtime-parsed strings). This is a deliberate change
  from the competitor's JS-string expressions.
- **Generated reference stays generated.** `kb/flow/form-101-schema.json` and the
  field spec are extracted from the competitor and used as the field inventory;
  they are *input to review*, not imported at runtime.
- **Tax-year data is separate.** `app/data/rules/2026.json` holds numbers
  (credit point value, thresholds, age limits). Schema references rule keys, not
  literals, so 2027 is a data addition.
- **PDF boxes are separate.** `app/domain/pdf/field-map.ts` maps
  `answers` paths to page/coordinates; it is versioned with the official PDF hash.

See [eng/form-schema-model](form-schema-model.md) for the exact field object,
repeat groups (children, other incomes), validators and migration rules.

## 5. Build and deploy

```bash
bun install
bun run generate        # -> .output/public (verified: 1.2 MB, 32 files)
bun run preview         # local check
```

Deploy `.output/public` to any static host (Netlify, Cloudflare Pages, GitHub
Pages, S3+CDN). Requirements:

- HTTPS (service worker + `navigator.storage` + clipboard).
- `Cache-Control: no-cache` for `index.html` and `sw.js`; hashed `_nuxt/*`
  assets can be `immutable`.
- Set the CSP as a real HTTP header where possible; the meta tag is the
  host-agnostic fallback (the repo's privacy gate requires the meta tag).
- Do **not** enable host analytics, font CDNs, or edge “web vitals” beacons.

## 6. Threat model (one diagram)

```
Assets: answers (name, ID, salary, children, health fund, signature)
        draft in IndexedDB, exported JSON, generated PDF

┌───────────────┐        ┌──────────────────────────────┐
│ User's device │        │ Static host / CDN            │
│               │        │  serves HTML/JS/CSS/font/PDF │
│ IndexedDB ◄───┼────────┤  never receives answers      │
│ ServiceWorker │  HTTPS │  no cookies, no analytics    │
└──────▲────────┘        └──────────────────────────────┘
       │
       │ clipboard / file download / print dialog
       ▼
┌───────────────────────┐
│ Employer, tax office, │  ← the user chooses to hand over
│ cloud drive, email    │    the PDF/JSON; we cannot control it
└───────────────────────┘

Threats and controls
T1  network exfiltration      → CSP connect-src 'self'; privacy gate greps build;
                                no third-party scripts/fonts/analytics
T2  XSS via imported JSON     → parse + schema-validate; never v-html; no eval
T3  another tab overwrites    → revision counter + BroadcastChannel + conflict UI
T4  shared/lost device        → device-only warning; TTL; "delete draft" button;
                                optional app PIN is NOT a security boundary (not v1)
T5  Safari 7-day eviction     → persist() + "install to home screen" + JSON export
T6  shoulder-surfing / print  → print CSS hides nothing the user did not choose;
                                no logging of field values
T7  supply chain              → lockfile, pinned versions, no postinstall scripts
                                beyond Nuxt's `nuxt prepare`
T8  malicious host            → static bundle is reproducible; users can self-host
```

Out of scope in v1: a compromised OS/browser, a malicious browser extension that
can read the DOM, and the recipient's handling of the PDF after download. See
[eng/privacy-enforcement](privacy-enforcement.md) for the enforceable checks.

## 7. Key decisions

| Decision | ADR |
| --- | --- |
| Nuxt 4.6 + Nuxt UI 4.12 + Pinia 4 + static generate; lightweight `useLocale` (i18n 10 verified) | [ADR-0001](../decisions/adr-0001-stack.md) |
| PDF = overlay on the official flat PDF via pdf-lib; HTML print as fallback | [ADR-0002](../decisions/adr-0002-pdf-strategy.md) |
| Draft = Pinia + versioned IndexedDB envelope via idb-keyval | [ADR-0003](../decisions/adr-0003-draft-storage.md) |
| One route, steps as state | this node + [eng/offline-pwa](offline-pwa.md) |
| No server, no accounts, no email | [decision/adr-0004-v1-scope](../decisions/adr-0004-v1-scope.md) |
