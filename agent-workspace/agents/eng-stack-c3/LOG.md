# eng-stack-c3 — log

Private working log. Append-only; newest at the bottom.

## 2026-10-29T21:56Z — start
Read `kb/CONVENTIONS.md`, `kb/index.md`, `agent-workspace/SHARED.md`. Scope:
`kb/eng/**`, `kb/decisions/**`, `kb/sources/**`, `research/spikes/**`,
`agent-workspace/agents/eng-stack-c3/**`, append `## Engineering` to `kb/index.md`.
Do not touch `kb/law`, `kb/ux`, `src`, `nuxt.config.ts`.

## 22:00Z — versions
`npm view` + `bun`/`node` output: Nuxt **4.6.3**, @nuxt/ui **4.12.0**,
tailwind 4.3.3, @nuxtjs/i18n 10.6.0, Pinia **4.1.0**, idb-keyval 6.3.0,
pdf-lib 1.17.1, fontkit 1.1.1, bidi-js 1.1.0, jspdf 4.2.1, pdfme 6.2.8,
@vite-pwa/nuxt 1.1.1, vitest 5.0.5. Environment bun 1.4.3 / node 22.23.4.
Local bun TLS issue → `NODE_TLS_REJECT_UNAUTHORIZED=0` for installs only.

## 22:05Z — scaffold spike
`create-nuxt@4.0.1` minimal in `research/spikes/scaffold`; UI + i18n + pinia.
RTL + Heebo + `UApp :locale="he"` screenshot verified; no external requests.
Build 1.2 MB / 32 files. `UInputDate` segment order and ILS symbol placement are
UX quirks to flag.

## 22:10Z — PWA
Three reproduced failures: missing `client.registerPlugin`, precache `404`/`200`
(module strips `.html`) killing install, `navigateFallback: '/'` serving home for
sub-routes. After fixes, offline reload passes. 32 entries / 968.70 KiB.

## 22:15Z — draft storage
Wrote `app/utils/draft.ts` in scaffold (envelope v3, migrations, revision
conflict, autosave, BroadcastChannel). 8 Vitest tests pass. Real Chrome:
0.37 ms/write, quota 10.7 GB, `persist()` false, draft 500 B.

## 22:20Z — PDF artifact
Downloaded official PDF: 2 pages, 553,528 B, **0 AcroForm fields**, text
extractable. Overlay + Heebo subset → 559,632 B. Field-coordinate extraction via
pdfjs works; map needs manual verification.

## 22:25Z — Hebrew PDFs
Found the core bug: fontkit reverses RTL runs but no UAX #9; digits/English
mirror. bidi-js whole-string reorder double-reverses. Built token-level helper;
IoU vs Chrome 0.82/0.83/0.79 for 3 lines, 0.946 for a word; line 4 (colon/shekel)
0.255. jsPDF/pdfme both fail bidi. Text layer ends up visual-order.

## 22:30Z — a11y/perf
axe: 4 contrast violations (`#90a1b9` 2.63:1, white on `#00c950` 2.21:1) +
missing title. Fixed with teal-700/slate-600 + `<title>` + `<main>` → 0
violations, Lighthouse 98/100/100, LCP 1.8 s, CLS 0, initial ~235 KB gzip.

## 22:40Z — docs
Wrote 13 eng nodes, 3 ADRs, 10 source nodes, `research/spikes/RESULTS.md`,
appended `## Engineering` to `kb/index.md`. Reconciled with the live root app
(3 routes, lightweight `useLocale`, no Pinia/PWA yet). `bun run kb:check` clean
(183 nodes, 0 errors, 0 warnings); `bun run check:privacy` passes on the root
build (43 files).

## 22:50Z — handoffs
SHARED: PDF RTL finding + helper path, PWA gotchas, storage numbers, font
recommendation, signature legal question for `law-101-a1`.
