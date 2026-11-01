---
id: eng/architecture
title: Architecture — client-only Nuxt app, layers, data flow, threat model
type: concept
status: verified
confidence: verified
updated: 2026-11-01
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
│  app/pages/{index,employer,form,print,privacy,accessibility}.vue      │
│  app/components/form/*      one component per control kind           │
│  app/components/layout/*    header, footer, draft menu, save status  │
│  app/layouts/{default,wizard}.vue   marketing shell / form shell     │
└───────────────▲──────────────────────────────────────┬───────────────┘
                │ state / errors                       │ render
┌───────────────┴──────────────────────────────────────▼───────────────┐
│ Domain — pure TS, no Vue, no DOM, no network   (app/form/)            │
│  schema.ts      the 160 fields as data, step by step                 │
│  engine.ts      visibility, requiredness, gating, full validation    │
│  validators.ts  ID Luhn, dates, phones, ranges, distinctFrom…        │
│  derive.ts      spousePresent, hasOtherIncome, child ages…           │
│  documents.ts   required-document checklist from answers             │
│  values.ts / format.ts   TAX_YEAR, asBool, Intl formatting           │
└───────────────▲──────────────────────────────────────┬───────────────┘
                │ draft envelope                       │ bytes
┌───────────────┴──────────────────────────────────────▼───────────────┐
│ Infrastructure                                                       │
│  app/composables/useFormStore.ts   the only stateful object          │
│  app/storage/{idb,draft,files}.ts  IndexedDB: one DB, one version    │
│  app/pdf/{anchors,fields,overlay,rtl}.ts  lazy overlay chunk         │
│  app/composables/useLocale.ts + app/locales/{he,en}.ts               │
│  public/assets/tofes-101-official.pdf   official blank artifact      │
│  public/fonts/Heebo-Variable.ttf        TTF for fontkit/pdf-lib      │
└──────────────────────────────────────────────────────────────────────┘
```

Rules:

- **Domain never imports Vue or Nuxt.** It is unit-testable in Node and reused by
  the PDF renderer, the review screen and the print sheet.
- **The store never owns a rule.** `useFormStore` holds answers + UI state, runs
  the engine, and delegates persistence; it must not branch on marital status,
  income type or any other domain condition.
- **Only `app/pdf/**` imports `pdf-lib`/`fontkit`.** It is dynamically imported on
  the output step, so the ~500 KB gzip library stays off the first-paint path.
- **Only `app/storage/idb.ts` opens IndexedDB.** One database, one version, one
  upgrade function — two modules opening it with different versions hang on
  `onblocked`.

## 2. Module map

| Area | Path | Status |
| --- | --- | --- |
| App shell | `app/app.vue` (`UApp :locale`, htmlAttrs) | live |
| Landing | `app/pages/index.vue` | live |
| Form | `app/pages/form.vue` (9 steps as state, one route) | live |
| Employer link | `app/pages/employer.vue` + `shared/employer-link.ts` | live |
| Print sheet | `app/pages/print.vue` + `@page` CSS | live |
| Locale | `app/composables/useLocale.ts` + `app/locales/{he,en}.ts` | live (no i18n module) |
| Field renderer | `app/components/form/FormField.vue` (+ `FormRepeat`, `DateField`, `CityField`, `FormSignature`) | live |
| Schema | `app/form/schema.ts` | live; model in [eng/form-schema-model](form-schema-model.md) |
| Validation | `app/form/{engine,validators}.ts` | live; sourced from [flow/form-101-field-spec](../flow/form-101-field-spec.md) |
| Draft store | `app/composables/useFormStore.ts` | live |
| Persistence | `app/storage/{idb,draft,files}.ts` | live (no Pinia, no idb-keyval) |
| PDF | `app/pdf/{anchors,fields,overlay,rtl}.ts` | live; coordinates generated, see [eng/pdf-slot-map](pdf-slot-map.md) |
| PWA | service worker + manifest | **not shipped** (`PLAN.md` Phase 2) |
| Privacy gate | `scripts/check-privacy.ts` | live in CI |

## 3. Data flow

```
user types
  │
  ▼
Field component ── v-model ──► useFormStore (answers[path])
  │                                   │
  │ blur / step change / 800 ms       │ watch
  ▼                                   ▼
validateField(path)             draft.save(state)
  │                                   │
  │ errors[path]                      ▼
  └────────────► UI              saveDraft(envelope) ──► IndexedDB
                                      │
                                      └─ multi-tab: revision check + banner
                                         "another tab saved"

Output step:
  answers ──► app/form/derive ──► renderPdf (pdf-lib overlay) ──► Blob download
                    └────► print sheet HTML ──► window.print() (fallback)
```

The official PDF has **no AcroForm fields**, so output is an overlay onto the
official 2-page artifact, not a form fill. Full reasoning:
[eng/pdf-generation](pdf-generation.md) and
[decision/adr-0002-pdf-strategy](../decisions/adr-0002-pdf-strategy.md).

## 4. Where the schema lives

- **Code is the schema.** `app/form/schema.ts` exports the typed `Step[]` tree;
  conditions and computations are TypeScript predicates (no `eval`, no runtime-
  parsed strings). This is a deliberate change from the competitor's JS-string
  expressions.
- **Generated reference stays generated.** `kb/flow/form-101-schema.json` and the
  field spec are extracted from the competitor and used as the field inventory;
  they are *input to review*, not imported at runtime.
- **Tax-year constants live in code.** `app/form/values.ts` holds `TAX_YEAR` and
  the year-stamped numbers; there is no `app/data/rules/2026.json`. Adding 2027
  means a data pass over `values.ts` + schema, not a fork of the app.
- **PDF boxes are generated, not hand-mapped.** `app/pdf/anchors.json` maps
  anchors to page/coordinates and is rebuilt from the official PDF
  (`tools/pdf/build-anchors.ts`), pinned by the PDF's SHA-256.

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
│ ServiceWorker │  HTTPS │  no cookies, no answers     │
└──────▲────────┘        └──────────────────────────────┘
       │
       │ clipboard / file download / print dialog
       ▼
┌───────────────────────┐
│ Employer, tax office, │  ← the user chooses to hand over
│ cloud drive, email    │    the PDF/JSON; we cannot control it
└───────────────────────┘

Threats and controls
T1  network exfiltration      → CSP connect-src 'self' + the one analytics host;
                                privacy gate greps build; no form data in the
                                page-view payload (ADR-0008)
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

**Drift note (2026-11-01):** ADR-0001/0003 name Pinia 4 and `idb-keyval`. The
shipped app uses a plain composable (`useFormStore`) and a local ~100-line
IndexedDB wrapper (`app/storage/idb.ts`) instead — fewer moving parts, same
envelope/migration properties. Treat the ADRs as rationale, this node and
[eng/storage-draft](storage-draft.md) as the current truth.
