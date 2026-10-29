---
id: source/mdn-autocomplete
title: MDN — HTML autocomplete attribute (token list)
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: MDN Web Docs (Mozilla)
url: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete
retrieved: 2026-10-29
tags: [forms, autofill, html, wcag]
---

# autocomplete tokens

The token list WCAG 1.3.5 (Identify Input Purpose) is tested against. Tokens we
need for 101:

| Field | Token |
| --- | --- |
| first name | `given-name` |
| last name | `family-name` |
| full name | `name` |
| national ID | (no standard token) — use `autocomplete="off"` + `inputmode="numeric"` |
| birth day/month/year | `bday-day`, `bday-month`, `bday-year` (or `bday` on a single field) |
| sex | `sex` |
| phone (mobile) | `tel` or `tel-national` |
| email | `email` |
| street | `address-line1` |
| city | `address-level2` |
| postcode | `postal-code` |
| country | `country-name` |
| organisation | `organization` |

Notes:
- `sex` is the HTML token for sex; `gender` also exists but is not the token
  WCAG lists for "sex".
- Do **not** put `autocomplete` on fields where a wrong autofill is dangerous and
  unverifiable (ID number) — but do keep `inputmode` and a clear label.
- Browser autofill of addresses is unreliable in Israel; treat it as a bonus, and
  keep a manual path.

Related: [[ux/autofill-tokens]], [[source/mdn-inputmode]].
