---
id: source/govuk-question-pages
title: GOV.UK Design System — Question pages pattern
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: UK Government Digital Service
url: https://design-system.service.gov.uk/patterns/question-pages/
retrieved: 2026-10-29
tags: [forms, ux, pattern, govuk]
---

# One question per page

Establishes (directly from the pattern):

- Ask **one question per page** where possible; set the page `<h1>` to the
  question, with the input labelled by it, so screen readers hear it once.
- Mark **optional** fields with "(optional)"; required is the default.
- Don't ask for the same information twice in a journey; carry answers forward
  or let the user select a previous answer.
- Provide a **Back** link at the top of the question page, and never break the
  browser Back button; restore the previous page in the state the user left it.
- Only ask what you need, and make clear **why** each question is asked.
- Allow "I don't know" / "not sure" when that is a valid answer.
- Don't reuse the same page heading for different questions.

Related: [[ux/wizard-vs-long-page]], [[ux/required-optional-conditional]].
