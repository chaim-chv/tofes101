# teardown-d4 — product/IA teardown log

Scope: everything around the form — IA, product flows, content/SEO, monetisation &
trust, feature parity, v1 scope. Not the form logic (owned by other agents).

## 2026-10-29

- Read `kb/CONVENTIONS.md`; noted the existing `kb/flow/form-101-service.md`,
  `kb/flow/form-101-field-spec.md`, `kb/finding/tepez-form-runtime.md` — I build on
  them, do not duplicate the field-level spec.
- Found `research/raw/{start.json,form.html,rendered.html,network.json,inventory.json}`.
  `start.json` = full tepez form definition (285 KB). `network.json` = 171-entry
  browser network log incl. GTM/GA/Sentry/DoubleClick and the runner iframe.
- Crawled per `crawl.sh`: 47 routes, one request each, 0.9 s apart, saved HTML +
  extracted text into `research/raw/site/`; `_status.tsv` has status codes.
  2 routes returned 308 (`/forms/`→`/directory/`, `/docs/`→`/docs/introduction/`).
- Fetched `/sitemap.xml` → `/sitemap-0.xml` (115 URLs) + `/sitemap-pdfs.xml` (57 PDFs);
  `/robots.txt` disallows `/form-submitted/`, `/admin-portal-archive`,
  `/data-export-legacy` and points at the sitemap.
- Extracted `_next` chunks to recover the *source of truth for the IA*:
  - `15kek4.n1aeu0.js` → forms registry (29 entries: id, slug, label, type,
    canCreateTemplate, pdfUrl, labels, SEO meta) + `getCalculators()`.
  - `0uc.b_ov5kl_e.js` → navbar composition + full `/docs` tree config.
- Dumped the form schema to `research/raw/site/form-tree.txt` (400 lines) — used it
  for the in-form product surface (ads panel, `_settings` = employer template
  builder, privacy/marketing consent, signature, appendix).
- Pulled the FAQ answers out of the RSC payload (`faq-extracted.md`): 15 questions,
  only 3 have answers, and those 3 are the revealing ones (data selling = "כן").
- Wrote `kb/competitor/*` (7 nodes), `kb/product/*` (2), `kb/sources/*` (12),
  appended `## Product` to `kb/index.md`.
- Requests used: ~60 (budget 80). No browser; all HTTP.

## Corrections / surprises worth remembering

- The site is **not** "a free form site with ads". It is Tepez's demo/marketing
  asset: FAQ answer `about_us` says the form was built "ככלי שיווקי" for their
  form-builder SaaS, and the FAQ answer on data selling is "כן".
- `/forms/itc-101/organizations/` (employer landing) and `/forms/itc-101/create/`
  (builder) are different pages; `/create/` is fully client-rendered.
- The runner is an **iframe** (`forms.tofes101.co.il/f/<id>?data=<json>`), not a
  redirect. `data` carries `seo{sourceType,landingUrl,parentUrl,capturedAt}`.
- Every page contains a visually hidden `do not click` link to `/admin-portal-archive`
  (also in robots.txt). Do not reproduce.

## Deliverables (all written)

- `kb/competitor/{site-map,flow-employee,flow-employer,flow-calculators,content-strategy,monetization-and-tracking,feature-parity,tech-recon}.md`
- `kb/product/{scope-v1,personas}.md`
- `kb/sources/tofes101-*` ×12 (home, sitemap, 101 landing, employer landing, docs online-form,
  docs faq, docs custom-form, docs tax-adjustment, docs tax-reductions, legal pages,
  runner app, engine bundle)
- `research/raw/site/` — 47 HTML + 47 `.txt` extracts, `_status.tsv`, `form-tree.txt`
  (400-line schema outline), `faq-extracted.md`, `chunks/`, `app-shell.html`
- `kb/index.md` → appended `## Product`
- `kb:check` reports no errors from any of my nodes (40 pre-existing errors remain in
  `law/`, `ux/`, `field/` from other agents — untouched).

Scripts (reproducible): `crawl.sh`, `extract.py`, `dump_tree.py` in this folder.
