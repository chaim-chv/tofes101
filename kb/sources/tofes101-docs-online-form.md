---
id: source/tofes101-docs-online-form
title: tofes101.co.il/docs/online-form/ — how the online form behaves
type: source
status: verified
confidence: verified
authority: secondary
publisher: Tepez Ltd (tofes101.co.il)
url: https://tofes101.co.il/docs/online-form/
retrieved: 2026-10-29
tags: [source, competitor, docs, flow]
---

# `GET /docs/online-form/`

**Status:** 200, canonical `/docs/online-form/`.

**What it establishes (the only written spec of the post-form behaviour):**
- **Send by email**: after valid completion, "שלח באימייל" *inserts* the answers into
  the normal 101 PDF and emails it to employee + employer.
- **Errors block sending**: invalid ID or missing first name ⇒ error message, all
  offending fields marked red, cannot send until fixed.
- **Preview without sending**: save as PDF, or put your own address in both email
  fields so only you receive it.
- **Save as PDF**: possible any number of times, even with unanswered questions;
  fields filled *invalidly* are omitted from the PDF (e.g. a bad ID number simply
  does not appear).
- **Save as draft**: button at the bottom of the page; returns a link that "is like a
  password" — anyone with the link can open the form; long and unguessable; can be
  emailed to yourself; explicit warning not to send the draft link to the employer.

**Local copies:** `research/raw/site/docs_online-form.{html,txt}`.
**Node:** [competitor/flow-employee](../competitor/flow-employee.md).
