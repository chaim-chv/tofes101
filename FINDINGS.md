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
- **2026-11-01** — Two agent sessions running `bun run e2e` fight over port 4173:
  one session's kill/cleanup loop kills the other's server *and browser* mid-run
  (“Target page, context or browser has been closed”). `E2E_PORT` now overrides
  the port — run parallel suites as `E2E_PORT=4199 bun run e2e`.

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

## Form correctness pass (2026-10-30)

- **2026-10-30** — ID validation must reject **non-digits**, not strip them: a
  user who types `12a456782` was silently validated as `12456782`. `israeliId()`
  now returns `err.digitsOnly` before the length/checksum checks.
- **2026-10-30** — Identity uniqueness is a form-wide rule: employee, spouse and
  every child must have distinct ID numbers. Implemented as `distinctFrom()` on
  the field plus a sibling check inside repeater validation (`err.id.duplicateRow`
  with both row numbers).
- **2026-10-30** — `FieldDef.initial` now exists, applied once by
  `applyInitials()`: `employee.idKind = "idNum"` and a new child row starts with
  `custody = true`. Initials never overwrite an answered field.
- **2026-10-30** — Hebrew gender agreement is not "slash forms": `מצהיר/ה` reads
  as a form, not as a person addressing the reader. Messages can now be
  `{ m, f }` entries, selected from the `מין` answer (`useLocale().setGender`).
- **2026-10-30** — The PDF must print the **label**, not the enum: the health fund
  was landing in the form as `clalit`. `asOptionLabel()` resolves the option's
  label from the catalog in the PDF chunk.
- **2026-10-30** — Two IndexedDB modules opening the same database with different
  versions **hang forever** on `onblocked`. All stores now open through
  `app/storage/idb.ts` (one `DB_VERSION`, both stores created in one upgrade).
- **2026-10-30** — Attachments (ID/annex/passport/permit) are blobs in IndexedDB,
  never in the JSON draft; the PDF renderer appends them as A4 pages with a
  Hebrew caption. A PDF upload contributed only its first page (fixed
  2026-11-01 — see below).

## Attachments on the sign screen (2026-11-01)

- **2026-11-01** — **`pdf-lib`'s `embedPdf(bytes)` defaults to `[0]`.** The
  renderer relied on that default, so a multi-page "ID" scan (front + back +
  ספח in one file) silently contributed only page 1. The renderer now reads the
  source page count and passes every index; a bulk-embed failure (blank page
  without a content stream) falls back to per-page embedding so one bad page
  cannot take the whole document with it. The sign screen shows the attached
  documents themselves (image inline, PDF in a blob iframe) plus an
  "all N pages included" badge.
- **2026-11-01** — `<iframe src="blob:…">` needs `frame-src blob:` in the CSP;
  `object-src 'none'` still blocks `<object>` embeds. The browser's PDF viewer is
  a `chrome-extension://` page, so the e2e external-request guard must ignore
  non-network schemes (`chrome`, `chrome-extension`, `moz-extension`, …).
- **2026-11-01** — The finish screen had three document blocks with three names
  and the checklist sat *after* the signature. It is now one derived
  `DocumentsSection`: level (`חובה` identity / `נדרש לזיכוי` / `נדרש לתיאום`),
  reason, attachment status (`מצורף` / `חסר` / `למסור למעסיק`) and previews on the
  same row, placed before the declaration. The print view renders the same
  component in `readonly` mode, so paper and screen agree.
- **2026-11-01** — The ID copy is **required** for ID holders (official notes:
  “יש לצרף צילום תעודת זהות כולל ספח”; the first-filing exception is shown as a
  note, not as a “recommended” badge). `doc.id` no longer has `required: false` —
  that flag made the summary say “0 documents required” while the list showed
  one. `id-front` + `id-annex` are alternatives (`match: "any"`): one multi-page
  PDF satisfies the whole requirement.

## PDF slot geometry (2026-10-31)

- **2026-10-31** — The official 101 does **not** put numbers on free lines: it
  prints cell grids (4.1 pt tick separators that look like commas). The grids
  are: tax year 4 cells (220.41–285.31), deduction file 8 writing cells after a
  pre-printed `9` (39.89–130.29), employee ID 9 (438.11–540.21), aliyah date 8
  (28.69–119.01), birth date 8 (119.01–210.00), ZIP 7 (29.23–108.44), passport
  13 (392.50–540.21), work-start date 8 (30.75–121.39), each child's ID 9 /
  birth date 8, spouse ID 9 / birth date 8 / aliyah date 8 / passport 13.
  Full table + audit images in `kb/eng/pdf-slot-map.md`.
- **2026-10-31** — The deduction-file field pre-prints its leading `9`: the glyph
  is at x 30.50–38.42 (size 18) and the first writing cell starts at 39.89. The
  section ט table repeats it at 12 pt in every row. Print only the trailing 8
  digits (the validator already requires `^9\d{8}$`).
- **2026-10-31** — Page 2 repeats the employee ID on a rule at
  x 95.66–170.66 / y 27.89; the overlay never printed it.
- **2026-10-31** — Cell bounds must be **tick-derived** (first tick − step, last
  tick + step), not box-derived: the spouse row and children table have inset
  double borders that shift the first/last cell by 1–3 pt.
- **2026-10-31** — `pdfjs` merges an entire RTL prose line into one text item,
  so blanks drawn as `005F` underscores inside the line (e.g. reserve days in
  section ח item 16) cannot be found from text items. Use the content stream or
  a raster pass. Two anchors were wrong because of this: `credits.immigrantFrom`
  (+87 pt) and `credits.reserveDays` (+44 pt).
- **2026-10-31** — `employee.passportNum` was drawn 7.3 pt above its tick row;
  the coordination table's `incomeType`/`monthlyIncome` anchors cross 4–7 pt
  into the next cell. All recorded with fixes in `kb/eng/pdf-slot-map.md`.
- **2026-10-31** — Diagnostic tools added: `tools/pdf/dump-text.ts`,
  `tools/pdf/extract-cells.py`, `tools/pdf/audit-slots.py` (writes
  `research/pdf-slots/page{1,2}-audit.png`).
- **2026-10-31** — Cell renderer shipped: the generator now derives 22 `cells`
  from the vector ticks (CTM-aware) and pins them in `anchors.json`;
  `fields.ts` emits `{ cell, chars }`; `overlay.ts` draws one centred glyph per
  cell with a string fallback on overflow. Page 2 now prints the header ID, the
  coordination file number continues after its printed 9, and the two prose
  blanks (`immigrantFrom`, `reserveDays`) moved to their measured rules. Tests:
  cell-map sync, split values, rendered glyph centres (<1.5 pt), no duplicated
  9. Samples: `sample-passport.*` added.
