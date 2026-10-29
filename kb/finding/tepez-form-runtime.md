---
id: finding/tepez-form-runtime
title: How the reference product actually works (tepez form runtime)
type: finding
status: verified
confidence: verified
updated: 2026-10-29
tags: [recon, reference-implementation, tepez, form-runtime]
sources: [source/tofes101-form-runner-api, source/tepez-runner-bundle]
related: [flow/form-101-service, flow/form-101-field-spec, decision/adr-0001-stack]
---

# How tofes101.co.il renders the 101 form

Reconnaissance of the reference implementation, done 2026-10-29. This is the
"extracted code": the whole form — fields, validations, conditional logic,
computed values, options, copy — is **data**, not hand-written UI.

## The stack, outermost first

| Layer | What it is | Evidence |
| --- | --- | --- |
| `tofes101.co.il` | Next.js 15 App Router (turbopack), Hebrew RTL, prerendered, Vercel | `X-Matched-Path: /he/forms/itc-101/submit`, `X-Nextjs-Prerender: 1` |
| landing / SEO | fully static marketing + `/docs/*` content tree | page HTML |
| the runner | `<iframe>`/redirect to `forms.tofes101.co.il/f/<formId>` | network log of `/submit/` |
| `forms.tofes101.co.il` | **AngularJS 1.x + Dexie (IndexedDB) + pdf.js + CKEditor** form-runner app ("tepez") | `runner.html` script tags |
| form definition | JSON from `api.tepez.co.il/v1.0/form/<id>/start` | 285 KB JSON, `formSchema.rootElem` |
| rendering | same vendor also renders the final PDF server-side ("render" action) | runner help strings, `pdfTemplate` setting |

So the "product" is ~**5 screens of Next.js wrapping a generic form builder**.
Everything domain-specific lives in the JSON schema + a handful of `_settings`
knobs. That is why it can serve 20+ different forms (101, 119, 250, …) from one
codebase.

## The form definition

```
GET https://api.tepez.co.il/v1.0/form/5a704edf239da27488a8cd9c/start?locale=he
```

Returns `{ id, publicName, formSchema }` where `formSchema` has:

- `rootElem` — the element tree (588 nodes for form 101, 160 of them fields)
- `rootConfig` — `{ clearIrrelevant: true, fileTypes: ["gif","jpg","jpeg","png","pdf"] }`
- `auxData` — `_vars` (campaign/env), `ads`, `advertisers`, and **large
  precomputed city/name lists** (`citiesFin1Not2`, `arCities`, `arNames`,
  `etNames`, `relCities`, `holidays`, …) used for autocomplete/segmentation
- `trans` — UI strings overrides
- `locale`, `unsavedMessage`, `showActionBar`, …

### Element model (the thing worth copying)

| type | meaning | key props |
| --- | --- | --- |
| `cSection` | visual group / panel; also the "container" for expression scope | `secLegend`, `secType` (`panel` \| `well`), `relevant` |
| `cRow` | grid row; `children` is an **array of arrays** (one array per column) | `cols[{mdW}]` |
| `fInput` `fDate` `fLngTxt` | text-ish inputs | `label`, `reqValidator`, `validators[]`, `helpText` |
| `fRadio` `fCheckbox` `fSelect` `fBool` | choice controls | `options` = `[[value,label],…]` **or** a JS expression string returning them |
| `fFile` `fDoc` `fSign` | upload / doc / signature canvas | `required`, `relevant` |
| `fRepeat` (`cRepeat`) | repeating rows (children, other incomes) | `children` = row template |
| `eEq` | **equation**: computes a model field silently | `eqEquation`, `eqWatchExpr` |
| `eAlert` `eHtml` `eBtn` | static content / call to action | `content` (HTML w/ `{{ }}` interpolation), `relevant` |
| `eAdSenseAdUnit` | ad slot | — |

### Three logic primitives — and nothing else

1. **`relevant`** — a JS expression string. `false`/falsy ⇒ element not rendered.
   Evaluated with `model` (whole form), `container` (nearest `cSection` scope),
   `data`, `auxData`, `fn.*` helpers (lodash-ish: `fn.includes`, `fn.filter`,
   `fn.map`, `fn.uniq`, `fn.today`), `trans` (formatters).
2. **`eqEquation`** — a JS expression (multi-statement, last expression wins)
   that writes computed fields: age, age-in-tax-year, `*_label` mirrors,
   `dateOfBirthStr` for PDF, segment/ad selection.
3. **`validators[]`** — `{type, message, fn?, pattern?}` where `type` is a
   built-in (`num/digitsNum`, `int`, `luhn`, `str/regex`, `str/phone`, `str/len`,
   `num/val`, `date`) or `function` with a `fn` expression that must return true.
   `reqValidator` is the same idea for "required".

There is **no** separate calculation/formula language, no rules DSL, no backend
validation we can see. Conditions are JS evaluated client-side; the server
renders the PDF from the resulting model.

### Consequences worth knowing

- `rootConfig.clearIrrelevant: true` ⇒ when a branch becomes irrelevant, its
  answers are **wiped**. Going back and changing an answer destroys data silently.
  Our build must keep irrelevant answers (soft-hide) and restore them.
- Labels are duplicated into `*_label` fields via `eEq` only so the PDF renderer
  can print a Hebrew word instead of the enum value. That is a design smell we
  can avoid by keeping a `labelFor(value)` map at render time.
- `fRadio` with `[[true,"כן"],[false,"לא"]]` and `[[false,"אין לי..."],[true,"יש לי..."]]`
  — option order is used to put the "safe" answer first; booleans are real booleans.
- Many sections exist only for **old printed forms** (`legacy` sub-sections,
  "שדות שהופיעו בעבר…"), i.e. the schema is a 15-year accretion. Roughly
  25 % of the tree is dead/debug/ad content (`adWrapTop`, `settingsWrap`,
  `bottomCustom/adPanel`). See [form-101-field-spec](./form-101-field-spec.md)
  for the cleaned list of the 12 real sections and 160 real fields.
- The site is ad-funded: `auxData.ads` + `_settings.marketingConsent` — the user
  is asked to opt in to having their personal data sold to advertisers, and ads
  are interleaved *inside* the form (`eAdSenseAdUnit` after sections ב, ג, ד, ז).

## Re-extraction recipe

If the reference changes and we need a diff:

```bash
curl -sSL "https://api.tepez.co.il/v1.0/form/5a704edf239da27488a8cd9c/start?locale=he" \
  -o research/raw/start.json
bun run tools/crawl/extract-form.ts     # -> research/raw/form/{tree.json,outline.txt}
bun run tools/kb/gen-field-spec.ts      # -> kb/flow/form-101-field-spec.md + schema.json
```

`tools/crawl/dump.ts` still works for the outer Next.js page (needs a Chrome
channel; the embedded browser tools are unavailable in this environment).

## What is NOT extractable this way

- The **PDF template** the server fills (`_settings.pdfTemplate`). We must build
  our own output (see [pdf strategy]).
- Server-side submit/email/render logic (`/v1.0/...` submit endpoints).
- The Next.js `/docs/*` prose (separate crawl, see `kb/competitor/`).

Confidence: verified by direct HTTP + bundle inspection. The claim "single
scrolling page with panels, not a wizard" is `likely` — inferred from
`secType: panel/well` and the absence of a tabs config, not from a live render.
