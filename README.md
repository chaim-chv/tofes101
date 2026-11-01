# tofes101 — privacy-first, browser-only טופס 101

A rebuild of the *good parts* of [tofes101.co.il](https://tofes101.co.il/forms/itc-101/submit/):
fill Israeli ITC form 101 (כרטיס עובד) online, get a filled PDF — but with **no
server, no account, no ads, no data leaving the browser**.

> Status: **working v1** — the full form, employer prefill links, local drafts,
> a PDF overlay on the official form and an A4 print path, live at
> **https://101.chv.ovh/** via GitHub Pages. Coordinate polish and PWA offline
> are next (`PLAN.md`).

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
  e2e/              full Playwright + axe flow (the 4-minute gate)
  pdf/              anchor builder, cell extractor, slot audits
  serve.ts          static server for .output/public
scripts/kb.ts       graph builder / link checker
research/raw/       raw evidence: extracted form JSON, official PDFs, HTML
agent-workspace/    multi-agent working notes (SHARED.md + per-agent logs)
AGENTS.md           how AI agents work here (CLAUDE.md is a symlink to it)
FINDINGS.md         fast-lane implementation discoveries
PLAN.md             roadmap + open questions
```

## Quickstart

```bash
bun install                                   # Node 22+ / bun 1.4.3
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

**If you are an AI agent**, stop here and read `AGENTS.md` instead: it routes each
task to the two or three files that matter, lists the test to run (and the ones
not to), and defines when to delegate exploration to a subagent. `CLAUDE.md` is a
symlink to the same file.

## Non-negotiables

- **Privacy**: no answers leave the device. The only outbound request is a
  cookieless Umami page view with the URL fragment and query stripped — never
  form data, attachments or files. No CDN fonts, no other third parties.
  Enforced, not promised (`kb/eng/privacy-enforcement.md`, ADR-0008).
- **Accessibility**: WCAG 2.2 AA + ת"י 5568, keyboard-complete, RTL-first.
- **Correctness**: every legally load-bearing rule cites a primary source in `kb/law/`.
- **Speed of use**: a returning user should be able to fill the form in minutes,
  keyboard-only, without the mouse.

---

## Live

**https://101.chv.ovh/** — deployed from `main` by
`.github/workflows/deploy.yml` (verify → artifact → GitHub Pages). The custom
domain serves the site from `/` (`public/CNAME`); the old
`chaim-chv.github.io/tofes101/` URL redirects there.

## How it is built

The form is **data**, not markup: `app/form/schema.ts` holds one `FieldDef` per
fact (label key, condition predicate, requiredness, validators, PDF slot), and
`app/form/engine.ts` is a pure, dependency-free layer that computes visibility,
validation and step gating. Components render what the engine says and contain no
rules. Storage and printing are adapters. See `docs/IMPLEMENTATION.md` for the
contracts and the build order.

```
app/form/      schema · engine · validators · derive · format   (pure)
app/storage/   IndexedDB draft, versioned envelope, export/import
app/components one component per control kind; no duplicated markup
app/pages/     / (landing) · /employer (link builder) · /form (the flow) · /print (A4)
app/locales/   he.ts + en.ts, typed keys, completeness tested
shared/        employer-link codec (deflate-raw + base64url, fragment only)
```

## Verify

Run the narrowest level that can fail for your change — not the whole list.

```bash
bun run check:fast    # kb:check + all unit tests            (< 1 s)
bun run kb:check      # knowledge graph: no broken links     (0.05 s)
bun test              # 113 unit tests                       (0.6 s)
bun run typecheck     # vue-tsc, strict                      (~5 s, see note)
bun run generate      # static site                          (~9 s)
bun run check:privacy # fails on any external host outside the allowlist (needs generate)
bun run e2e           # Playwright: employer link → full fill → review → print,
                      # axe on every step                   (~4 min, needs generate)
bun run verify        # all of the above in order            (~4.5 min, release gate only)
```

Notes:

- `typecheck` prints an `ERR_PACKAGE_PATH_NOT_EXPORTED` stack trace from
  `vue-router/volar` and still exits 0. Only `error TS` lines matter.
- `e2e` serves `.output/public`, so run `bun run generate` first. Parallel agents
  must use their own port: `E2E_PORT=4199 bun run e2e`.
- CI runs the full order in `.github/workflows/ci.yml`; `bun run verify` is the
  local equivalent. Don't use it as an inner loop.
