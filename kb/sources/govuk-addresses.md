---
id: source/govuk-addresses
title: GOV.UK Design System — Addresses pattern
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: UK Government Digital Service
url: https://design-system.service.gov.uk/patterns/addresses/
retrieved: 2026-10-29
tags: [forms, ux, address, autocomplete, govuk]
---

# Addresses

- Prefer a **postcode/street lookup** with manual entry as fallback; never force
  a lookup that can fail.
- Manual entry uses separate labelled fields: address line 1, line 2 (optional),
  town/city, postcode. Each has its own `autocomplete` token
  (`address-line1`, `address-line2`, `address-level2`, `postal-code`).
- Put the **country** field last and only when needed; `autocomplete="country-name"`.
- Don't validate that an address "exists" — only that required parts are present.
- Let users paste a whole address into line 1.

For Israel, the equivalent is city autocomplete + street scoped by city
(see [[ux/israeli-input-masking]]); the pattern (lookup first, manual fallback,
never block) transfers.

Related: [[ux/autofill-tokens]], [[ux/validation-and-errors]].
