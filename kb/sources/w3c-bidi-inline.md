---
id: source/w3c-bidi-inline
title: W3C i18n — Inline markup and bidirectional text in HTML
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: W3C Internationalization
url: https://www.w3.org/International/articles/inline-bidi-markup/
retrieved: 2026-10-29
verified_via: reader (r.jina.ai); curl gets Cloudflare 403
tags: [rtl, bidi, html, i18n, numbers]
---

# Inline bidi: IDs, phone numbers, emails, URLs

## What it establishes

- Problems occur when an opposite-direction phrase begins/ends with neutral
  characters, begins with a number, is followed by a number, or is followed by
  another opposite-direction phrase.
- Remedy: **tightly wrap every opposite-direction phrase** in an element with
  `dir` (and ideally `lang`), e.g.
  `<span dir="ltr" lang="en">name@example.com</span>`.
- Text inserted at runtime with unknown direction: `dir="auto"` or `<bdi>`.
- `&lrm;` / `&rlm;` fix spillover where markup is impossible (e.g. `<title>`,
  attribute values); `bdo` overrides the algorithm and is for edge cases only.
- Mirrored characters (parentheses, `<`, `>`) flip automatically; don't swap the
  characters themselves.
- In RTL, wraps are needed for: URLs, emails, phone numbers, IDs, Latin brand
  names, file paths, and any number adjacent to Hebrew punctuation.

Related: [[ux/bidi-mixed-content]], [[ux/israeli-input-masking]].
