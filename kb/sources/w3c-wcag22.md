---
id: source/w3c-wcag22
title: WCAG 2.2 — W3C Recommendation (12 Dec 2024)
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: W3C / WAI
url: https://www.w3.org/TR/WCAG22/
retrieved: 2026-10-29
tags: [accessibility, wcag, standard]
---

# WCAG 2.2

Normative text. WCAG 2.2 is additive over 2.0/2.1: content conforming to 2.2
conforms to 2.0 and 2.1, except that **4.1.1 Parsing is obsolete and removed**.
Conformance requires *full pages* and *complete processes* — a form that is only
accessible on some steps fails.

Key criteria for this product (paraphrased; always test against the normative text):

| SC | Level | Requirement that bites here |
| --- | --- | --- |
| 1.3.5 Identify Input Purpose | AA | `autocomplete` tokens for user data |
| 1.4.10 Reflow | AA | usable at 320 CSS px / 400% zoom, no 2-D scroll |
| 2.1.1 / 2.1.2 | A | everything keyboard-operable, no traps |
| 2.1.4 Character Key Shortcuts | A | single-key shortcuts must be remappable/disable-able or focus-scoped |
| 2.4.3 Focus Order | A | DOM order = meaningful order |
| 2.4.7 Focus Visible | AA | visible focus |
| 2.4.11 Focus Not Obscured (Min) | AA | sticky bars must not fully cover the focused control |
| 2.5.8 Target Size (Min) | AA | ≥24×24 CSS px, or sufficient spacing |
| 3.3.1 Error Identification | A | errors described in text |
| 3.3.3 Error Suggestion | AA | say how to fix it |
| 3.3.7 Redundant Entry | A | don't ask twice; auto-populate or offer selection |
| 3.3.8 Accessible Authentication | AA | no cognitive test (relevant if we ever add an account) |
| 4.1.3 Status Messages | AA | announce async status without moving focus |

Related: [[ux/a11y-is5568-vs-wcag22]], [[source/w3c-wcag22-whats-new]].
