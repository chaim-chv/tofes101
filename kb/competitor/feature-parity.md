---
id: competitor/feature-parity
title: Feature parity — what they have, what we build, where we win
type: finding
status: verified
confidence: verified
updated: 2026-10-29
tags: [competitor, parity, scope, product]
sources: [source/tofes101-itc101-landing, source/tofes101-itc101-employer-landing, source/tofes101-form-runner-api, source/tofes101-docs-online-form, source/tofes101-engine-bundle]
related: [product/scope-v1, competitor/flow-employee, competitor/flow-employer, competitor/site-map]
up: index
---

# Feature parity

Legend — **Them**: does the live product do it (✔ / ~partial / ✘). **Us v1**: do we ship it
in the browser-only v1 (✔ / ~reduced / ✘). **Δ**: what our version is, in one line. A ✔→✔
is table stakes; the interesting rows are ✔→~ and ✔→✘ with a reason.

Scoring rule used below: a row counts as **matched** if the user can complete the same job
end-to-end, even by a different mechanism. It counts as **lost** only if the job becomes
impossible.

## A. Employee side

| # | Feature | Them | Us v1 | Δ / our improvement |
| --- | --- | --- | --- | --- |
| A1 | Form 101 in Hebrew, RTL, on one page | ✔ | ✔ | same job, but **stepped** (5 steps) with progress + "jump to section" — see [product/scope-v1](../product/scope-v1.md) |
| A2 | Conditional sections (spouse, children, passport branch, income) | ✔ | ✔ | same logic; keep answers when a branch closes (`clearIrrelevant` is a data-loss bug) |
| A3 | Validation with per-field errors | ✔ | ✔ | + inline error summary with anchor links + validate-on-step, not on submit |
| A4 | ID/passport switching, Luhn check, ages derived | ✔ | ✔ | reuse the extracted rules; no change to correctness |
| A5 | Children repeater with age bands | ✔ | ✔ | + show the derived credit count live ("3 children → X points") |
| A6 | Auto-computed values (ages, counts, dates) | ✔ | ✔ | visible "how we got this number" per computed value |
| A7 | Signature by mouse/finger | ✔ | ✔ | + stroke smoothing, undo, "sign on paper and photograph" fallback (v1.1) |
| A8 | In-form help bubbles + links to explanations | ✔ | ~ | we write our own 1–3 sentence help, **in the app**, no outbound link in the middle of a form |
| A9 | Attach documents (PDF/JPG/PNG, up to N files) | ✔ | ~ | **ZIP package**: filled PDF + attachment files, downloaded together; cannot embed into the PDF as attachments |
| A10 | Download filled PDF (standard-looking 101) | ✔ | ✔ | our own print layout (official PDF has no form fields); A4, RTL, page numbers |
| A11 | Download PDF even if incomplete | ✔ | ✔ | but we **refuse to silently drop invalid values** — we list what is missing on a cover page |
| A12 | Print | ~ (print the PDF) | ✔ | dedicated print stylesheet; no PDF reader needed |
| A13 | Email to employee + employer | ✔ | ✘ | **not in v1**: download + OS share sheet (files) + "send it yourself" instructions; no server, no address stored |
| A14 | Save draft | ✔ (server link) | ~ | **local draft** in IndexedDB, resumes on the same device; plus "export/import draft file" for device change. No bearer link |
| A15 | Resume on another device | ✔ (link) | ~ | via exported draft file (user moves it themselves) |
| A16 | No account / no signup | ✔ | ✔ | same, and no email field required at all |
| A17 | Works on mobile | ✔ | ✔ | mobile-first, sticky step nav, native date inputs |
| A18 | English version | ✔ (separate form) | ✘ v1 | i18n later; do not fork the schema |
| A19 | Tax-year selection (Dec/Jan rules) | ✔ | ✔ | same rule, with a visible year badge everywhere |
| A20 | Privacy/terms acceptance | ✔ | ✔ | one short, plain-language line; no second "may we sell your data" radio |
| A21 | "What happens next" after submit | ~ (email is the archive) | ✔ | explicit screen: what you got, what to hand over, what to keep, how to file a correction |
| A22 | Review before output | ~ (the PDF *is* the review) | ✔ | real review screen with per-section edit links + "3 things to check" |
| A23 | Several employers | ✘ (FAQ unanswered) | ~ | duplicate-answer flow for a second employer (same data, new employer block) |
| A24 | Fix a mistake after sending | ✘ (FAQ unanswered) | ✔ | "start a correction" from the saved draft, marked as a replacement |
| A25 | Ads | ✔ | ✘ | none, by design |
| A26 | Data-sharing consent | ✔ (required) | ✘ | concept does not exist |

**Section A: 19 matched / 4 reduced / 3 lost-as-designed** (email, English, ads).
The three losses are the ones we argue about in public, and two of them are features.

## B. Employer side

