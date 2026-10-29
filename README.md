# tofes101 — private, browser-only טופס 101

A rebuild of the *good parts* of [tofes101.co.il](https://tofes101.co.il/forms/itc-101/submit/):
fill Israeli ITC form 101 (כרטיס עובד) online, get a filled PDF — but with **no
server, no account, no ads, no data leaving the browser**.

> Status: **research / knowledge base**. No app code yet (deliberate — the KB is
> the input to the build). See `PLAN.md`.

## What is in here

```
kb/                 the knowledge graph (start at kb/index.md)
  law/              Israeli tax law & the form's rules, sourced
  flow/             the form as a user flow + generated field spec
  field/            deep dives on individual tricky fields
  ux/               UX + accessibility (incl. Israeli standard ת"י 5568)
  eng/              architecture, storage, PDF, offline, testing
  decisions/        ADRs
  product/          scope, personas, non-goals
  competitor/       teardown of tofes101.co.il
  sources/          one node per external authority (url + retrieved date)
  CONVENTIONS.md    how to add knowledge
  .generated/       built artifacts: graph.json, BACKLINKS.md, ORPHANS.md,
                    tree.txt, graph.html (interactive, self-contained)
tools/
  crawl/            recon scripts against the reference implementation
  kb/               spec generators
scripts/kb.ts       graph builder / link checker
research/raw/       raw evidence: extracted form JSON, official PDFs, HTML
agent-workspace/    multi-agent working notes (SHARED.md + per-agent logs)
FINDINGS.md         fast-lane implementation discoveries
PLAN.md             roadmap + open questions
```

## Quickstart

```bash
bun install                                   # needs NODE_TLS_REJECT_UNAUTHORIZED=0 here
bun run kb                                    # build the graph + backlinks
bun run kb:check                              # fail on broken links
open kb/.generated/graph.html                 # interactive graph (offline)
bun run extract:form                          # re-extract the reference form
```

## Reading order for a new contributor

1. `kb/index.md` — the map.
2. `kb/flow/form-101-service.md` — what the product does.
3. `kb/law/form-101.md` — why each answer exists.
4. `kb/ux/ux-principles.md` + `kb/eng/architecture.md` — how we build it.
5. `FINDINGS.md` — the traps we already know about.

## Non-negotiables

- **Privacy**: nothing leaves the device. No analytics, no fonts from a CDN, no
  network calls after first load. Enforced, not promised (see `kb/eng/privacy-enforcement.md`).
- **Accessibility**: WCAG 2.2 AA + ת"י 5568, keyboard-complete, RTL-first.
- **Correctness**: every legally load-bearing rule cites a primary source in `kb/law/`.
- **Speed of use**: a returning user should be able to fill the form in minutes,
  keyboard-only, without the mouse.
