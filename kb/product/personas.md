---
id: product/personas
title: Personas — who fills this form, and where the current product hurts them
type: concept
status: draft
confidence: likely
updated: 2026-10-29
tags: [product, personas, jtbd, ux]
sources: [source/tofes101-docs-faq, source/tofes101-itc101-landing, source/tofes101-docs-online-form, source/tofes101-docs-tax-adjustment, source/tofes101-itc101-employer-landing]
related: [product/scope-v1, competitor/feature-parity, competitor/flow-employee, competitor/flow-employer]
up: index
---

# Personas

Five personas derived from the *observed* friction of the reference product — the
unanswered FAQ items, the help bubbles, the validators, and the employer docs — not from
demographics. Each has: the job, the moment, the friction (with evidence), and what a
browser-only 101 must do for them.

| # | Persona | One-line job | Primary risk for us |
| --- | --- | --- | --- |
| P1 | העובד/ת החדש/ה | "get this done before payroll closes" | abandonment (long form, no progress) |
| P2 | ההורה | "claim the children correctly" | wrong credit → real money lost |
| P3 | המעסיק הקטן | "collect from everyone by January" | our no-email model is a dealbreaker |
| P4 | העולה/התושב החוזר | "which credits apply to me?" | language + documents from abroad |
| P5 | המתאם מס | "don't let them withhold 48 %" | misinformation, late discovery |

## P1 — "העובד/ת החדש/ה" (the new hire)

**Context.** 22–32, starting a job or changing one, filling 101 for the first time (or
the first time in years). On a phone, in the evening, because HR asked. Has the ID number
and maybe a photo of the ID; does not have the employer's deduction file number, does not
know what "משרה נוספת" means for them.

**Jobs to be done**
1. Produce a 101 the payroll person will accept, without asking three questions in the
   office group chat.
2. Understand in 30 seconds whether "משכורת חודש" or "שכר עבודה" applies to them.
3. Stop and come back later when a document is missing.

**Friction (evidence).** The FAQ's first employee question is *"הישוב/רחוב שלי לא מופיעים
במאגר"* and there is a second one shouting *"חסרים לכם מלא ישובים/רחובות!"* — the address
autocomplete fails them and the answer is empty. *"אני לא יודע מהי כתובת האימייל של
המעסיק"* is unanswered too, yet the product **requires** an email to send. And
*"אני מעדיף/ה למלא את הטופס על נייר"* is a question they never answered — i.e. a share of
this persona does not want the digital product at all.

**Drop-off point.** The bottom action bar: 10 panels, no progress, no "2 of 5", then a
validation wall. Their docs describe the moment precisely — you press send and every
offending field turns red.

**What v1 must do.** 5 steps with a visible count; plain-Hebrew help on income types
(with a worked example, "if you work 5 days a week and get a fixed monthly amount → month
salary"); address free-text fallback with a "we'll flag it" note; draft that survives a
refresh without a link; and **no email field at all**.

## P2 — "ההורה" (the parent claiming children)

**Context.** 33–45, 2–3 children, married or separated, filling the form at the start of
the tax year. Knows children give credit points, does not know there are **two different
child blocks** on the form (items 7 and 8), that the age bands changed, or that a
separated parent may need a court judgment.

**Jobs to be done**
1. Get the maximum child credit they are legally entitled to, without over-claiming.
2. Know exactly which documents to attach (and which of them they already sent last year).
3. Do it once, correctly, so payroll does not come back with questions.

**Friction (evidence).** This is the deepest content on the competitor's site (the
`children` guide is 894 words, the longest child page) *and* the most conditional part of
the form: item 7 vs item 8 have mutually exclusive validators ("ניתן לסמן רק אם…" with
4-condition lists), item 6 is blocked for married users, item 11 needs a National
Insurance certificate, item 10 needs a judgment. Their own attachment guide warns that
attachments are embedded in the PDF and **Chrome cannot display PDF attachments** — so a
parent who checks their file in the browser may think the certificate is missing.
The FAQ has an unanswered *"קובץ שצרפתי לא הופיע ב-PDF"* — exactly this failure.

**Drop-off point.** Section ח, item 7/8: two checkboxes with legal conditions inside the
validator messages (only shown *after* a failed attempt). Then the appendix.

**What v1 must do.** Show the derived count live ("3 ילדים בשנת המס: 2 בחזקתך → X נקודות"),
explain 7 vs 8 in one sentence each at the point of choice, list required documents *before*
the upload, and produce a cover page that enumerates what was attached and what is missing
— never silently drop a file.

## P3 — "המעסיק הקטן" (the SMB owner / office manager)

**Context.** 8–80 employees, no HR system, doing January onboarding in a spreadsheet.
Sends links on WhatsApp. Their own frustration is chasing people and re-typing email
addresses.

