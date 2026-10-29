---
id: source/unicode-uax9-bidi
title: Unicode UAX #9 — Unicode Bidirectional Algorithm
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: Unicode Consortium
url: https://www.unicode.org/reports/tr9/
retrieved: 2026-10-29
tags: [bidi, unicode, hebrew, rtl, text-layout]
---

# UAX #9

The normative algorithm that turns a logical-order string (what the user typed)
into visual-order runs for display. Key properties used by this repo:

- Paragraph direction is explicit or derived; Hebrew defaults to RTL.
- Characters get embedding levels; **odd = right-to-left**, even = left-to-right.
- Numbers inside an RTL paragraph form an LTR run (level 2), which is why naive
  whole-string reversal displays `123` as `321`.
- Brackets are **mirrored** in RTL context (UAX #9 BD16 / rule L4), which is why
  parentheses must be swapped, not just repositioned.
- Rule L1 resets trailing whitespace to the paragraph level; whitespace handling
  is the usual source of "one missing space" bugs.

`bidi-js` 1.1.0 implements UAX #9 v13 and is what the PDF spike uses for levels,
reordering and mirroring.
