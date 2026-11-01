---
id: eng/repo-layout
title: Repo layout — directories, naming, boundaries, scripts
type: concept
status: verified
confidence: verified
updated: 2026-11-01
tags: [repo, structure, conventions, nuxt]
sources: [source/nuxt-4-installation]
related: [eng/architecture, eng/toolchain-versions, eng/form-schema-model, eng/agent-workflow, decision/adr-0001-stack]
up: eng/architecture
---

# Repo layout

Nuxt 4 keeps source under `app/`; `public/`, `nuxt.config.ts` and `package.json`
stay at the root. This repo also carries the knowledge base (`kb/`) and research
artifacts (`research/`), which are documentation only and never imported.

**Why this matters for agents:** every boundary below is also a routing rule.
If a change crosses a boundary, it is either an architectural change (needs an
ADR) or a sign you are editing the wrong layer.

```
tofes101/
├── AGENTS.md                  # AI working agreement (CLAUDE.md symlinks here)
├── FINDINGS.md                # dated implementation traps — read before debugging
├── PLAN.md                    # roadmap + open questions (O-n)
├── app/
│   ├── app.vue                # UApp + locale object + htmlAttrs
│   ├── app.config.ts          # Nuxt UI theme (primary teal, neutral slate)
│   ├── assets/css/main.css    # Tailwind v4 + @nuxt/ui + tokens + print CSS
│   ├── form/                  # PURE domain — no Vue, no #imports, no network
│   │   ├── schema.ts          # 160 fields as data (ids are storage keys)
│   │   ├── types.ts           # FieldDef, FormState, Step, Predicate
│   │   ├── engine.ts          # visibility, requiredness, gating, full validation
│   │   ├── validators.ts      # id Luhn, dates, phones, ranges, distinctFrom…
│   │   ├── derive.ts          # spousePresent, hasOtherIncome, child age…
│   │   ├── documents.ts       # required-document checklist from answers
│   │   ├── values.ts          # asBool, TAX_YEAR, date helpers
│   │   ├── format.ts          # display formatting (Intl, ₪, dates)
│   │   └── cities.ts          # bundled locality snapshot (data, not logic)
│   ├── components/
│   │   ├── form/              # one component per control kind + summaries
│   │   └── layout/            # site header/footer, draft menu, save status
│   ├── composables/           # useFormStore, useLocale, usePdfExport,
│   │                          # useDraftSummary, useVisualKeyboard, useAppPath
│   ├── layouts/               # default (marketing) + wizard (the form shell)
│   ├── locales/{he,en,index}.ts  # typed message catalogs, parity tested
│   ├── pages/                 # / · /employer · /form · /print · /privacy · /accessibility
│   ├── pdf/                   # lazy overlay chunk
│   │   ├── anchors.json       # GENERATED coordinate map (pinned PDF hash)
│   │   ├── anchors.ts         # typed access to the map
│   │   ├── fields.ts          # FormState → draw items (text | cell | mark | signature)
│   │   ├── overlay.ts         # renderPdf() → Uint8Array
│   │   ├── rtl.ts             # bidi-safe line layout (never drawText Hebrew directly)
│   │   └── README.md          # pipeline + intentionally-not-printed fields
│   └── storage/
│       ├── idb.ts             # ONE database, ONE version, both stores
│       ├── draft.ts           # versioned envelope, migrations, autosave
│       └── files.ts           # attachment blobs (never inside the JSON draft)
├── shared/employer-link.ts    # #e= payload codec (deflate-raw + base64url)
├── public/
│   ├── CNAME                          # 101.chv.ovh — Pages serves the domain root
│   ├── favicon.svg
│   ├── assets/tofes-101-official.pdf  # pinned by SHA-256
│   └── fonts/Heebo-Variable.ttf       # TTF for fontkit; UI uses @nuxt/fonts WOFF2
├── tests/                     # bun test: engine, content, documents, employer-link,
│                              # navigation, pdf  (113 tests, ~0.6 s)
├── tools/
│   ├── e2e/flow.ts            # full Playwright + axe flow (~4 min)
│   ├── pdf/                   # build-anchors, dump-text, extract-cells, audit, samples
│   ├── crawl/                 # reference-form extraction (research, not shipped)
│   ├── kb/gen-field-spec.ts   # reference JSON → field spec
│   └── serve.ts               # static server for .output/public
├── scripts/
│   ├── kb.ts                  # graph builder + link checker
│   └── check-privacy.ts       # external-host / CSP build gate
├── kb/                        # knowledge graph (start: kb/index.md)
├── docs/                      # IMPLEMENTATION.md (contracts), UX-REFACTOR-PLAN.md
├── research/                  # raw evidence, spikes, audit screenshots (never shipped)
└── agent-workspace/           # per-agent scratch notes (not authoritative)
```

