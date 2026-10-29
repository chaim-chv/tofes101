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
