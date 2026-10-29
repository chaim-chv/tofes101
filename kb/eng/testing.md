---
id: eng/testing
title: Testing and quality gates — Vitest, Playwright, axe, CI
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [testing, vitest, playwright, axe, ci, accessibility]
sources: [source/nuxt-4-installation]
related: [eng/architecture, eng/storage-draft, eng/pdf-generation, eng/performance, ux/checklists/a11y-pr-checklist]
up: eng/architecture
---

# Testing and quality

Verified in the scaffold: **Vitest 5.0.5** (8/8 draft tests pass), **Playwright
1.64.1** (`channel: 'chrome'`, real Chrome install), **axe-core 4.14.0**
(0 violations after fixes), **Lighthouse 13** (98 performance / 100 accessibility).

The repo root currently wires `bun test` and `tools/e2e/smoke.ts` (Playwright).
Keep the smoke test; add Vitest for the pure domain layer — `bun test` is fine
for quick scripts but Vitest gives fake timers, snapshots and `@nuxt/test-utils`
integration, and is what the draft spike is tested with.

## 1. Layers

| Layer | Tool | What it must cover |
| --- | --- | --- |
| Domain unit | Vitest 5 | conditions, validators, computations, formatting, migrations |
| Store | Vitest + fake-indexeddb 6.2.6 | save/load, conflicts, TTL, autosave debounce |
| Component | `@nuxt/test-utils` 4.3.4 + Vitest | field rendering, errors, focus order (optional but recommended) |
| E2E | Playwright + Chrome | full form, reload persistence, PDF download, print, offline |
| A11y | axe-core in Playwright | every step + review + print preview |
| Visual/PDF | Playwright screenshot + Ghostscript/Pillow diff | golden form overlay |
| Privacy | `scripts/check-privacy.ts` + network log | no external host |
| Performance | Lighthouse CI or `lighthouse` budget | LCP/TBT/CLS + bundle size |

## 2. Unit tests (what we actually ran)

`research/spikes/scaffold/tests/draft.test.ts`:

```bash
cd research/spikes/scaffold && bunx vitest run tests/draft.test.ts
# Test Files 1 passed (1) · Tests 8 passed (8) · 118 ms
```

Covers: v1→v3 and v2→v3 migration, future-schema refusal, foreign-app refusal,
IndexedDB round-trip (fake-indexeddb), conflicting revision, export/import
round-trip, bad JSON, wrong tax year.

Next domain tests:

- `visibleWhen` / `requiredWhen` for every conditional field (children, spouse,
  passport vs ID, tax coordination).
- ID check digit (Luhn), Israeli phone, date ranges (birth ≤ today, aliyah ≥
  birth), age 16–120.
- Computed values: age, age at tax-year end, totals; freeze time with
  `vi.setSystemTime(new Date('2026-10-29'))`.
- Every error message key exists in both `app/locales/he.ts` and `en.ts`.
- Schema invariants: unique paths, every field has a step, every required field
  has a message key, every PDF map key exists in the schema.

## 3. E2E (Playwright)

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test'
export default defineConfig({
  use: { channel: 'chrome', baseURL: 'http://localhost:3013', trace: 'on-first-retry' },
  webServer: { command: 'bun run preview --port 3013', url: 'http://localhost:3013', reuseExistingServer: true }
})
```

Scenarios:

1. Fill the minimum required fields → review shows no errors → download PDF
   (assert `download.suggestedFilename()` and `pdf` size > 500 KB).
2. Reload mid-form → answers restored, last step restored.
3. Two contexts/tabs → conflict banner appears and "overwrite" works.
4. Import a fixture JSON for 2025 → clear refusal; for 2026 → preview + replace.
5. Print preview: `page.emulateMedia({ media: 'print' })` → no clipped fields,
   A4 page count 2.
6. Offline reload (verified, see below).
7. RTL/LTR toggle: `html[dir]` flips; no horizontal scroll at 360 px.

Offline test (working script, `scripts/offline-test.mjs`):

```ts
await page.goto(url, { waitUntil: 'networkidle' })
await page.evaluate(() => navigator.serviceWorker.ready)
await context.setOffline(true)
await page.reload({ waitUntil: 'domcontentloaded' })
expect(await page.locator('h1').innerText()).toContain('טופס 101')
```

Result in the spike: `{ active: true, controlled: true, reloadOk: true, errors: [] }`.

## 4. Accessibility — real findings and fixes

axe on the first scaffold build (`wcag2a/aa`, `wcag21a/aa`):

```
color-contrast (serious, 4 nodes)
  div[aria-label="יום"]   #90a1b9 on #fff = 2.63:1 (needs 4.5)
  div[aria-label="חודש"]  same
  div[aria-label="שנה"]   same
  .truncate (button)      #fff on #00c950 = 2.21:1