## 1. Boundary rules

| Rule | Why |
| --- | --- |
| `app/form/**` must not import `vue`, `#app`, `#imports` or `@nuxt/ui` | unit-testable in Node; shared by review, print and PDF |
| only `app/storage/idb.ts` opens IndexedDB | one schema, one migration path, no `onblocked` hangs |
| only `app/pdf/**` imports `pdf-lib`/`fontkit` | keeps ~500 KB gzip off the main path |
| components render, `app/form` decides | a rule in a `.vue` cannot be tested or reused |
| no `v-html`, no `eval`, no `new Function` | strict CSP + imported JSON |
| no Hebrew literals in components | all copy through `app/locales` keys |
| `kb/`, `research/` are never imported by `app/` | documentation and spikes, not runtime |
| `public/assets/*.pdf` is pinned by hash | the coordinate map depends on that exact artifact |

## 2. Naming

- Components: `PascalCase.vue`, no folder prefix (`FormField`, `StepProgress` —
  `nuxt.config.ts` sets `pathPrefix: false`).
- Pure modules: kebab-case files where multi-word (`employer-link.ts`), camelCase
  exports.
- Field ids: `section/row/name` style (`employee.idKind`, `credits.reserveDays`);
  repeater rows use **bare** keys (`birthDate`).
- i18n keys: `form.<section>.<field>.label`, `.help`, `.error.<code>`; generic
  errors under `error.<code>`.
- Tests: `<unit>.test.ts` (bun). There is no separate Playwright spec naming
  convention — the flow is `tools/e2e/flow.ts`.

## 3. Scripts

```json
{
  "dev": "nuxt dev",
  "generate": "nuxt generate",
  "test": "bun test",
  "check:fast": "bun run kb:check && bun test",
  "check:privacy": "bun run scripts/check-privacy.ts",
  "typecheck": "nuxt typecheck",
  "serve": "bun run tools/serve.ts",
  "kb": "bun run scripts/kb.ts",
  "kb:check": "bun run scripts/kb.ts check",
  "extract:form": "bun run tools/crawl/extract-form.ts && bun run tools/kb/gen-field-spec.ts",
  "e2e": "bun run tools/e2e/flow.ts",
  "verify": "kb:check → test → generate → check:privacy → e2e"
}
```

CI order (`.github/workflows/ci.yml`): `install → kb:check → test → typecheck →
generate → check:privacy → e2e`. `check:privacy` needs `.output/public`, so it
runs after `generate`. Cost of each gate: `AGENTS.md` §6.

## 4. Generated / ignored

- `.nuxt/`, `.output/`, `node_modules/`, `test-results/` — ignored build output.
- `kb/.generated/**` — generated by `bun run kb`; never hand-edited.
- `kb/flow/form-101-field-spec.md`, `kb/flow/form-101-schema.json`,
  `app/pdf/anchors.json` — generated; regenerate, never patch.
- `research/spikes/**` — historical spikes. Keep sources and small final
  artifacts; do not resurrect them as the implementation.

## 5. Environment

- No `.env` is required. If one appears it must carry no secrets (there is no
  server) and must not change the analytics configuration.
- `NUXT_PUBLIC_*` values are public by definition; never put PII there.
- Builds must be reproducible from `bun.lock`; CI pins bun 1.4.3.
- Local NetFree CA workaround (`NODE_TLS_REJECT_UNAUTHORIZED=0` for `bun install`)
  applies to this machine only — never commit it.

## 6. Branching / release

- `main` is the only long-lived branch; PRs must pass the privacy gate and tests.
- Static site deploys from `main` via `.github/workflows/deploy.yml`; it builds
  with `NUXT_APP_BASE_URL=/` for the custom domain `101.chv.ovh`
  (`docs/IMPLEMENTATION.md` §11). Keep the official PDF hash and schema version
  in release notes.
- A tax-year update is a **data** change (year-stamped rules + PDF map if the
  official form changed) — never a fork of the app.
