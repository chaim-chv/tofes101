---
id: source/govuk-dates
title: GOV.UK Design System — Dates pattern
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: UK Government Digital Service
url: https://design-system.service.gov.uk/patterns/dates/
retrieved: 2026-10-29
tags: [forms, ux, dates, govuk]
---

# Dates

- Ask for **day / month / year as three separate inputs**, not one free-text box
  and not a `<input type="date">` when the date may be far in the past (birth
  date) or must be typed quickly.
- Label the group with a `<fieldset>` + `<legend>` ("תאריך לידה"), label each
  input "יום", "חודש", "שנה"; use `inputmode="numeric"` and `autocomplete`
  (`bday-day`, `bday-month`, `bday-year`).
- Accept 1 or 2 digits for day/month; accept 2- or 4-digit year (normalise).
- Validate on submit, and echo the interpreted date back in the error
  ("התאריך 31/02/2026 אינו קיים").
- Native date pickers are acceptable for *scheduling* dates near today, not for
  birth dates or legal dates.

Related: [[ux/israeli-input-masking]], [[ux/mobile-layout]].
