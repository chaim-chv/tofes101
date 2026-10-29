---
id: index
title: מפת הידע — tofes101 knowledge base
type: glossary
status: verified
confidence: verified
updated: 2026-10-29
tags: [index, map-of-content]
---

# מפת הידע · Knowledge map

Start here. This repo is a **graph**: every file is a node with an `id`, and the
edges are in its frontmatter (`related`, `up`, `sources`) plus inline
`[[wikilinks]]`. Generated navigation lives in `.generated/` — never edit those.

```bash
bun run kb            # rebuild graph.json, BACKLINKS.md, ORPHANS.md, tree.txt, graph.html
bun run kb:check      # fail on broken links / missing frontmatter
bun run kb:backlinks  # also inject a "## Backlinks" block into every node
```

Open **`kb/.generated/graph.html`** in a browser for the interactive graph.

## If you are…

| you want to… | read, in this order |
| --- | --- |
| understand the domain in 20 min | [flow/form-101-service](flow/form-101-service.md) → [law/form-101](law/form-101.md) → [flow/form-101-field-spec](flow/form-101-field-spec.md) |
| implement a field / validation | [flow/form-101-field-spec](flow/form-101-field-spec.md) → the matching `law/` node → the matching `field/` node |
| know *why* a rule exists | [law/form-101](law/form-101.md) and its children; every rule cites a `source/` |
| build screens | [ux/ux-principles](ux/ux-principles.md) → `ux/checklists/*` |
| choose a library / architecture | [eng/architecture](eng/architecture.md) → `decision/adr-*` |
| understand the competitor | `competitor/site-map.md`, `competitor/feature-parity.md`, [finding/tepez-form-runtime](finding/tepez-form-runtime.md) |
| pick up where someone stopped | `../FINDINGS.md` → `.generated/ORPHANS.md` → `.generated/tree.txt` |

## Domains

### Law & domain rules — `kb/law/`
The legal spine is [law/form-101](law/form-101.md): what the form is, who signs,
when, and a section-by-section map into the credit/exemption rules. Everything
numeric (credit points, thresholds, ages) must be year-stamped and sourced.

### The form as a flow — `kb/flow/`
- [flow/form-101-service](flow/form-101-service.md) — end-to-end user flow, all
  ten sections, outputs, edge cases, and what we do differently.
- [flow/form-101-field-spec](flow/form-101-field-spec.md) — **generated**
  exhaustive field table (160 fields) + [schema JSON](flow/form-101-schema.json).

