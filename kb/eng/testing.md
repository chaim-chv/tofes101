---
id: eng/testing
title: Testing and quality gates — bun test, Playwright + axe, privacy gate, CI
type: concept
status: verified
confidence: verified
updated: 2026-11-01
tags: [testing, bun, playwright, axe, ci, accessibility, pdf]
sources: [source/nuxt-4-installation]
related: [eng/architecture, eng/storage-draft, eng/pdf-generation, eng/performance, eng/agent-workflow, ux/checklists/a11y-pr-checklist]
up: eng/architecture
---

# Testing and quality

One runner (`bun test`), one browser suite (`tools/e2e/flow.ts`), one build gate
(`scripts/check-privacy.ts`). No Vitest, no separate Playwright config file — the
e2e is a plain Playwright script so one command covers the whole flow.

**Which test to run for which change is a routing question, not a testing
question — see the ladder in `AGENTS.md` §6 and [eng/agent-workflow](agent-workflow.md).
Short version: docs ⇒ `kb:check`; logic ⇒ `bun test`; UI/print ⇒ `generate` +
`e2e`; `bun run verify` only for release.**

Measured 2026-11-01: `check:fast` 0.6 s · `typecheck` 5 s · `generate` 9 s ·
`e2e` 4 m 17 s.

## 1. What each suite covers

| File | Covers |
| --- | --- |
| `tests/engine.test.ts` (394) | ID checksum and digit rules, date ranges, visibility, requiredness, validation, step gating, hidden answers retained, progress, full validation, identity uniqueness, format rules, initials |
| `tests/content.test.ts` (139) | he/en catalog parity, every schema `labelKey`/message key exists in both, draft envelope shape |
| `tests/documents.test.ts` (116) | document checklist derivation, requiredness, attachment status |
| `tests/employer-link.test.ts` (96) | `#e=` encode/decode, compression, tamper cases |
| `tests/navigation.test.ts` (50) | step order/back-forward, signature fingerprint stability |
| `tests/pdf.test.ts` (435) | `rtlTokens` order, anchors against the pinned PDF hash, cell items, `renderPdf`, glyph centres, attachments and option labels |
| `tools/e2e/flow.ts` (~4 min) | employer link → prefill → 8 steps → documents → review/sign → PDF download → print, plus axe on every step and a network guard for external requests |

There is **no** dedicated storage/draft test file in the root project (the
migration tests live in the historical spike). If you touch `app/storage/draft.ts`
migrations, add one — `fake-indexeddb` is the pattern used in
`research/spikes/scaffold/tests/draft.test.ts`.

## 2. Unit tests

```bash
bun test                                  # 113 tests, ~0.6 s
bun test tests/engine.test.ts             # one file, <0.3 s
bun test -t "id validation"               # one describe block
```

Rules that keep this cheap:

- Pure engine means no DOM, no Nuxt, no IndexedDB — tests import from
  `app/form/**` directly.
- Freeze time when testing ages: `vi`-style fake timers are unavailable; pass an
  explicit date or use the helpers in `app/form/values.ts`.
- A new condition/validator gets a test before it gets a UI.

## 3. E2E + axe

```bash
bun run generate     # required: the runner serves .output/public
bun run e2e          # ~4 min
E2E_PORT=4199 bun run e2e   # parallel agents MUST pick their own port
```

The script launches Chrome via `chromium.launch({ channel: "chrome" })` and falls
back to bundled Chromium, starts `tools/serve.ts`, and fails on page errors,
console errors, or any non-`blob:`/`data:` external request. Screenshots land in
`research/spikes/screens/`.

Port 4173 is shared state. Two concurrent runs on it kill each other's server and
browser mid-test (“Target page, context or browser has been closed”) — this has
already cost a session.

## 4. Accessibility — real findings and fixes

axe on an early scaffold build (wcag2a/aa, 21a/aa) reported contrast failures and
a missing title. Fixes that produced 0 violations / 24 passes:

```css
:root {
  --ui-primary: var(--color-teal-700);      /* white on teal-700 = 5.4:1 */
  --ui-success: var(--color-green-700);     /* badge text on success/10 */
  --ui-text-dimmed: var(--color-slate-600); /* placeholders ≥ 4.5:1 */
}
```

Nuxt UI defines these in the `<style id="nuxt-ui-colors">` block as
`var(--ui-color-*-500)`; overriding the semantic variable is enough. Also needed:
a real `<title>` and a `<main>` landmark (Lighthouse a11y 98 → 100).

Keep axe on every step, not only the landing page. Known hard cases: canvas
signature (needs a text alternative), error-summary focus, dynamic `aria-live`
regions, and the print sheet.

## 5. PDF / visual tests

- Anchors are pinned to the official PDF SHA-256; `anchors.json` is generated
  (`tools/pdf/build-anchors.ts`) and must never be hand-edited.
- `tests/pdf.test.ts` asserts rendered glyph centres stay within **1.5 pt** of
  the measured cells, that a leading `9` is not printed twice, and that labels
  (not enum values) reach the page.
- Golden images for human review: `tools/pdf/render-samples.ts`; slot audits:
  `tools/pdf/audit-slots.py` → `research/pdf-slots/page{1,2}-audit.png`.
- Cross-reader check (Preview / Chrome / Acrobat) is a manual release step.

## 6. CI

`.github/workflows/ci.yml` runs, on push to `main` and every PR:

```text
kb:check → bun test → typecheck → generate → check:privacy → e2e:ci
```

Ubuntu runner, bun 1.4.3, 15-minute timeout, Chromium installed with
`bunx playwright install --with-deps chromium`.

Notes:

- `check:privacy` needs `.output/public`, so it runs after `generate`.
- `typecheck` exits 0 while printing a `vue-router/volar` resolution stack trace;
  CI stays green and so should your local run — only `error TS` matters.
- The local NetFree CA workaround (`NODE_TLS_REJECT_UNAUTHORIZED=0`) does not
  apply to GitHub-hosted runners; never commit it.
- Cache `~/.bun/install/cache`; do not cache `.output`.

## 7. Definition of done

Lives in `AGENTS.md` §11. The short form: rule in the engine, both locales, the
narrowest failing test passes, printed fields have a slot, new knowledge recorded,
privacy gate green if the build surface changed.
