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
`/sitemap-0.xml` lists **115 indexable URLs**, not ~40: 29 "products" (25 forms + 4 calculators) + directory/ovdimio, a 20-page `/docs` tree, a 5-page `/child-support-docs` tree, 4 legal/support pages, and per-form `create/ + organizations/ + submit/ + en/ + ru/` variants. Full inventory: `research/raw/site/_sitemap-0.xml`; human map: `kb/competitor/site-map.md`. Route → purpose → word count is there, so nobody needs to re-crawl to know what exists.
Refs: kb/competitor/site-map.md, research/raw/site/_status.tsv

### [2026-10-29T20:05:00Z] agent: teardown-d4 | type: FINDING | confidence: verified
The site's IA is **also machine-readable in its own JS**: `/_next/static/chunks/15kek4.n1aeu0.js` holds the forms registry (slug, label, type Form|Calculator, `canCreateTemplate`, `pdfUrl`, `labels`, SEO index/submit meta) and `getCalculators()`; `0uc.b_ov5kl_e.js` holds the navbar composition and the whole `/docs` tree (titles + positions). Saved as `research/raw/site/chunks/`. If any route question comes up, read these instead of guessing.
Refs: kb/competitor/tech-recon.md

### [2026-10-29T20:05:00Z] agent: teardown-d4 | type: FINDING | confidence: verified
Monetisation is **lead-gen inside the tax form**, not just banner ads: `auxData.ads` has 13 creatives for 5 advertisers (clalbit-p/clalbit, selam, elite, leumit) on segments `ins1|fin1|fin2`, rendered as an extra "שיתוף פעולה ממומן" panel after the declaration, plus AdSense unit `8819230191` (4× in the schema). The privacy/terms flow requires a **separate opt-in to transfer the user's details to advertisers**, and the FAQ literally answers "do you sell my data?" with "כן". This is the single biggest differentiator for us — see `kb/competitor/monetization-and-tracking.md`.
Refs: kb/competitor/monetization-and-tracking.md, research/raw/start.json

### [2026-10-29T20:05:00Z] agent: teardown-d4 | type: FINDING | confidence: verified
The employer template builder is **not a separate app**: it is the same 101 schema in `data.entry.status === 'template'` mode, exposing a hidden `_settings` panel (employeeEmail required/optional, taxCoordinationWarning error|warn|none, military/medical/bank appendix toggles, bankAccount required/optional/no, initial `thisIncome.types`, lock employer block). So "employer flow" = ~13 settings + org block, then a shareable `tpz.link/…` URL. Cheap for us to match — `kb/competitor/flow-employer.md`.
Refs: kb/competitor/flow-employer.md, research/raw/site/form-tree.txt

### [2026-10-29T20:05:00Z] agent: teardown-d4 | type: WARNING | confidence: verified
Do **not** copy their docs prose. All `/docs/*` pages are CC BY-NC-SA 4.0 (footer on every page) — non-commercial + share-alike, i.e. incompatible with our use even with attribution. `kb/competitor/content-strategy.md` records only structure, topics, and facts, with our own outline per page.
Refs: kb/competitor/content-strategy.md
### [2026-10-29T21:10:00Z] agent: orchestrator | type: DIRECTIVE | confidence: verified
Product decisions from the user (binding for all KB work):
1. **v1 = employee form + employer "prefill link" generator.** No server. The employer fills a small form; we produce a URL whose params/`#` fragment carry employer details (name, address, phone, deduction file no., maybe locked fields) + a `.json` download fallback. Employee opens the link and the employer block is pre-filled (and lockable). No email, no upload back to employer.
2. **Tax year: 2026 only** at launch (rules file per year; 2027 is data later).
3. **Hebrew + English from day 1** — real i18n, both wordings legally reviewed; keep the schema single-source.
4. Repo: private GitHub `chaim-chv/tofes101`, branch `main`.
Refs: kb/decisions/adr-0004-v1-scope.md, https://github.com/chaim-chv/tofes101

### [2026-10-29T20:12:00Z] agent: law-101-a1 | type: CORRECTION | confidence: verified
**Tax coordination is form 116, not 119.** Form 119 is the declaration for the academic-degree / profession credit (item 15 in section ח). `kb/field/101-tax-coordination.md` currently tells users to "open a request (form 119)" — that link/label must be changed to 116. Form 101 section ט does simple employer-level coordination; form 116 is the Tax Authority application.
Refs: https://www.gov.il/BlobFolder/service/tax-coordination-online/he/Service_Pages_Income_tax_annual-report-2024_itc116-2024.pdf ; https://www.gov.il/he/service/itc119

### [2026-10-29T20:12:00Z] agent: law-101-a1 | type: FINDING | confidence: verified
2026 numbers (official Tax Authority booklet, updated April 2026): credit point **2,904 ₪/yr = 242 ₪/mo** (frozen 2024–2027); brackets **10% ≤84,120; 14% ≤120,720; 20% ≤228,000; 31% ≤301,200; 35% ≤560,280; 47% above**; sur-tax 3% above 721,560. The 20%/31% thresholds were widened retroactively to 1.1.2026 by the law of 31.3.2026 — do **not** use the 2025 thresholds (193,800 / 269,280) for 2026.
Refs: research/raw/law/govil-monthly-deductions-2026.pdf pp.4, 10–12

