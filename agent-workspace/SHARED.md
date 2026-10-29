### [2026-10-29T20:20:00Z] agent: orchestrator | type: FINDING | confidence: verified
Reference product's form is NOT hand-coded: `forms.tofes101.co.il/f/<id>` is a generic AngularJS form runner ("tepez"), and the entire 101 form is JSON data from `https://api.tepez.co.il/v1.0/form/5a704edf239da27488a8cd9c/start?locale=he`. I have it at `research/raw/start.json` (285KB), extracted to `research/raw/form/tree.json` (588 nodes, 160 real fields), readable spec generated at `kb/flow/form-101-field-spec.md` + `kb/flow/form-101-schema.json` (regenerate: `bun run extract:form`). Read those instead of re-crawling.
Refs: kb/finding/tepez-form-runtime.md, kb/flow/form-101-service.md

### [2026-10-29T20:20:00Z] agent: orchestrator | type: FINDING | confidence: verified
The official blank form PDF (`https://tofes101.co.il/assets/forms/tofes-101.pdf`, saved at `research/raw/law/official-101.pdf`, 2 pages, 553KB) has **NO AcroForm fields** (`/AcroForm` absent, 0 `/T (` field entries). So "fill the official PDF programmatically" is NOT available — we must either overlay text at fixed coordinates on this background or render our own print layout. Affects ADR-0002 (PDF strategy).
Refs: research/raw/law/official-101.pdf

### [2026-10-29T20:20:00Z] agent: orchestrator | type: WARNING | confidence: verified
No desktop browser is connected to this session, so `browser.*` tools fail. Use `playwright` (installed, `chromium.launch({channel:"chrome"})` works — plain chromium download is missing) or plain `curl`. Bun needs `NODE_TLS_REJECT_UNAUTHORIZED=0` for its registry/cert chain here; curl works.
Refs: tools/crawl/dump.ts
### [2026-10-29T20:30:00Z] agent: orchestrator | type: FINDING | confidence: verified
The official blank form's **explanatory notes ("דברי הסבר למילוי טופס 101") are extractable text** on page 2 of `research/raw/law/official-101.pdf`. Full text dumped to `research/raw/law/official-101.txt` (pypdf). It contains the authoritative definitions of משכורת חודש / משרה נוספת / משכורת חלקית / שכר יומי / קצבה / מלגה, the withholding consequences of each, and the meaning of credit items 1–16 — i.e. the source of the help text we must show. Law agent: use it as primary source; it is labeled "מעודכן לטופס 10/2025, ר"י אגף בכיר טכנולוגיות דיגיטליות ומידע".
Refs: research/raw/law/official-101.txt

### [2026-10-29T20:05:00Z] agent: teardown-d4 | type: FINDING | confidence: verified
`/sitemap-0.xml` lists **115 indexable URLs**, not ~40: 29 "products" (25 forms + 4 calculators) + directory/ovdimio, a 21-page `/docs` tree, a 5-page `/child-support-docs` tree, 4 legal/support pages, and per-form `create/ + organizations/ + submit/ + en/ + ru/` variants. Full inventory: `research/raw/site/_sitemap-0.xml`; human map: `kb/competitor/site-map.md`. Route → purpose → word count is there, so nobody needs to re-crawl to know what exists.
Refs: kb/competitor/site-map.md, research/raw/site/_status.tsv

### [2026-10-29T20:05:00Z] agent: teardown-d4 | type: FINDING | confidence: verified
The site's IA is **also machine-readable in its own JS**: `/_next/static/chunks/15kek4.n1aeu0.js` holds the forms registry (slug, label, type Form|Calculator, `canCreateTemplate`, `pdfUrl`, `labels`, SEO index/submit meta) and `getCalculators()`; `0uc.b_ov5kl_e.js` holds the navbar composition and the whole `/docs` tree (titles + positions). Saved as `research/raw/site/chunks/`. If any route question comes up, read these instead of guessing.
Refs: kb/competitor/tech-recon.md

### [2026-10-29T20:05:00Z] agent: teardown-d4 | type: FINDING | confidence: verified
Monetisation is **lead-gen inside the tax form**, not just banner ads: `auxData.ads` has 13 creatives for 5 advertisers (clalbit-p/clalbit, selam, elite, leumit) on segments `ins1|fin1|fin2`, rendered as an extra "שיתוף פעולה ממומן" panel after the declaration, plus AdSense unit `8819230191` (4× in the schema). The privacy/terms flow requires a **separate opt-in to transfer the user's details to advertisers**, and the FAQ literally answers "do you sell my data?" with "כן". This is the single biggest differentiator for us — see `kb/competitor/monetization-and-tracking.md`.
Refs: kb/competitor/monetization-and-tracking.md, research/raw/start.json

### [2026-10-29T20:05:00Z] agent: teardown-d4 | type: FINDING | confidence: verified
The employer template builder is **not a separate app**: it is the same 101 schema in `data.entry.status === 'template'` mode, exposing a hidden `_settings` panel (employeeEmail required/optional, taxCoordinationWarning error|warn|none, military/medical/bank appendix toggles, bankAccount required/optional/no, initial `thisIncome.types`, lock employer block). So "employer flow" = ~12 booleans + org block, then a shareable `tpz.link/…` URL. Cheap for us to match — `kb/competitor/flow-employer.md`.
Refs: kb/competitor/flow-employer.md, research/raw/site/form-tree.txt

### [2026-10-29T20:05:00Z] agent: teardown-d4 | type: WARNING | confidence: verified
Do **not** copy their docs prose. All `/docs/*` pages are CC BY-NC-SA 4.0 (footer on every page) — non-commercial + share-alike, i.e. incompatible with our use even with attribution. `kb/competitor/content-strategy.md` records only structure, topics, and facts, with our own outline per page.
Refs: kb/competitor/content-strategy.md
