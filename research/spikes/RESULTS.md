# Spike results — engineering foundation (2026-10-29)

Everything here was executed on this machine, not copied from docs. Environment:
macOS (darwin), **bun 1.4.3**, **node v22.23.4**.

> Local environment caveat: bun cannot validate the NetFree MITM CA, so
> `bun install` / `bunx` need `NODE_TLS_REJECT_UNAUTHORIZED=0`. This is not a
> project setting and must never be committed.

## 1. Scaffold (`research/spikes/scaffold/`)

Created with `npx --yes create-nuxt@latest scaffold -t minimal --packageManager bun --no-install --no-gitInit` (create-nuxt **4.0.1**; `bun create nuxt@latest` is the documented equivalent — `bunx` itself hit the CA error).

Resolved versions (package.json + `bun pm`):

```
nuxt 4.6.3        vue 3.5.44        vue-router 5.4.0
@nuxt/ui 4.12.0   tailwindcss 4.3.3 @nuxtjs/i18n 10.6.0
pinia 4.1.0       @pinia/nuxt 1.0.3 @vite-pwa/nuxt 1.1.1
idb-keyval 6.3.0  vitest 5.0.5      @nuxt/test-utils 4.3.4
@axe-core/playwright 4.14.0          fake-indexeddb 6.2.6
```

Build: `bun run generate` → **rc=0**, `.output/public` **1.2 MB / 32 files**,
PWA precache **32 entries / 968.70 KiB**. Log warnings:

- `incorrect peer dependency "typescript@7.0.2"` (UI accepts TS 7, typescript-eslint wants <6.1)
- `Nuxt Icon server bundle mode is set to local`
- a Rollup `@__NO_SIDE_EFFECTS__` comment warning (harmless)

Dev + static screenshots: `/Users/chv/develop/tofes101/research/spikes/scaffold/screenshot.png`
(420×900, RTL, Heebo, ILS formatting). Playwright reported:
`htmlAttrs {lang: 'he', dir: 'rtl'}`, `fontsUsed ['Heebo loaded']`,
`external: []`, `failed: []`.

## 2. PWA / offline

Config: `@vite-pwa/nuxt` + `registerType: 'autoUpdate'`, `workbox.globPatterns`,
`navigateFallback: '/'`, `client: { registerPlugin: true, installPrompt: false }`.

Three real failures and fixes:

1. **No SW** when passing `client` without `registerPlugin` — the module replaces
   its defaults. Fix: always pass `registerPlugin: true`.
2. **Precache entries `404`/`200`** (the module strips `.html`) → 404 on a plain
   static server → install fails → Chrome silently drops the registration.
   Fix: `globIgnores: ['**/404.html', '**/200.html']`.
3. **Deep-link offline reload** served `/` instead of `/draft-test/`, because the
   precache key is `draft-test` (no slash) and `navigateFallback` caught the
   miss. Product answer: single route, steps as state.

After fixes, `scripts/offline-test.mjs` output:

```json
{ "sw": { "scope": "http://localhost:3013/", "active": true, "controlled": true },
  "reloadOk": true, "controlledAfter": true, "errors": [] }
```

## 3. Draft storage

`bunx vitest run tests/draft.test.ts` → **8/8 passed, 118 ms** (v1→v3, v2→v3,
future schema refused, foreign app refused, IDB round-trip, revision conflict,
export/import, bad JSON + wrong tax year).

Real browser probe (`/draft-test/`, Chrome via Playwright):

```json
{ "status": "ok", "hadDraftBefore": false, "lastName": "כהן",
  "revision": 21, "avgWriteMs": 0.37,
  "estimate": { "usage": 73728, "quota": 10737491968, "ratio": 0.0000069 },
  "persisted": false, "bytes": 500 }
```

→ ~0.37 ms per IndexedDB write, ~10.7 GB quota, `persist()` denied in a fresh
headless profile, a small draft is ~500 B.

## 4. PDF (`research/spikes/pdf/`)

### Official artifact

```
SHA-256 bf4f11b0228c30bf73b0c132475c0b8fb6b1e908ef70411c0fec5474f9d7d633
553,528 B · 2 pages · A4 595.275×841.89 · PDF 1.6 · not encrypted
AcroForm: ABSENT (pypdf: `/Root` has no `/AcroForm`; pdf-lib `getFields()` → 0;
          note `catalog.getAcroForm()` returns an object even when absent)
text: 2,711 chars p1 / 6,066 chars p2 · images: 0
```

### Filled output

`node fill-official.mjs` → `out/filled-official.pdf` **559,632 B** (+6,104 B,
+1.1%) with 5 Hebrew/digit values + a PNG signature. Rendered with Ghostscript
150 dpi.

- PDF: `/Users/chv/develop/tofes101/research/spikes/pdf/out/filled-official.pdf`
- Preview: `/Users/chv/develop/tofes101/research/spikes/pdf/out/filled-official-page1.png`
- Field crop: `/Users/chv/develop/tofes101/research/spikes/pdf/out/filled-names-zoom.png`

