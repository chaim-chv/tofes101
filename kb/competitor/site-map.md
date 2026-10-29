---
id: competitor/site-map
title: tofes101.co.il — site map & information architecture
type: finding
status: verified
confidence: verified
updated: 2026-10-29
tags: [competitor, ia, seo, sitemap]
sources: [source/tofes101-sitemap, source/tofes101-site-home, source/tofes101-engine-bundle]
related: [competitor/content-strategy, competitor/feature-parity, product/scope-v1, index]
up: index
---

# Site map & IA

Crawled 2026-10-29: 47 routes fetched by hand (`research/raw/site/_status.tsv`), plus
the two sitemaps. **`/sitemap-0.xml` says 115 indexable URLs**, `/sitemap-pdfs.xml`
lists 57 PDF assets. This node is the human-readable map; the raw inventory is in
`research/raw/site/`.

Word counts below = words in `<main>` (Hebrew tokens), i.e. *content*, not chrome.
Pages marked **shell** render client-side (a 500 KB Next.js document whose `<main>` is
a spinner + iframe); their real content is the runner app or a React component.

## 1. The site has four layers, and they are not equal

```
           ┌──────────────────────────── SEO layer (static, indexable) ───────────────────────────┐
  /        │ /forms/<slug>/            /docs/**            /directory/   legal  /fill-form-101-english/
           │   └─ /organizations/      (5 sections, 21 pages)          /
           ├────────────────────────── product layer (client-run) ─────────────────────────────┤
  /forms/<slug>/submit/  ──iframe──▶ forms.tofes101.co.il/f/<id>     (AngularJS "tepez" runner)
  /forms/<slug>/create/  ──same app, data.entry.status="template"──▶ employer template builder
  /forms/<calculator-slug>/  ──inline React calculator (no runner)───────────────────────────┘
           └────────────────────────── delivery layer (off-site) ──────────────────────────────┘
               email (PDF to employee+employer) · server-side draft links · tpz.link short URLs
```

Only layer 1 is SEO. Layers 2–3 exist to convert the SEO traffic into an email/PDF
transaction (and, for employers, into an עובדיםIO sales conversation).

## 2. Route table (crawled)

| Route | HTTP | Purpose | Content type | Words |
| --- | --- | --- | --- | --- |
| `/` | 200 | hub: hero + 2 CTAs, forms grid, employer pitch, calculators | marketing | 243 |
| `/forms/` | 308 → `/directory/` | alias | — | — |
| `/forms/itc-101/` | 200 | **money page** — 101 landing | marketing + SEO | 237 |
| `/forms/itc-101/submit/` | 200 | the form (iframe) | shell | 2 |
| `/forms/itc-101/create/` | 200 | employer template builder | shell | 2 |
| `/forms/itc-101/organizations/` | 200 | employer landing (B2B pitch) | marketing | 136 |
| `/forms/itc-119/` | 200 | form 119 landing | marketing, thin | 44 |
| `/forms/bank-account/` | 200 | bank details form landing | marketing, thin | 94 |
| `/forms/electronic-pay-slip/` | 200 | e-payslip consent landing | marketing, thin | 82 |
| `/forms/electronic-pay-slip/create/` | 200 | employer builder | shell | 2 |
| `/forms/itc-1516/` | 200 | disability exemption landing | marketing + explainer | 542 |
| `/forms/vat-calculator/` | 200 | VAT calculator | tool (inline) | 56 |
| `/forms/percentage-calculator/` | 200 | % calculator | tool (inline) | 30 |
| `/forms/child-support-calculator/` | 200 | child-support estimator | tool + essay | 573 |
| `/forms/advance-notice-calculator/` | 200 | notice-period calculator + law explainer | tool + explainer | 378 |
| `/directory/` | 200 | "all services", filterable | index (client-filtered) | 12 |
| `/docs/` | 308 → `/docs/introduction/` | alias | — | — |
| `/docs/introduction/` | 200 | what 101 is, when to file | guide | 260 |
| `/docs/introduction/download/` | 200 | blank PDF download (2026) | guide + asset | 131 |
| `/docs/introduction/archive/` | 200 | 19 historical versions 2011–2025 | reference | 193 |
| `/docs/online-form/` | 200 | email / PDF / draft semantics | guide | 399 |
| `/docs/online-form/faq/` | 200 | FAQ — 15 questions, 3 answers | FAQ | 174 |
| `/docs/online-form/attached-files/` | 200 | attachments + "scan with your phone" tip | guide | 239 |
| `/docs/online-form/custom-form/` | 200 | employer template how-to | guide | 258 |
| `/docs/online-form/mobile-data-pickers/` | 200 | native date pickers on Android/iOS | guide (screenshots) | 200 |
| `/docs/tax-adjustment/` | 200 | תיאום מס, 4 routes + limits | pillar guide | 853 |
| `/docs/tax-reductions/` | 200 | credits hub + how points work | pillar guide | 581 |
| `/docs/tax-reductions/resident/` | 200 | resident credit | cluster page | 144 |
| `/docs/tax-reductions/female/` | 200 | women's credit | cluster page | 118 |
| `/docs/tax-reductions/youth/` | 200 | 16–18 credit | cluster page | 124 |
| `/docs/tax-reductions/children/` | 200 | children credit | cluster page | 894 |
| `/docs/tax-reductions/child-support/` | 200 | alimony credit | cluster page | 168 |
| `/docs/tax-reductions/unemployed-spouse/` | 200 | non-working spouse | cluster page | 194 |
| `/docs/tax-reductions/studies/` | 200 | degree/training credit | cluster page | 844 |
| `/docs/tax-reductions/national-and-military-service/` | 200 | discharged soldiers | cluster page | 299 |
| `/docs/tax-reductions/newcomer/` | 200 | new immigrant | cluster page | 446 |
| `/docs/tax-reductions/returning-resident/` | 200 | returning resident | cluster page | 474 |
| `/child-support-docs/introduction/` | 200 | alimony guide (own 5-page tree) | pillar guide | 520 |
| `/fill-form-101-english/` | 200 | English translation of the form | shell (separate form id) | 2 |
| `/about/` | 200 | who runs it, business model, SaaS products | trust page | 141 |
| `/contact/` | 200 | email + contact form | support | 66 |
| `/feedback/` | 200 | triage form (FAQ first, then technical/product) | support | 86 |
| `/privacy/` | 200 | privacy policy (19.10.2026) | legal | 2,878 |
| `/terms/` | 200 | terms (2019, written for the paid SaaS) | legal | 1,625 |
| `/cookies/` | 200 | cookie table incl. GA/Ads/Meta/Sentry | legal | 285 |
| `/accessibility/` | 200 | accessibility statement (10/08/2025) | legal | 167 |

