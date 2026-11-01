---
id: eng/performance
title: Performance — measured budget, 3G plan, per-step splitting
type: concept
status: verified
confidence: verified
updated: 2026-11-01
tags: [performance, bundle, lighthouse, 3g, code-splitting]
sources: [source/nuxt-4-installation, source/nuxt-ui-4-installation]
related: [eng/architecture, eng/pdf-generation, eng/offline-pwa, eng/testing]
up: eng/architecture
---

# Performance

Lighthouse figures: production scaffold (`bun run generate`, local static server),
Lighthouse 13, mobile profile, **2026-10-29** — not re-measured since the UX
refactor. Bundle figures re-measured **2026-11-01**.

## 1. Measured results

| Metric | Value |
| --- | --- |
| Lighthouse performance | **98** |
| Accessibility | **100** (after the contrast/`<main>` fixes) |
| Best practices | 100 |
| SEO | 54 — intentional (`noindex` private tool; no meta description) |
| FCP | 1.8 s |
| LCP | 1.8 s |
| Total blocking time | 30 ms |
| Cumulative layout shift | **0** |
| Lighthouse "total size" | 967 KiB (raw, incl. font) |

Build output: **93 files, 3.6 MB on disk, 983 KB gzip** for the whole site. The
540 KB official PDF and the 119 KB PDF font are on-demand assets, not first paint.

Everything `index.html` references (module preloads, entry JS/CSS, error-page
chunks): **46 assets, 1,011 KB raw, 285 KB gzip**. That includes assets a phone
never fetches on a successful load — treat it as an upper bound.

Largest pieces (gzip at `-9`):

| File | Raw | Gzip |
| --- | --- | --- |
| PDF path: pdf-lib chunk | 710.7 KB | 329.1 KB |
| PDF path: fontkit + overlay chunk | 382.2 KB | 163.5 KB |
| largest non-PDF lazy chunk | 299.0 KB | 67.0 KB |
| entry CSS (Nuxt UI + Tailwind) | 212.3 KB | 29.0 KB |
| entry JS chunk | 129.2 KB | 45.9 KB |
| Heebo variable TTF (on demand) | 122.0 KB | 76.7 KB |

The PDF library is **not** in that number: pdf-lib + fontkit + bidi-js bundles to
**1.09 MB raw / 493 KB gzip**. It must be lazy-loaded and kept out of the
precache, or first install becomes > 1.5 MB.

> The root build self-hosts **two Heebo WOFF2 subsets** via `@nuxt/fonts`
> (14.8 KB + 30.1 KB = **44.9 KB**, measured in `.output/public/_fonts/`), much
> cheaper than the spike's full 122 KB TTF. That is the number to budget for the
> UI; the full TTF is only needed for PDF generation (lazy). If we disable
> `@nuxt/fonts`, replicate the subsetting with `pyftsubset`.

## 2. Budgets (v1)

| Budget | Target | Current | Gate |
| --- | --- | --- | --- |
| Initial JS+CSS, gzip | ≤ 200 KB | ~285 KB (upper bound) | investigate before launch |
| Initial total incl. font, gzip | ≤ 280 KB | not re-measured | font subsetting |
| LCP (mobile, simulated 4G) | ≤ 2.0 s | 1.8 s (2026-10-29) | Lighthouse CI |
| TBT | ≤ 200 ms | 30 ms (2026-10-29) | Lighthouse CI |
| CLS | ≤ 0.05 | 0 (2026-10-29) | Lighthouse CI |
| Per-step lazy chunk, gzip | ≤ 30 KB | — (not split per step yet) | bundle report |
| PDF chunk, gzip | ≤ 550 KB | 493 KB | lazy + runtime cache |
| Total precache | ≤ 1.2 MB | — (no service worker yet) | Workbox log |

Do not chase SEO (54): the app must not be indexed. Keep `noindex`; exclude SEO
from the budget.

## 3. Why it is already fast

- **One route.** No router payload, no per-route waterfall, no layout shift.
- **No images, no icon font, no Google Fonts, no analytics SDK** beyond the
  2.7 KB Umami tag (page views only, ADR-0008); it is deferred and off the
  critical path.
