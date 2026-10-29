---
id: decision/adr-0007-single-route
title: ADR-0007 — One form route, steps as state
type: decision
status: verified
confidence: verified
updated: 2026-10-30
tags: [adr, routing, pwa, offline, navigation]
sources: []
related: [decision/adr-0006-navigation, eng/offline-pwa, decision/adr-0004-v1-scope]
up: product/scope-v1
---

# ADR-0007 — One form route, steps as state

**Date:** 2026-10-30 · **Status:** accepted (implemented)

## Context

[ADR-0006](./adr-0006-navigation.md) fixed *how many* steps the form has (10 in the
implementation: intro, employer, identity, contact, status+spouse, children,
income, credits+coordination, review, sign). It did not say whether each step is a
route or a piece of state.

The PWA spike found that per-step routes break offline reloads: the service
worker precaches `form` (no trailing slash) while a deep link asks for
`/form/step-3`, so `navigateFallback` serves `/` and the user loses their place.

## Decision

**One route: `/form`.** The current step lives in `meta.step`, mirrored to
`?step=N` with `history.replaceState`.

Consequences:

- Browser *back* leaves the form (it does not walk steps backwards) — the in-page
  "back" button is the step navigation, which is what users expect from a wizard
  but not from a browser.
- Deep link `?step=6` is validated: `resolveEntryStep` sends the user to the first
  step with errors instead of dropping them into an invalid state.
- Reload restores the exact step from the URL, then verifies it is reachable.
- The offline fallback needs exactly one entry point.
- The employer prefill payload stays in the fragment (`#e=…`) and is captured by
  an inline head script before the router touches the history entry.

## Alternatives rejected

- **A route per step** (`/form/identity`): better shareability, but ten prerendered
  routes, ten offline entries, and history semantics that fight the wizard.
- **Query-only** (`/form?step=3`) without state mirroring: a reload loses the step
  because the store hydrates after mount.

## Revisit if

- Steps become individually linkable for support purposes (then add a
  read-only `/form/view?step=N` that redirects into the app).