| # | Feature | Them | Us v1 | Δ / our improvement |
| --- | --- | --- | --- | --- |
| B1 | Landing page explaining the employer offer | ✔ | ✔ | shorter, states the limitation up front ("we never collect the forms") |
| B2 | Template builder: org block (name, address, phone, deduction file no.) | ✔ | ✔ | same fields, validated (9-digit file no. starting with 9) |
| B3 | Lock the employer block for employees | ✔ | ✔ | same, and the lock is visible ("pre-filled by your employer") |
| B4 | Receiving email hard-coded in the link | ✔ | ✘ | **no email at all**; instead an optional "return instructions" line the employee sees |
| B5 | Employee-email required/optional toggle | ✔ | ~ | we never require an email; toggle is irrelevant |
| B6 | Employer logo on form + PDF | ✔ | ~ | v1: employer name text + optional logo uploaded locally (session only) |
| B7 | Appendix toggles (bank details, army/national-service permits, minor's medical certificate) | ✔ | ✔ | same toggles; each shows what document is being asked for and why |
| B8 | Income-type pre-fill + lock | ✔ | ✔ | same |
| B9 | Tax-coordination warning level (error/warn/none) | ✔ | ✔ | same three levels, with our own wording |
| B10 | Teen credit-point warning | ✔ | ✔ | same |
| B11 | Shareable link | ✔ | ✔ | **link with the whole template in the URL fragment** (no storage, no expiry, no account) |
| B12 | Link works on WhatsApp/SMS | ✔ | ✔ | + a "copy message" helper with the link and a 2-line instruction in Hebrew |
| B13 | Receive signed PDFs by email | ✔ | ✘ | employee returns the file (download/share/print); employer gets nothing automatically |
| B14 | Track who submitted | ✘ | ✘ | we deliberately do not want the list |
| B15 | Edit a template after sharing | ✘ | ✔ | generate a new version from the same settings; old links keep working |
| B16 | One link for 101 + bank details | ✔ (toggle) | ~ | v1: 101 only; the mechanism supports a second form later |
| B17 | Upsell into an HR SaaS | ✔ (required radio) | ✘ | nothing to upsell |

**Section B: 9 matched / 3 reduced / 3 lost** (email delivery, tracking, upsell).
B13 is the structural one: without a server we cannot be the recipient. Everything else
is a configuration surface we can clone in a week.

## C. Cross-cutting

| # | Feature | Them | Us v1 | Δ |
| --- | --- | --- | --- | --- |
| C1 | Free | ✔ (ad/data funded) | ✔ (no marginal cost) | same word, different economics |
| C2 | No signup | ✔ | ✔ | — |
| C3 | Hebrew RTL, Heebo-like type | ✔ | ✔ | — |
| C4 | Accessibility claim (AA) | ✔ claimed | ✔ tested | publish method + known gaps, not just a claim |
| C5 | Third-party scripts | ✔ 6+ | ✘ 0 | verifiable in DevTools |
| C6 | Content hub (guides) | ✔ 21 pages | ~ 7 pages v1 | narrower but year-stamped and cross-linked into fields |
| C7 | Calculators | ✔ 4 | ~ 1 (VAT) | only where we can be correct and liable-free |
| C8 | English | ✔ | ✘ | later |
| C9 | Other forms (119, 1516, bank, 20 more) | ✔ | ✘ | v1 is 101 only; architecture is multi-form |
| C10 | Offline capability | ~ (SPA caches) | ✔ | installable PWA, works with Wi-Fi off — our privacy proof *and* a feature |

**Section C: 6 matched / 2 reduced / 2 lost.**

## D. Where we clearly beat them (the three arguments)

1. **Privacy that is architectural, not promised.** No server, no cookies, no scripts,
   no data-sharing radio. Their FAQ says the form was built as a marketing tool and that
   they sell data with consent; our answer is "there is nothing to sell because nothing
   arrives". Verifiable in the Network tab. This is the only argument that needs no
   marketing budget.
2. **The form knows what it is doing.** Theirs validates only at submit, drops invalid
   values from the PDF silently, has no progress model, and pushes explanations to an
   external site. Ours: 5 steps with progress, live computation ("3 children → 3.5
   points"), a real review screen, an error summary that jumps to the field, and help
   written *for this field* in the app.
3. **Owned content loop.** Their 21 guide pages never link into the exact field they
   explain; ours do, so the guide is the onboarding and the form is the payoff. Plus: no
   2016 numbers on a 2026 page, and answers to the 12 FAQ questions they left empty.

## E. What we must not pretend

- We cannot deliver a signed PDF **to the employer**. Any comparison table that implies
  otherwise is a lie that will surface on the first support ticket.
- We do not replace the Tax Authority's own online coordination system, and we do not
  produce a "legally valid electronic signature" in the e-signature-law sense — we
  produce a signed *image* on a PDF, exactly like they do.
- We do not know whether an employer will accept a printout; that is the employer's call,
  and our copy has to say so.
- One form, one year, one language in v1. Saying "we do 101 properly" is stronger than a
  grid of 24 half-forms.