**Jobs to be done**
1. Get a signed, correct 101 from every employee without a login or a purchase.
2. Make it impossible for the employee to send the form to the wrong address.
3. Not become the custodian of 60 PDFs in an inbox.

**Friction (evidence).** Their employer FAQ asks *"איך מעדכנים פרטי המעסיק / כתובת דוא״ל
בטופס שיצרתי?"* — **no answer published**, because the template is baked into a link.
Change your finance address and every previously shared link keeps emailing the old one.
The employer docs also warn that a WhatsApp link is only tappable if the sender's number
is in the employee's contacts — a distribution failure they document instead of solving.
And the builder contains a **required** radio for the עובדיםIO upsell before you can
finish: the "free tool" is a lead form.

**Drop-off point.** The moment they realise there is no dashboard and no "who hasn't
submitted". Their product answers that with "search your inbox".

**What v1 must do.** Generate the link locally in one screen; make the org block visibly
locked ("מולא מראש על ידי המעסיק"); give a copy-paste WhatsApp message in Hebrew; and
state the limitation in the first screen (we never collect the forms). If P3 rejects
that, the product owner must decide between a backend and an employee-only v1 — see
[product/scope-v1](scope-v1.md) O-1.

## P4 — "העולה החדשה / התושב החוזר" (new immigrant / returning resident)

**Context.** Arrived in the last 1–4 years, works in tech or services, Hebrew is a second
language, holds certificates issued abroad or by the absorption ministry. Entitled to a
large, time-limited credit they may not know exists.

**Jobs to be done**
1. Find out whether the oleh/returning-resident credit applies and for how many months.
2. Fill the form in a language they can check, without switching to a separate product.
3. Know which certificate to attach and what happens if it is in English.

**Friction (evidence).** The English offering is a **separate form** at
`/fill-form-101-english/` (a different form id), so it drifts from the Hebrew one and the
guides are Hebrew-only. The oleh section requires an oleh certificate and a "no income in
Israel until" date, with the caveat that non-continuous eligibility must go to the
assessor. Meanwhile their `newcomer`/`returning-resident` guides are 446/474 words with
2016-era numbers — the exact content this persona needs, frozen in time.

**Drop-off point.** Section ח item 4, when the certificate is not in Hebrew and the
help text points to kolzchut in Hebrew.

**What v1 must do.** One schema with a language toggle (labels + help, values stay
canonical); the oleh/returning-resident branch explaining the *date* logic with the
current year's rule; and an explicit "documents in another language" note.

## P5 — "המתאם מס" (the person who will be taxed 48 %)

**Context.** Two jobs, or a gap in the year (army, travel, unemployment), or a spouse
starting work. Does not know that the second employer must withhold at the maximum rate
unless coordination exists.

**Jobs to be done**
1. Avoid the maximum withholding without hiring an accountant.
2. Choose the right coordination route (employer / online / assessor / representative).
3. Assemble the evidence (payslips, absence proof) before the first payslip.

**Friction (evidence).** The form does warn — the schema has a `taxCoordinationWarning`
setting with three levels (error / warn / none, default warn) and long alert texts
("אחרת יורד מהשכר שלך מס בשיעור מירבי (כ-48%)"). But the warning appears **inside section
ד/ה**, after the user has already chosen an income type, and the `tax-adjustment` guide
that explains it is a separate page the form never links to. Their guide also states the
limits the form does not: only the *primary* employer can apply credit points, and the
employer may **refuse** to do the coordination at all.

**Drop-off point.** The alert arrives as a wall of text mid-form, with a link to a
different site; the user clicks away and never comes back.

**What v1 must do.** Detect the coordination case as early as possible (income type /
"other income" / start date) and turn it into an explicit branch with 3 choices and a
checklist; keep the 48 % consequence in one bold sentence; and deep-link to our own guide
section, in-app, with a back button that returns to the exact field.

## Who we are *not* building for (v1)

- **The tax professional** who needs bulk, exports and audit trails. They have tools.
- **The employer with 500 employees** — they need an HR system, not a link.
- **The family-law client** (child support, long-term care) — different legal domain.
- **The person who wants paper.** They should download the official blank PDF; we should
  link to it, honestly, from the landing page.

## How personas change the build

| Persona | Drives |
| --- | --- |
| P1 | wizard + progress + draft without links + no email field |
| P2 | live credit computation + document checklist + cover page |
| P3 | employer template in the URL + copy-message helper + honest limitation |
| P4 | single-schema i18n + date-based credit logic + foreign-document note |
| P5 | early coordination branch + in-app guide deep links |

The common thread: **the reference product explains things outside the form.** Every
persona's friction is a link to kolzchut, an unanswered FAQ entry, or a 2016 guide. The
cheapest real improvement is to put the explanation at the field, in one sentence, and
keep the long version one click away *inside* the app.
