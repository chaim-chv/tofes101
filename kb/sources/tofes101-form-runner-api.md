---
id: source/tofes101-form-runner-api
title: Reference form definition API (api.tepez.co.il)
type: source
confidence: verified
authority: secondary
publisher: Tepez Ltd (forms.tofes101.co.il)
url: https://api.tepez.co.il/v1.0/form/5a704edf239da27488a8cd9c/start?locale=he
retrieved: 2026-10-29
status: verified
tags: [source, reference-implementation, api]
---

# `GET /v1.0/form/5a704edf239da27488a8cd9c/start`

Public, unauthenticated JSON describing the whole "טופס 101" form as built by
the vendor (Tepez) for tofes101.co.il. 285 KB, Hebrew locale.

**Status at retrieval:** 200, `application/json`, no auth required.

**What it establishes:** the exact field list, order, labels, option sets,
required flags, conditional-visibility expressions, validator expressions,
computed-field equations, help texts, warnings, declaration text, and the
`_settings` knobs of the reference product. It is the structural basis of
[form-101-field-spec](../flow/form-101-field-spec.md).

**Caveats:**
- This is *one vendor's implementation* of the form, not the law. Values that
  matter legally (credit points, ages, thresholds, section numbering) must be
  checked against the official form + Tax Authority publications — see
  [form-101](../law/form-101.md).
- The reference form is labelled "מעודכן לשנת 2026" (updated for 2026) at
  retrieval time.
- `auxData` contains ad campaign and advertiser data; not needed by us.

**Local copies:** `research/raw/start.json`, extracted tree in
`research/raw/form/tree.json`.