- **Nuxt UI is CSS-first**: Tailwind emits only the classes used; the CSS is a
  single 29 KB gzip file.
- **Static prerender** (`nuxt generate`): the HTML ships with the rendered form,
  so first paint does not wait for hydration.
- **Local font** with `font-display: swap`, one family, variable weights.
- **Service worker** (planned, `PLAN.md` Phase 2) will make repeat visits instant
  and offline; today only HTTP caching applies.

## 4. The 3G plan

Assumptions: ~400 kbps effective, 150 ms RTT, mid-range Android. 235 KB gzip is
~4.7 s of pure transfer at 400 kbps — too slow. The measured 1.8 s LCP is on
Lighthouse's simulated "Slow 4G" (1.6 Mbps), not real 3G. Targets:

1. **Cut initial JS.** Enable
   `ui.experimental.componentDetection: true` (4.1+) and verify the CSS/JS drop.
   Import only the Nuxt UI components used; avoid the full icon set.
2. **Subset the font.** `pyftsubset Heebo-Variable.ttf --text-file=he+en.txt
   --flavor=woff2` → typically 25–40 KB for Hebrew+Latin UI glyphs; ship the full
   TTF only for PDF generation (or subset with fontkit at build time for the PDF
   too). Saves ~40–50 KB gzip on first paint.
3. **Split steps.** `defineAsyncComponent(() => import('~/components/steps/Step3.vue'))`;
   preload only the current step and the next one (`<link rel="modulepreload">`
   via `useHead` or Nuxt's `preloadRouteComponents` on intent).
4. **Do not precache the PDF chunk.** First install stays under 1.2 MB; the PDF
   chunk is fetched on first "download" and cached by Workbox runtime caching.
5. **Compress at the host** (brotli); the numbers above are gzip, brotli is
   ~15% smaller.
6. **Preconnect is unnecessary** — everything is same-origin. Do not add
   `dns-prefetch` for anything.

Expected after 1–3: initial ~150–180 KB gzip, LCP < 1.5 s on Slow 4G.

## 5. Per-step code splitting

- Steps are **state**, not routes, but their components can still be async.
- A step module imports only the field components it uses; the field registry is
  a map of dynamic imports, not a barrel file.
- Validation/computation for a step is imported with the step; cross-field rules
  live in the domain module (small, always loaded).
- Prefetch the next step on "המשך" hover/focus (`requestIdleCallback` fallback).
- Keep the review step's PDF import dynamic:
  `const { renderPdf } = await import('~/domain/pdf/render')`.
- Measure with `rollup-plugin-visualizer` (or `nuxi analyze`) before/after; add a
  CI budget check on the generated chunk sizes.

## 6. Measurement commands

```bash
bun run generate
bunx serve .output/public -l 3013
npx lighthouse http://localhost:3013/ --only-categories=performance,accessibility \
  --chrome-flags="--headless=new" --output=json --output-path=/tmp/lh.json
```

Bundle accounting (no extra tool):

```bash
node -e "const fs=require('fs'),z=require('zlib'),p=require('path');
const w=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?w(p.join(d,e.name)):[p.join(d,e.name)]);
let r=0,g=0;for(const f of w('.output/public').filter(x=>/\.(js|css|html|ttf|json)$/.test(x))){const b=fs.readFileSync(f);r+=b.length;g+=z.gzipSync(b).length}
console.log('raw',(r/1024|0)+'KB','gzip',(g/1024|0)+'KB')"
```

## 7. Things that will make it slow (do not do)

- Adding `@nuxt/content`, a chart library, or a component library on top of Nuxt UI.
- Importing `pdf-lib` at the top of the app or in the review component's static
  imports.
- Enabling `@nuxt/fonts` with remote providers (network + privacy).
- Shipping all 160 fields as one eager component tree.
- Preloading every step chunk.
- Adding a web font per weight instead of one variable font.
- Turning on Nuxt DevTools in production.