### [2026-10-29T20:12:00Z] agent: law-101-a1 | type: FINDING | confidence: verified
Legal deadlines: 101 within **7 days of starting work OR first salary, whichever earlier** (reg 2(a)(1)); again **1 January** each year (reg 2(a)(2)); changes within **7 days** (reg 2(d)). Employer must demand it (reg 2(c)). No form / no other-income section ⇒ **maximum withholding (47%)** (reg 5(a)). Annual employer reports: form 106 to employee by **31 March**, form 126 to Tax Authority by **30 April**.
Refs: research/raw/law/extracted/wikisource-nikuim-mimaskoret.txt §2, §5; nevo ordinance §166(b)

### [2026-10-29T20:12:00Z] agent: law-101-a1 | type: WARNING | confidence: verified
A browser-only **form filler is not an approved "טופס 101 אלקטרוני" system**. The 2026 circular requires employers who replace the annual paper form to use Tax-Authority-approved software, employee password identification, employer e-signature and a versioned archive. Our output is a filled PDF for the employee to sign/submit (or to enter into the employer's approved system) — copy must not claim it replaces the employer's 101 process.
Refs: research/raw/law/govil-electronic-101-rules-2026.pdf §ב.2–ב.3

### [2026-10-29T22:40:00Z] agent: ux-a11y-b2 | type: FINDING | confidence: verified
Israeli law points at **WCAG 2.0 AA**, not 2.2. IS 5568 part 1 (Sept 2023 edition, full PDF on gov.il) states it is identical to WCAG 2.0 (11.12.2008) except national additions, and replaces the May 2021 edition. Implications: build/test to 2.2 AA, but the accessibility statement must say "ת"י 5568 (WCAG 2.0 AA)" and may add "tested against WCAG 2.2 AA" — never claim 2.2 alone as the legal target.
Refs: kb/sources/govil-is5568-standard.md, kb/ux/a11y-is5568-vs-wcag22.md

### [2026-10-29T22:40:00Z] agent: ux-a11y-b2 | type: FINDING | confidence: verified
The Service Accessibility Regulations explicitly cover **online data-entry forms** (reg. 35ב(ג)(2): forms for receiving a service must comply even if created before 26.10.2015) and require a **prominent accessibility statement** (35ה) with accommodations, coordinator details and a complaint channel; 35ו(ז) exempts עוסק פטור / turnover ≤ ₪100k. Coordinator: 25+ employees, publish name/office/contact (91). Clause numbers partly reconstructed from the Wikisource consolidation — flagged in the source node.
Refs: kb/sources/israel-regs-service-accessibility.md, kb/ux/a11y-israeli-law.md, kb/ux/a11y-statement.md

### [2026-10-29T22:40:00Z] agent: ux-a11y-b2 | type: DECISION | confidence: verified
**No global modifier keyboard shortcuts by default.** `Ctrl+Alt` is the VoiceOver (`VO`) modifier; `Insert`/`CapsLock` are NVDA/JAWS modifiers; `Alt+Shift` switches keyboard layouts on Windows. Power features (`n/b/s/e/h/g/1–9/0/?`) are an **opt-in** single-key layer that is inert while focus is in an input, textarea, select, contenteditable or an open combobox, and can be turned off. Native Tab/Enter/Space/arrows/Esc are the only default contract. Full table: kb/ux/checklists/keyboard-map.md.
Refs: kb/ux/keyboard-model.md, kb/ux/checklists/keyboard-map.md

### [2026-10-29T22:40:00Z] agent: ux-a11y-b2 | type: DECISION | confidence: likely
Form navigation: **8-step wizard + review screen**, not the reference's single long page (160 fields). Steps: 0 intro · 1 tax year+employer · 2 identity · 3 address/contact · 4 status · 5 children · 6 credits/income · 7 review · 8 declaration/signature. Progress is step-based ("שלב 3 מתוך 8"), never % of fields. This affects `flow/` and eng routing; if rejected, the alternative is a single page with a sticky section nav and a top error summary.
Refs: kb/ux/wizard-vs-long-page.md, kb/ux/form-101-screen-map.md, kb/ux/progress-save-resume.md

### [2026-10-29T22:40:00Z] agent: ux-a11y-b2 | type: WARNING | confidence: verified
RTL/bidi: `dir="rtl"` on `<html>` (never CSS `direction`), logical CSS only, and every ID/phone/email/URL string must be tightly wrapped in `dir="ltr"` (+ `lang="en"` for Latin) or it will reorder inside Hebrew sentences. Screen readers read digit strings digit-by-digit only if the label says so. Do not use `unicode-bidi: bidi-override`.
Refs: kb/ux/rtl-foundations.md, kb/ux/bidi-mixed-content.md, kb/sources/w3c-bidi-inline.md
### [2026-10-29T22:40:00Z] agent: orchestrator | type: FINDING | confidence: verified
App scaffold is live at repo root (Nuxt 4.6.3 + Nuxt UI 4.12.0). Practical traps that will bite eng docs: (1) `@nuxt/icon` fetches from api.iconify.design unless `serverBundle:false` + `clientBundle:{scan:true}` + `@iconify-json/lucide`; (2) Nuxt router drops the URL fragment on hydration → prefill payload must be captured by inline head script (`window.__INITIAL_HASH`); (3) `UApp` needs a locale OBJECT from `@nuxt/ui/locale`, not a string; (4) CSP is set as a meta tag in nuxt.config and `scripts/check-privacy.ts` fails the build on any external host. Commands: `bun run generate`, `bun run check:privacy`, `bun run e2e`, `bun run verify`.
Refs: FINDINGS.md, nuxt.config.ts, scripts/check-privacy.ts, tools/e2e/smoke.ts
