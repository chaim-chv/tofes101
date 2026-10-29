---
id: decision/adr-0006-navigation
title: ADR-0006 — Navigation model (8 steps, not one page, not 160 pages)
type: decision
status: verified
confidence: verified
updated: 2026-10-29
tags: [adr, navigation, wizard, ux]
sources: [source/govuk-question-pages, source/nng-web-form-design]
related: [ux/wizard-vs-long-page, flow/form-101-service, product/scope-v1]
up: ux/ux-principles
---

# ADR-0006 — Navigation model

**Date:** 2026-10-29 · **Status:** accepted

## Context

Three proposals were on the table: the reference's single 160-field scrolling page,
[a 5-step grouping](../../kb/product/scope-v1.md) (product track), and
[an 8-step wizard](../../kb/ux/wizard-vs-long-page.md) (UX track). All three are
defensible; shipping two is not.

## Decision

**8 steps + a review screen**, as specified in
[ux/wizard-vs-long-page](../ux/wizard-vs-long-page.md):

| # | step | visible fields |
| --- | --- | --- |
| 0 | מה זה, מה קורה לנתונים, כמה זמן זה לוקח | 0 |
| 1 | שנת מס + פרטי מעסיק | 3–6 |
| 2 | זהות (ת"ז/דרכון, שם, לידה, עלייה) | 5–8 |
| 3 | מגורים וקשר (ישוב, רחוב, מיקוד, טלפון, אימייל) | 5–7 |
| 4 | מעמד (מין, מצב משפחתי, תושבות, קיבוץ, קופ"ח) | 4–6 |
| 5 | ילדים (מדולג בהסבר למי שמזוהה בדרכון) | 1–10 |
| 6 | זיכויים, הכנסות אחרות, תיאום מס | 3–8 |
| 7 | סקירה — "הטופס כמו שיודפס" + עריכה לכל סעיף | 0 |
| 8 | הצהרה, חתימה, ייצוא | 1–2 |

Plus a read-only **full view** (`/review?all=1`) for users who want to see the whole
document at once, and for printing.

## Why

- 160 fields on one page fails on mobile, on screen readers, and on
  "where am I / what's left".
- Per-field steps would be 160 navigations; GOV.UK's "one thing per page" counts
  a *decision*, not a field.
- 8 steps is the largest grouping where every step fits on one phone screen at a
  time and still reads as one idea.

## Consequences

- Every step boundary is a save point (autosave, then navigate).
- Back/forward must work like the browser expects; no hijacking history.
- Section ז (changes during the year) is not a step — it is a note inside review.
- The URL must survive a reload mid-flow (`/form?step=4`), and a deep link to step
  4 must validate/queue steps 1–3 rather than dump the user in an invalid state.
- The employer prefill link lands on step 0 with the employer block already
  accepted (see [ADR-0005](./adr-0005-employer-prefill-link.md)).

## Revisit if

- Measured completion drops between two specific steps (split that step).
- A legally required field forces a step of its own (e.g. a new consent screen).
