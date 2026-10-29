---
id: decision/adr-0004-v1-scope
title: ADR-0004 — v1 scope, tax year, languages, delivery
type: decision
status: verified
confidence: verified
updated: 2026-10-29
tags: [adr, scope, product]
sources: []
related: [product/scope-v1, flow/form-101-service, index]
up: product/scope-v1
---

# ADR-0004 — v1 scope

**Date:** 2026-10-29 · **Status:** accepted (user decision)

## Context

The reference product has two sides — an employee filling the form, and an
employer creating a "send to my employees" template link and receiving the
filled forms by email. We are building a browser-only app with no server, so
"the employer receives the form" cannot be a server feature.

## Decisions

1. **v1 = employee form + an employer prefill-link generator.**
   - The employer gets a small screen ("פרטי המעסיק") that produces a **URL**
     carrying the employer block in its parameters (and/or `#` fragment), plus a
     downloadable `.json` of the same payload.
   - The employee opens the link: employer fields arrive pre-filled, marked
     `locked by employer` when the employer chose to lock them, and editable
     otherwise.
   - **No emailing, no upload, no dashboard, no accounts.** The employee's
     answers never travel anywhere; only static employer data travels in the URL.
   - Consequences: the payload must be small, human-inspectable, versioned, and
     must never contain employee data. A signature/checksum is unnecessary
     (it is not a trust boundary) but a `v` field and an issuer name are.
2. **Tax year: 2026 only at launch.** One rules file
   (`app/data/rules/2026.json`); years are data, not code. 2027 is a later data
   addition, not a refactor.
3. **Hebrew + English from day one.** Single schema, i18n message catalogs, RTL
   and LTR layouts. Legal wording is reviewed in Hebrew first, then translated;
   the declaration must exist in both and record which wording was signed.
4. **Repository:** private GitHub `chaim-chv/tofes101`, branch `main`.

## Consequences

- We do **not** need a backend, a database, or auth — the whole privacy claim
  stays provable.
- The employer flow becomes a *link builder*, which is a much smaller surface
  than the reference's template + email pipeline; it also means employees can't
  accidentally send their data to the employer through us (they hand over the
  PDF).
- English support raises the bar on the schema: no Hebrew-string casts inside
  validation messages; all messages are keys.
- The URL payload must be designed carefully (see
  [eng/architecture](../eng/architecture.md)): prefer `#` over `?` so the data
  never reaches a server log if we are ever hosted with analytics/CDN, and
  support a `.json` file for payloads that outgrow a URL.

## Revisit if

- Users ask for "send it directly to my employer" (⇒ needs a transport story).
- A tax year rolls over (⇒ add a rules file, keep 2026 selectable for late
  filing if the law requires it).
- The employer link payload needs to carry more than ~2 KB of data.
