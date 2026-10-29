---
id: source/w3c-bidi-structural
title: W3C i18n — Structural markup and right-to-left text in HTML
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: W3C Internationalization
url: https://www.w3.org/International/questions/qa-html-dir
retrieved: 2026-10-29
tags: [rtl, bidi, html, i18n]
---

# dir at the structural level

## What it establishes

- Put `dir="rtl"` on `<html>`; also set `lang="he"`. Language ≠ direction —
  declare both.
- Below `<html>`, use `dir` only when the base direction must change.
- **Never use CSS to set base direction**; use logical CSS properties
  (`margin-inline-start`, `text-align: start`, `inset-inline`, …).
- `dir="auto"` on inputs/textareas for user-supplied text of unknown direction;
  `dirname` to persist the resolved direction.
- With `dir="rtl"`, form inputs start at the right, punctuation and table column
  order flip automatically.
- `dir=auto` is not foolproof for lines starting with neutral/numeric content.
- Browser-specific manual direction keys exist (Chrome/Safari context menu,
  Firefox Ctrl/Cmd+Shift+X) — not something to rely on.

Related: [[ux/rtl-foundations]], [[source/w3c-bidi-inline]].
