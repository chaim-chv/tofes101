---
id: source/govuk-names
title: GOV.UK Design System — Names pattern
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: UK Government Digital Service
url: https://design-system.service.gov.uk/patterns/names/
retrieved: 2026-10-29
tags: [forms, ux, names, govuk]
---

# Names

- Ask for **full name in one field** only when you don't need the parts; for 101
  we do need first/last (the form has both), so ask exactly two fields.
- Don't restrict characters, don't force Latin letters, allow hyphens, apostrophes,
  spaces, and any Unicode letter. Never title-case or "fix" the user's name.
- Accept names of any length (set a generous `maxlength`, e.g. 100, or none).
- Don't ask for a title (מר/גב') unless it changes an outcome; it forces a gender
  choice before the user has context.

Related: [[ux/autofill-tokens]], [[ux/hebrew-microcopy]].