document-title (serious)
```

Fixes that produced **0 violations / 24 passes**:

```css
:root {
  --ui-primary: var(--color-teal-700);      /* white on teal-700 = 5.4:1 */
  --ui-text-dimmed: var(--color-slate-600); /* placeholders ≥ 4.5:1 */
}
```

plus a real `<title>` and wrapping page content in `<main>` (Lighthouse had
flagged the missing main landmark: a11y 98 → 100).

**Live root, 2026-10-29:** still 2 serious contrast violations —

```
.px-2  (success badge)  #00c950 on #e2f7ec = 1.97:1
.text-inverted (CTA)    #fff on #00bba7 = 2.42:1
```

Apply the same overrides to the root `app/assets/css/main.css`:

```css
:root {
  --ui-primary: var(--color-teal-700);   /* CTA white-on-teal-700 = 5.4:1 */
  --ui-success: var(--color-green-700);  /* badge text on success/10 bg */
  --ui-text-dimmed: var(--color-slate-600);
}
```

`--ui-primary`/`--ui-success` are defined in the Nuxt UI `<style id="nuxt-ui-colors">`
block in `index.html` as `var(--ui-color-*-500)`; overriding the semantic variable
is enough.

Keep axe in CI on every step, not just the landing page. Known hard cases:
canvas signature (needs a text alternative), error summary focus, dynamic
`aria-live` announcements, and the print sheet.

## 5. PDF / visual tests

- Golden fixtures: one filled PDF per layout (employee only; employee + spouse +
  children; foreign worker).
- Render output to PNG with Ghostscript at 150 dpi
  (`gs -sDEVICE=png16m -r150`), compare per-field crops (SSIM or pixel diff with
  a tolerance), not whole-page hashes (font raster differs by version).
- Enforce: page count = 2, file size delta < 5%, signature inside its box.
- Hebrew text layer: extract with pypdf and assert the *expected* visual-order
  string as a regression marker (documenting the known limitation), or skip and
  test only rendering.
- Cross-reader smoke: macOS Preview + Chrome + Acrobat Reader (manual release
  checklist; automated only for Chrome).

## 6. CI (GitHub Actions, bun)

```yaml
name: ci
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with: { bun-version: 1.4.3 }
      - run: bun install --frozen-lockfile
      - run: bun run generate
      - run: bun run check:privacy
      - run: bunx vitest run
      - run: bunx playwright install --with-deps chrome
      - run: bunx playwright test
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-traces, path: test-results/ }
```

Notes:

- `check:privacy` needs `.output/public`, so it runs after `generate`.
- Playwright uses `channel: 'chrome'`; on Linux CI install `chrome` (or switch to
  the bundled Chromium and keep `channel` configurable).
- Cache `~/.bun/install/cache` and Playwright browsers; do not cache
  `.output`.
- The local NetFree CA issue (`NODE_TLS_REJECT_UNAUTHORIZED=0`) does **not** apply
  to GitHub-hosted runners; never commit that env var.
- Add a second job for Lighthouse (or `unlighthouse`) with a budget; fail on
  performance < 90 or LCP > 2.5 s on the mobile profile.

## 7. Definition of done for a feature

- Unit tests for every new condition/validator/computation.
- One E2E path that exercises it through the UI.
- axe clean on the affected step (and no new violations globally).
- Draft migration if the answer shape changed.
- PDF map entry if the field is printed.
- Both locales have messages; no hard-coded Hebrew in components.
- `bun run generate && bun run check:privacy` green.