**Not crawled but present in the sitemap** (29 products = 25 forms + 4 calculators, × 3–5 routes each): btl-103, 211,
250, 2600, 283, 580, 644; anti-sexual-harassment (+ `en/`, `ru/` submit variants);
corona-health-declaration; green-passport-covid; green-wave; gym-health-declaration;
harel-long-term-care; menoramivt-long-term-care (4 HMO sub-paths); police-adult-certificate;
police-criminal-record; resignation-letter; itc-161; `/ovdimio/`. Plus
`/child-support-docs/{authority-and-law,children-needs,parents-income,misc}`.

## 3. Global chrome

**Nav (sticky, white, ~64 px):** logo (wordmark "טופס101", not an image), then
`כל השירותים — לגמרי בחינם` (→ `/directory/`), `טפסים` (mega-menu: employer group =
101, English 101, bank account, e-payslip, harassment policy, 119, resignation;
work-accident group = 250, 283, 211; "more forms" → `/directory/?labels=form`),
`מחשבונים` (4), `מדריכים` (the 4 docs sections). Mobile: hamburger + sheet.

**Footer (dark, 4 columns):** employer forms (7 links) · work-accident + long-term-care
(3+3) · patients/disabled (3) + gym trainers (1) · site (about, contact, feedback) +
legal (terms, privacy, cookies, accessibility). Then a disclaimer block ("general
information only, not legal/tax advice"), a **CC BY-NC-SA 4.0** notice, "built by Tepez"
with a link to tepez.co.il, and a visually hidden `do not click` link to
`/admin-portal-archive`.

Template in `research/raw/site/home.txt` (`## NAV` / `## FOOTER` sections).

## 4. Indexability

- Everything in `/sitemap-0.xml` is indexable; `/submit/`, `/create/` and
  `/organizations/` are **all in the sitemap** even though two of them are empty shells
  — they rank on the metadata, not the body. That is a deliberate pattern: one SEO
  landing per *task*, not per document.
- `robots.txt` disallows `/form-submitted/` (the post-submit route),
  `/admin-portal-archive`, `/data-export-legacy`.
- Each page sets a canonical of its own trailing-slash URL; `?labels=` filters on
  `/directory/` are not canonicalised separately.
- Locale: content is Hebrew at `/`, `X-Matched-Path: /he/…` (an English tree exists at
  `/fill-form-101-english/` only; the anti-harassment form additionally has `en/` and
  `ru/` submit variants).
- Meta pattern per page: `<title>` = "topic — qualifier | טופס 101", `description`
  ~150 chars, `keywords` still populated (a 2010s habit), OG + Twitter cards,
  `og:locale he_IL`.

## 5. Internal-linking pattern (three clusters)

1. **Form cluster** — home → `/forms/<slug>/` → `/submit/`; every form landing links
   *sideways* to "download the blank PDF", "employers: create a link" and
   *down* to `/submit/`. `/submit/` links back to nothing but the footer.
2. **Guide cluster** — `/docs/<section>/` is a 21-page tree with a persistent left
   sidebar (sections: מבוא · טופס 101 מקוון · תיאום מס · זיכויים ממס) repeated on every
   docs page. Guides link to `/forms/itc-101/` and to the section they explain ("read
   about this credit in section ח"). They do **not** deep-link into the form.
3. **Tool cluster** — calculators live at `/forms/*-calculator/` (deliberately under
   `/forms/` for the slug), are cross-sold on the home page, and each carries an
   explainer below the widget so the page has indexable text.

The clustering is smart: **transactional intent** (`/forms/*`) is separated from
**informational intent** (`/docs/*`), and the docs tree is the only place with real
depth. The weak point is that the docs never hand the user back into the form at the
exact field — the "read more" ends in a generic link.

## 6. What this means for us

- We need **fewer routes, same clusters**: one landing per task we support, one guide
  hub, one tool. Not 29 products.
- Their `/forms/<slug>/{,submit,create,organizations}` × 29 is 4 near-duplicate pages
  per form; at our scale the honest version is `/101/` (landing) + `/101/fill/` (app)
  + `/101/employer/` (template) with `noindex` on the app routes.
- The `/docs` tree is their only defensible SEO asset (21 pages, 5 sections). We must
  write our own version of that structure — see
  [competitor/content-strategy](content-strategy.md) — because their text is
  CC BY-NC-SA and cannot be reused.
