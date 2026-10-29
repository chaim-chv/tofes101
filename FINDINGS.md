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
