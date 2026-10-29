---
id: source/mdn-inputmode
title: MDN — HTML inputmode attribute
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: MDN Web Docs (Mozilla)
url: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode
retrieved: 2026-10-29
tags: [forms, mobile, keyboard, html]
---

# inputmode

Values: `none | text | tel | url | email | numeric | decimal | search`.

For this product:
- **ID / phone / postcode / date parts** → `inputmode="numeric"` (digits-only
  keypad) on `type="text"`, *not* `type="number"`.
- **Money** → `inputmode="decimal"`.
- **Email** → `type="email"` (gives `@`/`.` on mobile) + `inputmode="email"`.
- `type="number"` is for spinners/step semantics, and brings problems: scroll
  wheel changes values, `e`/`+`/`-` accepted, leading zeros and long digit strings
  can be mangled, and some AT announces it as a spinbutton. Avoid it for
  identifiers and phone numbers.

Related: [[ux/autofill-tokens]], [[ux/israeli-input-masking]], [[ux/mobile-layout]].
