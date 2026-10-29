---
id: source/govuk-error-summary
title: GOV.UK Design System — Error summary component
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: UK Government Digital Service
url: https://design-system.service.gov.uk/components/error-summary/
retrieved: 2026-10-29
tags: [forms, ux, errors, govuk]
---

# Error summary

## What it establishes

- On submit failure, show a summary **above the `<h1>`/main content**, listing
  every error as a link to the offending field.
- The summary heading is the page focus target on load (`tabindex="-1"`), so the
  screen reader starts at the list.
- Each error link moves focus to the field, not just scrolls.
- The page `<title>` should be prefixed with "Error:" / "שגיאה:".
- The summary must be **in addition to**, not instead of, the inline message next
  to each field.
- Errors are written as instruction ("Enter your date of birth"), not as
  scolding ("You did not enter…").
- Show the summary only after a submit attempt; do not announce errors while the
  user is still typing the first time through.

Related: [[ux/validation-and-errors]], [[ux/live-announcements]].
