# FINDINGS.md

Durable, implementation-level discoveries. Append-mostly: add new entries at the
bottom of the right section with a date. Anything longer than a paragraph belongs
in `kb/` — this file is the fast lane.

Format: `- **YYYY-MM-DD** — claim. → evidence/link`

## Reference implementation (tofes101.co.il)

- **2026-10-29** — The whole form is *data*, not code. `forms.tofes101.co.il` is
  a generic AngularJS "tepez" form runner; the definition is JSON at
  `https://api.tepez.co.il/v1.0/form/5a704edf239da27488a8cd9c/start?locale=he`
  (no auth). → `kb/finding/tepez-form-runtime.md`
  Re-extract with `bun run extract:form` (writes `research/raw/form/tree.json`,
  `kb/flow/form-101-field-spec.md`, `kb/flow/form-101-schema.json`).
- **2026-10-29** — 160 real fields across 12 sections (א–י + tax year + appendix);
  the other ~430 nodes of the JSON are layout, debug, ad and legacy content.
- **2026-10-29** — Logic is exactly three JS-expression primitives: `relevant`
  (visibility), `eqEquation` (computed values), `validators[]` (incl. `function`
  validators). No server-side validation is observable.
- **2026-10-29** — `rootConfig.clearIrrelevant: true` ⇒ closing a branch **wipes**
  the answers inside it. We must not copy that behaviour.
- **2026-10-29** — Israeli ID validation in the reference = digits-only + int +
  Luhn. (Verify the check against the official algorithm, incl. leading zeros.)
- **2026-10-29** — Tax year logic: fixed to current year, but in December the user
  may pick current/next and in January previous/current; stored values older than
  the current year are silently bumped. → `kb/flow/form-101-service.md`
- **2026-10-29** — City and street are **remote autocompletes**
  (`/v1.0/optionsSet/.../autocomplete`, street scoped by city). Street data is the
  hard part for an offline app — open question O-2 in `PLAN.md`.
- **2026-10-29** — The official blank PDF (`/assets/forms/tofes-101.pdf`, 2 pages)
  has **no AcroForm** — 0 form fields, `/AcroForm` absent, but it is vector text
  (3 embedded fonts, no images) and its text is extractable. So: overlay-at-
  coordinates or render-our-own, not "fill the fields". → ADR-0002.
- **2026-10-29** — Page 2 of that PDF contains the official explanatory notes
  ("דברי הסבר למילוי טופס 101") — the authoritative source for every help text we
  need (definitions of משכורת חודש / משרה נוספת / משכורת חלקית / שכר יומי, the
  withholding rule for each, and credit items 1–16). Extracted to
  `research/raw/law/official-101.txt`.
- **2026-10-29** — The site is monetised by (a) AdSense units injected between
  form sections and (b) an **opt-in-to-sell-my-data** consent radio inside the
  form, A/B tested (`marketingConsentABTest`). Our privacy story is a direct
  contrast, and we must not quietly reproduce the consent pattern.

## Environment / tooling

- **2026-10-29** — No desktop browser connected in this session; `browser.*`
  tools fail. Playwright works with `chromium.launch({ channel: "chrome" })`.
- **2026-10-29** — `bun install` fails TLS verification against the registry
  here; prefix with `NODE_TLS_REJECT_UNAUTHORIZED=0` (or use `npm i`). `curl`
  works normally.
- **2026-10-29** — No `pdftotext`/`qpdf`; `python3 -c "import pypdf"` works.

## App scaffold (verified 2026-10-29)

- **2026-10-29** — Verified toolchain: `nuxt@4.6.3`, `@nuxt/ui@4.12.0`,
  `vue@3.5.44`, `@iconify-json/lucide@1.2.149`, bun 1.4.3, Node 22. `bun run generate`
  produces a fully static `.output/public` (6 routes prerendered).
- **2026-10-29** — `@nuxt/icon` **falls back to `https://api.iconify.design`** at
  runtime for any icon it did not bundle. With a strict CSP the icons simply
  disappear. Fix used: `icon: { serverBundle: false, clientBundle: { scan: true } }`
  + `@iconify-json/lucide` installed. `scripts/check-privacy.ts` catches a
  regression at build time.
- **2026-10-29** — Nuxt's router **drops the URL fragment during hydration**. The
  employer prefill payload (`#e=…`, ADR-0005) must be captured by an inline
  script in `app.head` (`window.__INITIAL_HASH`), otherwise `location.hash` is
  empty inside `onMounted`.
- **2026-10-29** — `UApp` in Nuxt UI v4 takes a **locale object**, not a string
  (`import { he, en } from "@nuxt/ui/locale"`); passing `"he"` throws
  `TypeError: m is not a function` deep in the render.
- **2026-10-29** — Do not name a `ref` the same as an imported function in
  `<script setup>`: the minifier collapses both and you get
  `x.value = await x(...)`. (Cost us an hour.)
- **2026-10-29** — Bun's `CompressionStream("deflate-raw")` and Chrome's are
  interoperable; payload round-trip is covered by `tests/employer-link.test.ts`
  (9 tests) and by the Playwright smoke (`tools/e2e/smoke.ts`).
- **2026-10-29** — A `serve`-style static server that redirects `/x` → `/x/`
  breaks nothing but muddies Playwright traces; `tools/serve.ts` (Bun.serve,
  no redirects) is the local reference.
