# KB conventions (read this first)

This repo's documentation is a **graph**, not a folder tree. Folders are only a
rough physical grouping; the graph is defined by `id` + typed links.

## Node file format

Every knowledge node is one Markdown file under `kb/**`, starting with YAML
frontmatter:

```yaml
---
id: law/credit-points            # REQUIRED. unique. "<domain>/<slug>", kebab-case, ascii
title: נקודות זיכוי — Credit Points  # REQUIRED. human title (Hebrew ok)
type: concept                    # REQUIRED. see types below
status: verified                 # draft | verified | stale
confidence: verified             # verified | likely | unverified
updated: 2026-10-29              # ISO date, last substantive edit
tags: [law, income-tax]          # free tags, lowercase ascii
sources: [source/kol-zchut-credit-points]   # ids of source/ nodes
related: [law/form-101-field-credit-points] # untyped "see also" edges
up: law/form-101                 # optional: parent / broader concept
---
```

Body rules:
- Markdown, Hebrew or English (Hebrew for anything a user sees; English for code).
- Link other nodes inline with `[[law/form-101]]` or `[[law/form-101|טופס 101]]`.
  A wikilink to a non-existent id is an error (`bun run kb:check`).
- Any normative claim (a tax rule, a deadline, a form requirement) **must** cite a
  `source/*` node inline, e.g. `([מקור](kb/sources/x.md))` or mention its id.
- Do not paste long copyrighted text. Paraphrase + cite. Short quotes only.

## Node types

| type        | use for                                                        |
| ----------- | -------------------------------------------------------------- |
| `source`    | an external authority or artifact we rely on (law, PDF, site)   |
| `concept`   | durable domain knowledge (law rule, UX principle, eng concept)  |
| `flow`      | a user/system flow (steps, states, edge cases)                  |
| `field`     | one form field / control in the 101 form (schema + UX + rules)  |
| `decision`  | an architecture/product decision (ADR-style, with rationale)    |
| `finding`   | an empirical observation from research (incl. competitor code)  |
| `pattern`   | a reusable UI/engineering pattern we will implement              |
| `glossary`  | a term (HE/EN) with definition and links                        |

## Required hubs (keep these fresh)

- `kb/index.md` — the map of content. Every new domain gets a link here.
- `kb/law/form-101.md` — the legal spine. Everything about the form hangs off it.
- `kb/ux/ux-principles.md` — UX spine.
- `FINDINGS.md` (repo root) — durable implementation discoveries, append-mostly.
- `PLAN.md` — roadmap/decisions that are not yet code.

## Agent edits

The working agreement for AI sessions is `AGENTS.md` at the repo root — read it
first; this section only covers how it interacts with the graph.

- **Search before writing.** `rg -l "<topic>" kb` — extend the existing node
  instead of adding a near-duplicate. Two nodes answering one question is a bug.
- **One node answers one question.** If a draft needs two unrelated sections,
  split it and link the halves.
- **Bump `updated:`** on every substantive edit.
- **Link it from a hub** (`index.md` or the domain hub) in the same change, or
  the node lands in `.generated/ORPHANS.md`.
- **Fast lane vs library:** an implementation trap with a date and an evidence
  link goes to `FINDINGS.md`; an explanation longer than a paragraph goes here.
- **Generated files are read-only** — `kb/.generated/**`,
  `kb/flow/form-101-field-spec.md`, `kb/flow/form-101-schema.json`. Regenerate
  with `bun run kb`, `bun run kb:check` or `bun run extract:form`.
- **Run `bun run kb:check`** before committing; it is the only gate for the graph.

## Attribution & confidence

Never silently upgrade confidence. `verified` = you saw it at the primary source
yourself (law text, official PDF, the running product). `likely` = strong
secondary source. `unverified` = one blog / one person's claim. Anything that
drives a shipped behavior needs `verified` or an explicit `decision/` node that
accepts the risk.

## Generated artifacts (never hand-edit)

`bun run kb` writes:

- `kb/.generated/graph.json` — ids + edges + metadata (for tools/UI)
- `kb/.generated/BACKLINKS.md` — every node, who links to it
- `kb/.generated/ORPHANS.md` — nodes nothing links to, and broken links
- `kb/.generated/tree.txt` — `up` hierarchy

## Naming

- ids: ascii kebab-case, no diacritics. Hebrew lives in `title`.
- form fields: `field/<form>-<step>-<slug>` e.g. `field/101-personal-firstName`.
- sources: `source/<publisher>-<topic>`.
- decisions: `decision/adr-0001-<slug>`.