### Field deep-dives — `kb/field/`
One node per field that needs more than a label:
[שנת מס](field/101-tax-year.md) ·
[זהות (ת"ז/דרכון)](field/101-employee-identity.md) ·
[מעמד מס](field/101-employee-tax-status.md) ·
[ילדים](field/101-children-block.md) ·
[הכנסות אחרות](field/101-other-incomes.md) ·
[16 פריטי הזיכוי](field/101-credit-items-map.md) ·
[תיאום מס](field/101-tax-coordination.md) ·
[מסמכים](field/101-documents.md) ·
[מעסיק](field/101-employer-block.md) ·
[חתימה](field/101-signature.md) ·
[מונחים](glossary/terms.md)

### Decisions — `kb/decisions/`
- [ADR-0004 — v1 scope, tax year, languages](decision/adr-0004-v1-scope.md)
- [ADR-0005 — employer prefill link](decision/adr-0005-employer-prefill-link.md)
- [ADR-0006 — navigation model (8 steps)](decision/adr-0006-navigation.md)
- `adr-0001-*` … `adr-0003-*` — stack, PDF strategy, draft storage (engineering track)

### Reference implementation — `kb/finding/`
- [finding/tepez-form-runtime](finding/tepez-form-runtime.md) — how
  tofes101.co.il is actually built, and how to re-extract it.

### UX & accessibility — `kb/ux/`
[ux/ux-principles](ux/ux-principles.md) is the hub; `ux/checklists/` has the
PR checklist, the keyboard map and the per-screen review list.

### Engineering — `kb/eng/`
[eng/architecture](eng/architecture.md) is the hub; decisions live in
`kb/decisions/`.

### Product — `kb/product/`
Scope, personas, non-goals.

### Competitor — `kb/competitor/`
Site map, flows, feature parity, content strategy, tracking/monetisation.

### Sources — `kb/sources/`
One node per external authority with `url`, `publisher`, `retrieved` date and
what it establishes. If a claim has no source node, it is an opinion.

## See also

- [CONVENTIONS](CONVENTIONS.md) — how to add a node.
- `../FINDINGS.md` — durable implementation discoveries (append-mostly).
- `../PLAN.md` — roadmap and open questions (O-n).

## Product

The surrounding product — everything that is not the form logic. Start with the scope,
then the evidence.

| Node | What it answers |
| --- | --- |
| [product/scope-v1](product/scope-v1.md) | what we build in v1 (browser-only, no emailing), non-goals, and the 9 open questions for the product owner |
| [product/personas](product/personas.md) | five personas (new hire, parent, SMB employer, oleh/returning resident, tax-coordination case) and the evidence for each friction |
| [competitor/site-map](competitor/site-map.md) | all routes, purposes, word counts, nav/footer, indexability, the 3 SEO clusters |
| [competitor/flow-employee](competitor/flow-employee.md) | the screens around the fields: loading, intro, consent gate, action bar, errors, draft, post-submit |
| [competitor/flow-employer](competitor/flow-employer.md) | template link: the 12 settings, what the employee sees, delivery and its failure modes, the עובדיםIO upsell |
| [competitor/flow-calculators](competitor/flow-calculators.md) | the 4 calculators and exactly what each computes |
| [competitor/content-strategy](competitor/content-strategy.md) | titles/H1 per page, docs pedagogy, keyword surface, and the original content we must write |
| [competitor/monetization-and-tracking](competitor/monetization-and-tracking.md) | lead-gen ads inside the form, GA/GTM/Ads/Meta/Sentry, the data-sale consent, and what we do instead |
| [competitor/feature-parity](competitor/feature-parity.md) | scored table (employee / employer / cross-cutting) + the three places we clearly win + what we must not pretend |
| [competitor/tech-recon](competitor/tech-recon.md) | Next.js/Vercel/turbopack, the AngularJS runner and its iframe contract, endpoints, chunks |

The form itself is elsewhere: [flow/form-101-service](flow/form-101-service.md),
[flow/form-101-field-spec](flow/form-101-field-spec.md),
[finding/tepez-form-runtime](finding/tepez-form-runtime.md).

## UX

The UX + accessibility layer: what every screen must do, and why. The hub is
[ux/ux-principles](ux/ux-principles.md) — 12 rules, each linking to an implementable node.

**Law & standard**

| Node | What it answers |
| --- | --- |
| [ux/a11y-israeli-law](ux/a11y-israeli-law.md) | who is liable, what the 2013 regulations + 2017 amendment require, exemptions, coordinator duties |
| [ux/a11y-is5568-vs-wcag22](ux/a11y-is5568-vs-wcag22.md) | IS 5568 = WCAG 2.0 AA; the exact 2.2 delta we adopt and what we may claim |
| [ux/a11y-statement](ux/a11y-statement.md) | required contents, placement, Hebrew template, what not to claim |

**Hebrew, RTL, bidi**

| Node | What it answers |
| --- | --- |
| [ux/rtl-foundations](ux/rtl-foundations.md) | `dir="rtl"`, logical CSS, icon mirroring, the traps |
| [ux/bidi-mixed-content](ux/bidi-mixed-content.md) | IDs, phones, emails, URLs, `<bdi>`, `&lrm;`/`&rlm;` |
| [ux/hebrew-typography](ux/hebrew-typography.md) | font stack, 18px base, line length, tabular numerals |
| [ux/hebrew-input](ux/hebrew-input.md) | keyboard layout, final letters, autocorrect, bidi marks on paste |
| [ux/hebrew-microcopy](ux/hebrew-microcopy.md) | plain Hebrew, gender strategy, terminology table, before/after |

**Form mechanics**

| Node | What it answers |
| --- | --- |
| [ux/wizard-vs-long-page](ux/wizard-vs-long-page.md) | 8 steps + review; why not one page or 160 pages |
| [ux/form-101-screen-map](ux/form-101-screen-map.md) | per-step content, risk, a11y notes |
| [ux/progress-save-resume](ux/progress-save-resume.md) | progress, autosave, draft file, storage warnings |
| [ux/autofill-tokens](ux/autofill-tokens.md) | full `autocomplete`/`inputmode`/`enterkeyhint` table |
| [ux/israeli-input-masking](ux/israeli-input-masking.md) | ID check digit, phone, dates, money, postcode |
| [ux/validation-and-errors](ux/validation-and-errors.md) | timing, error summary, focus, `aria-invalid`, no data loss |
| [ux/required-optional-conditional](ux/required-optional-conditional.md) | mark optional, conditional fields, skipped sections |
| [ux/live-announcements](ux/live-announcements.md) | one status region, what to announce and what not |
| [ux/choice-controls](ux/choice-controls.md) | radio/checkbox/switch, RTL arrows, "none of the above" |
| [ux/help-and-glossary](ux/help-and-glossary.md) | progressive disclosure without hiding required info |
| [ux/signature-accessibility](ux/signature-accessibility.md) | canvas + typed path, declaration, legal caveats |

**Keyboard, mobile, trust, output**

| Node | What it answers |
| --- | --- |
| [ux/keyboard-model](ux/keyboard-model.md) | native by default, opt-in quick keys, why no `Ctrl+Alt` |
| [ux/focus-management](ux/focus-management.md) | focus order, rings, step changes, dialogs, skip links |
| [ux/speed-patterns](ux/speed-patterns.md) | defaults, copy-from-spouse, chips, review & fix |
| [ux/mobile-layout](ux/mobile-layout.md) | 44px, sticky action, keyboard, safe areas |
| [ux/trust-local-privacy](ux/trust-local-privacy.md) | local-only claims, shared device, what never to promise |
| [ux/print-export](ux/print-export.md) | print CSS, PDF tagging, metadata, signature page |

**Checklists (paste into PRs)**

| Node | Use |
| --- | --- |
| [ux/checklists/a11y-pr-checklist](ux/checklists/a11y-pr-checklist.md) | per-PR gate, mapped to WCAG SC |
| [ux/checklists/keyboard-map](ux/checklists/keyboard-map.md) | the shortcut table, implement verbatim |
| [ux/checklists/screen-review-checklist](ux/checklists/screen-review-checklist.md) | 15-minute per-screen review |

**Sources** — [gov.il IS 5568](sources/govil-is5568-standard.md),
[regulations](sources/israel-regs-service-accessibility.md),
[gov.il guide](sources/govil-website-accessibility-guide.md),
[statement example](sources/govil-accessibility-statement.md),
[WCAG 2.2](sources/w3c-wcag22.md), [WCAG 2.0 Hebrew](sources/w3c-wcag20-hebrew.md),
[bidi structural](sources/w3c-bidi-structural.md), [bidi inline](sources/w3c-bidi-inline.md),
[GOV.UK question pages](sources/govuk-question-pages.md), [error summary](sources/govuk-error-summary.md),
[names](sources/govuk-names.md), [addresses](sources/govuk-addresses.md), [dates](sources/govuk-dates.md),
[MDN autocomplete](sources/mdn-autocomplete.md), [inputmode](sources/mdn-inputmode.md),
[enterkeyhint](sources/mdn-enterkeyhint.md), [VisualViewport](sources/mdn-visual-viewport.md),
[NN/g forms](sources/nng-web-form-design.md).

## Law

The legal spine for form 101 (טופס 101), tax years 2025–2026. Start with the hub;
every node is year-stamped and cites a `source/` node.

| Node | What it answers |
| --- | --- |
| [law/form-101](law/form-101.md) | **hub** — what the form is, who fills/signs it, when, and the legal spine |
| [law/form-101-official-pdf](law/form-101-official-pdf.md) | the official 0101/130 (11.2025) artifact, page by page, and version pitfalls |
| [law/form-101-section-map](law/form-101-section-map.md) | one row per section א–י and per item 1–16 / ט1–3, mandatory vs optional |
| [law/personal-details](law/personal-details.md) | section ב: identity, address, phones, gender, marital status, kibbutz, health fund |
| [law/who-must-file](law/who-must-file.md) | employee, daily worker, foreign worker, pensioner, minor, multiple employers |
| [law/submission-deadlines](law/submission-deadlines.md) | 7 days, 1 January, 7-day changes, 2(e), late consequences |
| [law/employer-obligations](law/employer-obligations.md) | demand, verify, withhold, report (106/126), archive, privacy |
| [law/withholding-mechanics](law/withholding-mechanics.md) | monthly table, maximum rate, salary types, surtax |
| [law/tax-coordination](law/tax-coordination.md) | 101 section ט, form 116 (not 119), main/second employer |
| [law/credit-points](law/credit-points.md) | **credit hub** — every track, how points reduce tax |
| [law/credit-point-value](law/credit-point-value.md) | 2,904 ₪/yr · 242 ₪/mo and the 2024–2027 freeze |
| [law/credit-points-2026](law/credit-points-2026.md) | 2026 cheat sheet: values, brackets, children, oleh, reserve |
| [law/tax-brackets-2025](law/tax-brackets-2025.md) | 2025 annual/monthly brackets and surtax |
| [law/tax-brackets-2026](law/tax-brackets-2026.md) | 2026 brackets, the 31.3.2026 retroactive widening, worked example |
| [law/children-credit-points](law/children-credit-points.md) | per-child table by age and parent, 2024–2026 |
| [law/single-parent-credit](law/single-parent-credit.md) | items 6/9/10, custody, separation, part-year |
| [law/spouse-not-working](law/spouse-not-working.md) | dependent-spouse 1 point and working-spouse 1.5/1.75 |
| [law/new-immigrant](law/new-immigrant.md) | oleh 54/42-month schedule and the 2026 temporary exemption |
| [law/returning-resident](law/returning-resident.md) | returning-resident tracks and what the 101 can/cannot do |
| [law/soldier-credit](law/soldier-credit.md) | discharged soldier / national service, 36 months |
| [law/reserve-credit](law/reserve-credit.md) | reserve combatant tiers for 2026–2027 |
| [law/credit-points-studies](law/credit-points-studies.md) | BA/MA/profession/teaching credit and form 119 |
| [law/alimony-credit](law/alimony-credit.md) | 1 point for alimony to a former spouse after remarriage |
| [law/disabled-child-credit](law/disabled-child-credit.md) | 2 points per disabled child (s. 45) |
| [law/youth-credit](law/youth-credit.md) | 1 point for ages 16–17 |
| [law/disability-exemption](law/disability-exemption.md) | item 2 is an exemption, not points; 2026 ceilings |
| [law/residency-and-foreign-workers](law/residency-and-foreign-workers.md) | resident vs foreign resident vs foreign worker; point tables |
| [law/id-number-validation](law/id-number-validation.md) | 9-digit ID, check-digit algorithm, passport fallback |
| [law/marital-status](law/marital-status.md) | five options, “פרוד/ה” approval, part-year, gaps |
| [law/children-details](law/children-details.md) | section ג rows, custody, NII allowance, validation |
| [law/privacy-consent](law/privacy-consent.md) | Amendment 13, no consent checkbox, browser-only checklist |
| [law/declaration-and-signature](law/declaration-and-signature.md) | declaration text, paper vs approved electronic signature |
| [law/retention](law/retention.md) | 7 years / 6 years from filing, versioned archive |
| [law/edge-cases](law/edge-cases.md) | 24 edge cases: minors, foreign workers, death, corrections, etc. |
| [law/glossary](law/glossary.md) | Hebrew/English terms for form 101 and payroll tax |

## Engineering

The implementation layer: how the client-only app is built, where state lives, how
the PDF is produced, and what we can prove about privacy and performance. Hub:
[eng/architecture](eng/architecture.md).

**Foundation**

| Node | What it answers |
| --- | --- |
| [eng/architecture](eng/architecture.md) | **hub** — layers, module map, data flow, schema location, static deploy, threat-model diagram |
| [eng/toolchain-versions](eng/toolchain-versions.md) | exact verified versions (bun 1.4.3, Nuxt 4.6.3, UI 4.12.0, Pinia 4.1.0, pdf-lib 1.17.1…) and the warnings we saw |
| [eng/repo-layout](eng/repo-layout.md) | `app/` tree, naming, import boundaries, scripts, CI order |
| [eng/form-schema-model](eng/form-schema-model.md) | the 160-field runtime model: kinds, conditions, validators, computed values, repeat groups |

**State and storage**

| Node | What it answers |
| --- | --- |
| [eng/storage-draft](eng/storage-draft.md) | versioned IndexedDB envelope, migrations, autosave, multi-tab conflicts, TTL, export/import |
| [eng/offline-pwa](eng/offline-pwa.md) | precache, service-worker registration gotchas, update strategy, verified offline reload |

**Output**

| Node | What it answers |
| --- | --- |
| [eng/pdf-generation](eng/pdf-generation.md) | official PDF has 0 AcroForm fields → coordinate overlay; print fallback; decision matrix |
| [eng/pdf-hebrew-rtl](eng/pdf-hebrew-rtl.md) | fontkit's RTL reversal vs UAX #9; the token algorithm verified against Chrome |
| [eng/signature](eng/signature.md) | canvas → PNG → PDF, accessibility, and the legal question handed to the law track |

**Trust and delivery**

| Node | What it answers |
| --- | --- |
| [eng/privacy-enforcement](eng/privacy-enforcement.md) | CSP, self-hosted fonts/icons, `check-privacy` gate, runtime network assertion |
| [eng/i18n-rtl](eng/i18n-rtl.md) | Nuxt UI locale, `dir`, logical CSS, Intl formats, bidi in inputs |
| [eng/testing](eng/testing.md) | Vitest/Playwright/axe results, PDF golden tests, GitHub Actions with bun |
| [eng/performance](eng/performance.md) | measured Lighthouse 98/100, bundle accounting, 3G budget, per-step splitting |

**Decisions**

| ADR | Decision |
| --- | --- |
| [ADR-0001](decisions/adr-0001-stack.md) | bun + Nuxt 4.6 + Nuxt UI 4.12 + Pinia 4, static `nuxt generate`; lightweight `useLocale` in v1 (i18n 10 verified as upgrade path) |
| [ADR-0002](decisions/adr-0002-pdf-strategy.md) | pdf-lib overlay on the official flat PDF; HTML print as fallback/accessible path |
| [ADR-0003](decisions/adr-0003-draft-storage.md) | Pinia + versioned IndexedDB envelope via `idb-keyval`, custom migrations |

**Spike evidence:** `research/spikes/RESULTS.md` (commands, resolved versions,
offline test, PDF previews) and `research/spikes/pdf/out/` (filled official PDF +
PNG renders).
