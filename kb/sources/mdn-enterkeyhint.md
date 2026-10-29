---
id: source/mdn-enterkeyhint
title: MDN — HTML enterkeyhint attribute
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: MDN Web Docs (Mozilla)
url: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/enterkeyhint
retrieved: 2026-10-29
tags: [forms, mobile, keyboard, html]
---

# enterkeyhint

Changes the mobile virtual keyboard's Enter key label/icon without changing
behaviour. Values: `enter | done | go | next | previous | search | send`.

Use on multi-field steps:
- intermediate fields → `enterkeyhint="next"`
- last field of a step → `enterkeyhint="go"` (advance step)
- dialogs / search → `search` or `done`
- `<textarea>` → leave default (`enter` = newline)

Caveat: the hint is a *label*, not a contract. The JS must still handle Enter
correctly, and must not hijack Enter while an autocomplete listbox is open.

Related: [[ux/mobile-layout]], [[ux/keyboard-model]].
