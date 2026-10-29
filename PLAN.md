# PLAN

Status: **research phase complete-ish, build not started.** This file holds the
things that are not yet code and not yet a durable ADR. Once an item is decided,
it becomes `kb/decisions/adr-*.md` and gets removed from here.

## Phase 0 — Knowledge (current)

- [x] Reverse-engineer the reference implementation → `kb/finding/tepez-form-runtime.md`
- [x] Exhaustive field spec (160 fields) → `kb/flow/form-101-field-spec.md`
- [x] Official PDF + explanatory notes extracted → `research/raw/law/`
- [ ] Law KB (`kb/law/`) — in progress, agent `law-101-a1`
- [ ] UX/a11y KB (`kb/ux/`) — in progress, agent `ux-a11y-b2`
- [ ] Engineering KB + spikes (`kb/eng/`) — in progress, agent `eng-stack-c3`
- [ ] Competitor teardown (`kb/competitor/`) — in progress, agent `teardown-d4`
- [ ] Field deep-dives (`kb/field/`) — orchestrator

## Phase 1 — Skeleton (after the four reports land)

- [ ] `bunx nuxi init` + `@nuxt/ui`, verified versions pinned (see `kb/eng/toolchain-versions.md`)
- [ ] RTL shell, Hebrew fonts self-hosted, design tokens
- [ ] The schema runtime: `relevant` / computed / validators as **data**, typed
- [ ] Draft persistence + versioned JSON export/import
- [ ] One section end-to-end (ב. פרטי העובד) as the vertical slice
- [ ] a11y CI (axe) + Playwright smoke test

## Phase 2 — Parity

- [ ] All 12 sections, all conditionals, all documents
- [ ] Error summary + focus management + keyboard map
- [ ] Print/PDF output
- [ ] Mobile pass, screen-reader pass (NVDA/VoiceOver Hebrew)
- [ ] Offline PWA + "your data is local" UX

## Phase 3 — Extras (not before parity)

- [ ] English UI
- [ ] Multi-year (previous tax year)
- [ ] Employer template links **without a server** (e.g. shareable config in the
      URL fragment / `.json` file the employer sends)
- [ ] Optional encrypted backup file

---

## Open questions (need a human decision)

_Resolved 2026-10-29 (ADR-0004): v1 = employee + employer prefill link (URL params, no server);
tax year 2026 only; Hebrew + English; private GH repo `chaim-chv/tofes101`._
Items O-3, O-4, O-5 and O-7 below are therefore closed. O-1, O-2 and O-6 remain open.

- **O-1 — PDF output fidelity.** The official blank form has no AcroForm. Options:
  (a) overlay text at fixed coordinates on the official 2-page PDF (looks
  identical to what an employer expects, but we must ship the official PDF and
  calibrate 160 coordinates); (b) render our own clean A4 layout that mirrors the
  official sections (more work to look legitimate, full control, no coordinate
  hell); (c) both — our layout for reading, overlay for the "official" copy.
- **O-2 — Address data.** City (≈1 300 values) is easy to bundle. Street names
  (≈100 k, and they change) are not. Options: (a) bundle cities + free-text
  street with a "please verify" note; (b) bundle a snapshot of the full street
  list (size?); (c) keep the remote autocomplete as an explicit, opt-in,
  privacy-warned feature; (d) drop the field (the paper form allows writing it by
  hand) and keep `city` + `street` as plain text.
- **O-3 — Which tax years.** 2026 only, or 2025 + 2026 with year-stamped rules?
- **O-4 — Employer side in v1.** Without emailing, "send a template to your
  employees" is impossible. Do we ship an employee-only v1, or also a
  "shareable `.json`/link config" that the employer sends manually?
- **O-5 — Language.** Hebrew only in v1, or Hebrew + English from day one
  (the competitor has a separate English form)?
- **O-6 — Signature.** Is a drawn signature enough for the employer, and do we
  need to print the declaration next to it? (Law agent is checking
  חוק חתימה אלקטרונית.)
- **O-7 — Repo destination.** Local only for now, or push to a GitHub repo?
