---
id: source/mdn-visual-viewport
title: MDN — VisualViewport API
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: MDN Web Docs (Mozilla)
url: https://developer.mozilla.org/en-US/docs/Web/API/Visual_Viewport_API
retrieved: 2026-10-29
tags: [mobile, keyboard, viewport, js]
---

# VisualViewport

`window.visualViewport` exposes the actually-visible area, including the region
not covered by the on-screen keyboard. Events: `resize`, `scroll`.

Use it to:
- detect that the virtual keyboard opened (`visualViewport.height` shrinks a lot);
- hide the sticky bottom action bar while the keyboard is open, so it does not
  cover the focused field (WCAG 2.4.11);
- scroll the focused field into the visible area (`scrollIntoView({block:"center"})`
  after `visualViewport` settles).

Do not use `window.innerHeight` for this: on iOS it does not change when the
keyboard opens.

Related: [[ux/mobile-layout]].
