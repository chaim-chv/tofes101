---
id: eng/agent-workflow
title: AI agent workflow — context budget, task router, test ladder, delegation
type: concept
status: verified
confidence: verified
updated: 2026-11-01
tags: [agents, workflow, testing, delegation, context, tooling]
sources: []
related: [eng/repo-layout, eng/testing, eng/architecture, eng/privacy-enforcement]
up: eng/architecture
---

# AI agent workflow

**Canonical source: `AGENTS.md` at the repo root** (`CLAUDE.md` is a symlink to
it). This node only explains why the rules exist; if the two disagree, `AGENTS.md`
wins and this node is stale.

The repo is built to be read in slices: a knowledge graph for *why*, a pure
engine for *rules*, adapters for *side effects*. An agent that follows that shape
needs two or three files per task. An agent that does not — grepping nothing,
reading `schema.ts` end to end, running `verify` "to be safe" — spends most of
its time on latency and re-discovers traps already recorded in `FINDINGS.md`.

## 1. Context budget

Three files before acting; then delegate. Search with `rg`, read a window, and
prefer the distilled artifact over the raw one:

| Question | Distilled answer | Do not open |
| --- | --- | --- |
| what fields exist, with conditions and validators | `flow/form-101-field-spec` | `research/raw/form/tree.json` (588 nodes) |
| why a rule exists | `law/*`, `field/*` | the crawled site |
| where a coordinate is | `eng/pdf-slot-map`, `app/pdf/anchors.json` | the audit PNGs |
| what already bit us | repo-root `FINDINGS.md` | git history spelunking |
| build output | — | `.nuxt/`, `.output/`, `node_modules/` |

## 2. Test ladder

Measured 2026-11-01 on the author's machine; use it as an order of magnitude.

| Change | Command | Cost |
| --- | --- | --- |
| docs / kb | `bun run kb:check` | 0.05 s |
| engine, validators, locales, documents | `bun test` | 0.6 s |
| anything, habitually | `bun run check:fast` | < 1 s |
| TS/Vue commit | `bun run typecheck` | ~5 s |
| deps, CSP, fonts, icons, routes | `generate` + `check:privacy` | ~9 s |
| UI flow, print, PDF, axe | `generate` + `e2e` | **4 m 17 s** |
| release | `bun run verify` | ~4.5 min |

`e2e` is the only expensive gate. It is also the only one that proves the flow,
the printed output and the external-request guard together — so it is a *release*
check and a *UI* check, never a reflex. Two agents running it concurrently must
set `E2E_PORT`; the default port is shared state (`eng/testing`).

## 3. Delegation

Exploration and research are the subagent jobs: locating symbols, mapping a
cross-cutting concern, reading an external authority, comparing options. Editing
stays with the agent that owns the task, so two workers never touch one file.

The brief must fix the answer shape — `file:line` plus a short excerpt plus a
one-line conclusion — otherwise the subagent returns a file dump and the parent
pays the same context cost it tried to avoid. Parent re-verifies any claim that
drives an edit by opening the cited line.

## 4. Where knowledge goes

`FINDINGS.md` is the fast lane (dated bullet + evidence), `kb/` is the library
(frontmatter, sources, `kb:check`), `PLAN.md` is undecided, `kb/decisions/` is
decided, `agent-workspace/` is scratch. Writing the finding at the moment of
discovery is the cheapest documentation work available; it is also the only kind
that reliably happens.

## See also

- `AGENTS.md` — the full contract (hard rules, router, done checklist).
- [eng/testing](testing.md) — the gates themselves and what each covers.
- [eng/repo-layout](repo-layout.md) — boundaries that make targeted reads possible.
- [CONVENTIONS](../CONVENTIONS.md) — node format for anything written here.
