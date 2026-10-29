---
id: eng/repo-layout
title: Repo layout — directories, naming, boundaries, scripts
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [repo, structure, conventions, nuxt]
sources: [source/nuxt-4-installation]
related: [eng/architecture, eng/toolchain-versions, eng/form-schema-model, decision/adr-0001-stack]
up: eng/architecture
---

# Repo layout

Nuxt 4 uses an `app/` source directory (verified with create-nuxt 4.0.1): pages,
components, composables, utils and assets live under `app/`, while `public/`,
`server/`, `nuxt.config.ts` and `package.json` stay at the root. This repo also
carries the knowledge base and research artifacts.

```
tofes101/
├── app/
│   ├── app.vue                 # UApp + locale object + htmlAttrs (live)
│   ├── app.config.ts           # Nuxt UI theme: primary teal, neutral slate
│   ├── assets/css/main.css     # Tailwind v4 + @nuxt/ui + tokens + print CSS
│   ├── composables/
│   │   └── useLocale.ts        # lightweight he|en, t(), localStorage (live)
│   ├── locales/{he,en}.ts      # typed message objects (live)
│   ├── pages/
│   │   ├── index.vue           # landing / trust copy (live)
│   │   ├── form/index.vue      # the form; 8 steps are state (live skeleton)
│   │   └── employer.vue        # prefill-link generator (live skeleton)
│   ├── components/
│   │   ├── steps/              # Step1..Step8, lazily loaded (planned)
│   │   ├── fields/             # FieldText, FieldDate, FieldSelect, FieldMoney
│   │   ├── layout/             # AppHeader, StepNav, PrivacyNote, DraftBanner
│   │   ├── review/             # ReviewSummary, ErrorSummary
│   │   └── output/             # PdfDownload, PrintSheet, SignaturePad
│   ├── domain/                 # pure TS, no Vue/Nuxt imports (planned)
│   │   ├── form/{schema,types,conditions,validate,compute,format}.ts
│   │   └── pdf/{field-map,bidi-text,render}.ts
│   ├── stores/draft.ts         # Pinia 4 store (planned)
│   ├── plugins/autosave.client.ts
│   └── utils/draft.ts          # IndexedDB envelope + migrations (planned)
├── shared/
│   └── employer-link.ts        # encode/decode #e=… payload (live)
├── public/
│   ├── favicon.svg
│   ├── fonts/Heebo-Variable.ttf        # if we self-host (see below)
│   ├── forms/tofes-101-2026.pdf        # pinned official PDF
│   ├── icons/{192,512,maskable}.png
│   ├── _headers                # host headers (CSP, cache, permissions)
│   └── robots.txt              # noindex
├── i18n/                       # only if we adopt @nuxtjs/i18n (not used now)
├── tests/                      # unit fixtures + e2e specs
├── tools/
│   ├── e2e/smoke.ts            # current Playwright smoke (live)
│   ├── crawl/                  # research extraction (not shipped)
│   └── kb/gen-field-spec.ts
├── scripts/
│   ├── kb.ts                   # knowledge graph builder
│   └── check-privacy.ts        # build-time privacy gate
├── kb/                         # knowledge base (this graph)
├── research/
│   ├── raw/                    # crawled artifacts (not shipped)
│   └── spikes/                 # working prototypes (not shipped)
├── nuxt.config.ts
├── package.json
├── bun.lock
└── tsconfig.json
```

## 0. Current vs planned

The repo root already has: Nuxt 4.6.3, Nuxt UI 4.12.0, the three pages, the
lightweight `useLocale`/`locales`, `shared/employer-link.ts`, the privacy gate and
a Playwright smoke at `tools/e2e/smoke.ts`. **Not yet present:** Pinia + the draft
layer, the domain schema, the PDF pipeline, the PWA module, and a shipped font.

Font note: `@nuxt/fonts` (auto-registered by Nuxt UI) resolves the `Heebo` in
`--font-sans` **at build time** and emits two local WOFF2 subsets
(`.output/public/_fonts/*.woff2`, 14.8 KB + 30.1 KB measured). There is no
runtime font request — good. The PDF pipeline still needs a real **TTF/OTF**
(fontkit cannot use the WOFF2 build output), so keep a source
`public/fonts/Heebo-Variable.ttf` (122 KB, OFL) or download it in a build script.
That guarantees the UI, print and PDF use the same family. If we ever disable
`@nuxt/fonts`, switch to an explicit self-hosted `@font-face`.

## 1. Boundary rules

| Rule | Why |
| --- | --- |
| `app/domain/**` must not import `vue`, `#app`, `#imports` or `@nuxt/ui` | unit-testable in Node, reusable by PDF and review |
| only `app/utils/draft.ts` touches IndexedDB | one schema, one migration path |
| only `app/domain/pdf/**` imports `pdf-lib`/`fontkit` | keeps 516 KB gzip off the main path |
| no `v-html`, no `eval`, no `new Function` | strict CSP + imported JSON |
| no Hebrew literals in components | all copy through i18n keys |
| `research/` and `kb/` are never imported by `app/` | they are documentation/spikes, not runtime |
| `public/forms/*.pdf` is pinned by hash | coordinate map depends on the exact artifact |

## 2. Naming

- Components: `PascalCase.vue`, prefix by area (`Field*`, `Step*`, `Pdf*`).
- Domain files: kebab-case; exported functions camelCase.
- Field paths: `section/row/name`, matching the generated reference
  (`employee/nameRow/firstName`) so the field spec, schema and PDF map line up.
- i18n keys: `form.<section>.<field>.label`, `.help`, `.error.<code>`; generic
  errors under `error.<code>`.
- Tests: `<unit>.test.ts` (Vitest), `<flow>.spec.ts` (Playwright).
- Draft JSON files: `tofes101-2026-draft-YYYY-MM-DD.json`.

## 3. Scripts

```json
{
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare",
    "test": "bun test",                       // current root
    "test:unit": "vitest run",                // recommended for domain tests
    "test:e2e": "bun run tools/e2e/smoke.ts", // current root (Playwright)
    "verify": "bun run test && bun run generate && bun run check:privacy && bun run e2e",
    "check:privacy": "bun run scripts/check-privacy.ts",
    "kb": "bun run scripts/kb.ts",
    "kb:check": "bun run scripts/kb.ts check"
  }
}
```

CI order: `install → generate → check:privacy → test → test:e2e`.

## 4. Generated / ignored

- `.nuxt/`, `.output/`, `node_modules/`, `test-results/`, `playwright-report/` —
  ignored.
- `kb/.generated/**` — generated by `bun run kb`, never hand-edited.
- `research/spikes/*/.output`, `node_modules` — ignored; keep the source scripts
  and the final result artifacts (PDF/PNG) small and intentional.

## 5. Environment

- No `.env` is required. If one appears, it must not carry secrets (there is no
  server) and must not enable analytics.
- `NUXT_PUBLIC_*` values are public by definition; never put PII there.
- Build must be reproducible from `bun.lock`; pin bun 1.4.3 in CI.

## 6. Branching / release

- `main` is the only long-lived branch; PRs require the privacy gate + tests.
- The generated site is deployed from a tag; keep the official PDF hash and the
  schema version in the release notes.
- A tax-year update is a data PR (`app/data/rules/2027.json`) plus a PDF map PR
  if the official form changed — never a fork of the app.
