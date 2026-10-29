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