The overlay preserves the official header/instructions; the ID/name placements
are approximate and prove the method, not the final field map.

### Hebrew/RTL findings (the hard part)

fontkit (inside pdf-lib) reverses Hebrew glyphs but does **not** implement UAX #9.
Four variants of `שלום עולם 123`:

| Variant | Result |
| --- | --- |
| logical, auto direction | Hebrew correct, digits **321** |
| bidi-reordered, auto | double-reversed, unreadable |
| bidi-reordered, forced LTR | unchanged (patch ineffective) |
| logical, forced LTR | mirrored words |

Working fix: tokenise with bidi-js, keep LTR runs whole, split RTL runs into
words, draw tokens right-to-left. Compared to Chrome (ground truth):

| Line | IoU |
| --- | --- |
| `שלום עולם 123` | 0.818 |
| `סכום (12,345) ש״ח` | 0.834 |
| `דוד כהן — Hello 2026` | 0.794 |
| `משכורת חודשית: 12,345.00 ₪` | 0.255 (neutral `:`/`₪` spacing differs) |
| single word `כהן` vs raqm | 0.946 |

Previews:

- `/Users/chv/develop/tofes101/research/spikes/pdf/out/rtl-tokens-vs-chrome.png`
- `/Users/chv/develop/tofes101/research/spikes/pdf/out/bidi-compare.png`
- `/Users/chv/develop/tofes101/research/spikes/pdf/out/generated-hebrew.png`

Text extraction of the filled PDF returns visual order (`כהן` → `ןהכ`), a known
limitation (no `/ActualText`).

### Alternatives

- **jsPDF 4.2.1** + TTF + bidi-js: 4-line test produced `321`, `(543,21)`,
  `00.543,21`; four variants of one mixed line were inconsistent. Rejected.
  Bundle: 830 KB raw / **254 KB gzip**.
- **pdfme 6.2.8**: `321`, `6202 olleH`. No bidi. Rejected.
- **pdf-lib + fontkit + bidi-js** bundle: 1.19 MB raw / **516 KB gzip** → must be
  lazy-loaded.
- Chrome print path: perfect bidi/shaping, real PDF via the print dialog. Kept as
  fallback/mobile-primary.

## 5. Accessibility and performance

axe-core 4.14.0 on the first build:

```
color-contrast (4 nodes): #90a1b9 on #fff = 2.63:1 (date segments),
                          #fff on #00c950 = 2.21:1 (button)
document-title missing
```

Fixes: `--ui-primary: var(--color-teal-700)`, `--ui-text-dimmed:
var(--color-slate-600)`, `<title>`, `<main>`.
Re-run: **0 violations, 24 passes**.

Lighthouse 13 (mobile, production build):

```
performance 98 · accessibility 100 · best-practices 100 · seo 54 (noindex)
FCP 1.8 s · LCP 1.8 s · TBT 30 ms · CLS 0 · total size 967 KiB
```

Bundle accounting: whole app **999 KB raw / 333 KB gzip**; first-load preload
(HTML + 20 JS + 3 CSS + payload) **816.7 KB raw / 234.8 KB gzip**; Heebo
119.2 KB raw / 76.3 KB gzip.

## 6. Privacy

- CSP with `connect-src 'none'` produced a dozen console errors: Nuxt fetches its own
  `_payload.json`, `_i18n/.../messages.json` and `_nuxt/builds/meta/...json`.
- `connect-src 'self'` → **0 console errors**, page interactive, `external: []`.
- `ui.fonts: false` + local `@font-face`; `@nuxt/icon` local bundle. The string
  `api.iconify.design` exists in the bundle as a fallback but was never requested.
- `scripts/check-privacy.ts` (repo gate) requires a CSP meta tag and greps hosts.

## 7. Reproduction

```bash
cd research/spikes/scaffold
NODE_TLS_REJECT_UNAUTHORIZED=0 bun install
NODE_TLS_REJECT_UNAUTHORIZED=0 bun run generate
(cd .output/public && python3 -m http.server 3013)
node scripts/offline-test.mjs http://localhost:3013/
node scripts/a11y-check.mjs              # expects 0 violations
node scripts/screenshot.mjs http://localhost:3013/ out.png

cd ../pdf
node extract-text-items.mjs
node fill-official.mjs
gs -q -dNOPAUSE -dBATCH -sDEVICE=png16m -r150 -dFirstPage=1 -dLastPage=1 \
   -sOutputFile=out/filled-official-page1.png out/filled-official.pdf
```

## 8. Not verified

- Safari / iOS (print, download, storage eviction, PWA install).
- Real 3G timing (Lighthouse simulates Slow 4G).
- Android Chrome install prompt.
- The official `11.2026` PDF (only `11.2025` / tax year 2026 is available now).
- Legal acceptance of an image signature (handed to `law-101-a1`).
