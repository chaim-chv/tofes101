---
id: product/scope-v1
title: Scope v1 — browser-only 101 (no emailing), derived from parity
type: decision
status: draft
confidence: likely
updated: 2026-10-29
tags: [product, scope, v1, decision]
sources: [source/tofes101-itc101-landing, source/tofes101-itc101-employer-landing, source/tofes101-docs-online-form]
related: [competitor/feature-parity, product/personas, competitor/flow-employee, competitor/flow-employer, flow/form-101-service, index]
up: index
---

# Scope v1

Status: **proposal**, for the product owner to accept or cut. Derived from
[competitor/feature-parity](../competitor/feature-parity.md) under one hard constraint:
**the app is static files in a browser; nothing the user types is ever sent anywhere, and
v1 does not send email on the user's behalf.**

## 1. Positioning (one sentence, to be tested)

> טופס 101 שממלאים פעם אחת, חותמים, ומורידים כקובץ — בלי הרשמה, בלי פרסומות, ובלי שאף
> שרת יראה את הפרטים שלך.

The wedge is not "free" (they are free) and not "faster" (they are fast). It is **"nobody
receives your data, and you can prove it"** — the one claim a static app can make and a
server-side form business cannot.

## 2. Jobs in scope

| # | Job | Done when |
| --- | --- | --- |
| J1 | Fill a correct 101 for the current tax year | every required field valid, conditional logic applied, no silent gaps |
| J2 | Claim the credits the user is entitled to | the 16 section-ח items behave per law, with the documents listed |
| J3 | Sign and produce a file the employer will accept | A4 PDF, RTL, standard 101 layout, signature + date, cover page of attachments |
| J4 | Not lose work | survives refresh, tab close, and (via export) device change |
| J5 | Know what to do next | explicit "what you got / what to hand over / how to fix a mistake" screen |
| J6 | (Employer) hand employees a pre-filled link | link generated locally, org block locked, no collection |

## 3. In scope — v1 (MUST)

1. **One form: 101, current tax year.** Tax-year selection with the Dec/Jan rules.
2. **10 lettered sections**, conditionals and validators per
   [flow/form-101-service](../flow/form-101-service.md). No ads, no ad panel, no
   marketing-consent radio, no data-sharing anything.
3. **5-step wizard** (identity+employer / family / income / credits / sign & output) with
   progress, "jump to section", and a resume prompt. Section ז ("changes during the year")
   is an explanation, not fields.
4. **Live computation** surfaced to the user: age at tax year, child counts per band,
   derived credit-point total ("you are claiming N points"), with a "how we got this"
   disclosure on each.
5. **Review screen** before output: per-section summary, edit links, 3-item checklist
   (signature, declaration, attachments).
6. **Outputs** (all local):
   - filled PDF, A4 RTL, print-ready, our own layout (the official PDF has no form
     fields — see the ADR on PDF strategy);
   - ZIP package = PDF + attachments + a one-page cover listing what was attached and
     what is still missing;
   - print stylesheet (no PDF reader required);
   - JSON export of the answers (machine-readable, for our own import and for power users).
7. **Save/resume**: IndexedDB draft, autosaved, restored on the same device; export/import
   a draft file to move devices. No accounts, no links, no bearer tokens.
8. **Employer template link** (see §5) with org block pre-fill + lock and the appendix
   toggles that actually change the employee's form (bank details, service permits,
   minor's medical certificate, income-type pre-fill, warning levels).
9. **Content surface**: `/` (short), `/101/` landing, `/101/employer/`, `/guides/` hub +
   the 6 guides listed in
   [competitor/content-strategy](../competitor/content-strategy.md), `/faq/`, `/about/`,
   `/privacy/`, `/accessibility/`, `/terms/`.
10. **Trust page** with the verifiable claims (Network tab, Wi-Fi off, no cookies) — this
    is a product feature, not marketing.
11. **PWA**: installable, works offline after first load.
12. **Accessibility**: keyboard-complete, screen-reader pass on the wizard, 200 % zoom,
    visible focus, error announcements via live region.

## 4. In scope — SHOULD (v1 if time, else v1.1)

- VAT calculator (only calculator kept).
- "Second employer" flow: same answers, different employer block, second PDF.
- Correction flow: "I already sent it, something changed" → reopened draft marked
  "replacement", with the changed fields highlighted for the employer.
- Share sheet on mobile (Web Share API with files) so the employee can send the PDF
  through their own WhatsApp/mail client in two taps.
- Hebrew/English toggle for the *labels* (single schema), no separate English form.
- Per-field help authored in-house (1–3 sentences), no outbound links mid-form.

## 5. Employer side in v1 — the honest version

What we can do without a server:

- Employer opens `/101/employer/`, fills the org block + toggles, presses "create link".
- The **whole template is encoded in the URL fragment** (`#t=<base64url(json)>`): no
  storage, no expiry, nothing to leak. The link is long; we ship a short "copy message"
  helper instead of a shortener (a shortener would require a server and would see the
  payload).
- The employee opens the link → the form arrives with section א pre-filled and locked, the
  appendix toggles applied, the income type pre-selected.
- At the end the employee gets the PDF/ZIP **themselves** and hands it to the employer by
  whatever channel they already use.

What we must say out loud on that page:

> אנחנו לא אוספים את הטפסים ולא שולחים אותם עבורך. העובד מוריד את הקובץ ומוסר אותו
> כרגיל. היתרון: שום פרט של העובד לא עובר דרכנו.

That is a weaker promise than "PDFs arrive in your inbox", and the page has to own it in
the first screen, not in a footnote. If the product owner decides this is unsellable to
employers, the alternative is B2 (a real backend) — which contradicts the browser-only
constraint, so it is a v2 decision, not a v1 compromise.

## 6. Explicit non-goals (v1)

| Not doing | Why | Revisit? |
| --- | --- | --- |
| Sending email / PDF on the user's behalf | needs a server that receives ID numbers + salary | only with a hardened backend + a very good reason |
| Accounts, cloud sync, "my documents" | same reason; also creates a breach target | no |
| Server-side drafts / share links | the link *is* the data | no |
| Analytics, error reporting, cookies, CDN fonts | destroys the only differentiator | privacy-first aggregate counts only if unavoidable |
| Ads, affiliate links, lead-gen panels | the reason this product exists | never |
| Other forms (119, 1516, bank details, 250…) | 24 half-forms is their strategy, not ours | after 101 is excellent |
| English as a separate form | drift, double maintenance | i18n on one schema, later |
| Child-support calculator / family-law content | legal liability, different audience | no |
| e-signature "per the e-signature law" | we produce a signature image on a PDF, like they do | check with a lawyer before claiming anything |
| Employer dashboard / who-submitted tracking | requires collecting the employee list | no |
| Historical form archive (2011–2025) | low value, high maintenance | no |

## 7. Open questions (product owner must answer)

**O-1. Is "no email" acceptable to employers, or does it kill the B2B half?**
Evidence: their entire employer pitch is "signed PDFs arrive in your inbox". Our
substitute is "the employee hands it to you". If a 40-person employer says no, v1 has an
employee-only product. Decide before building `/101/employer/`.

**O-2. Where does the address/street dataset come from?**
They use a remote autocomplete (city + street scoped by city) and their own FAQ shows it
fails ("my town/street isn't in the database"). We need a local, licensed dataset or a
free-text fallback. Licensing and update cadence are unresolved.

**O-3. PDF strategy: overlay on the official blank, or our own layout?**
The official PDF has no AcroForm fields. Overlay gives "looks exactly official" but
brittle coordinates and a 2-page constraint; own layout gives control (cover page, page
numbers) but a different-looking document. Affects J3 and the trust story.

**O-4. Do we reproduce the declaration text verbatim?**
It is a legal declaration the user is signing ("I declare… omission is an offence under
the Income Tax Ordinance"). Verbatim is probably required; that is a legal review, not a
copy decision. Same question for the 16 credit-item labels.

**O-5. Attachment ceiling.**
Browser memory + ZIP size. Photos of certificates are 2–5 MB each. Do we cap count/size,
downscale images client-side, or tell the user to attach only what is required? (Their
product has the same problem and solves it by embedding files as PDF attachments.)

**O-6. What is the one number we show on the landing page?**
"3 minutes"? "12 credits"? We cannot claim time-to-complete without data. Options: no
number (honest), or a specific verifiable claim like "0 network requests after load".

**O-7. Who is accountable for tax correctness?**
Every value (credit points, thresholds, ages, the 48 % warning) needs an owner and a
review date. Their site still shows 2016 figures in 2026 — the failure mode is known.
Proposal: a `YEAR.md` with every number + source + "reviewed on", and a release gate.

**O-8. Accessibility claim level.**
Do we claim AA (and test it), or publish "tested with X, known gaps Y"? Their statement
claims AA and lists Ctrl+/- zoom, which is not an accessibility feature. We should
publish method + gaps.

**O-9. Brand and domain.**
Not in scope here, but "tofes101" is their brand and a generic term; naming needs a check
before any content is written.

## 8. Acceptance checks (definition of done for v1)

- [ ] Fill the form end-to-end with Wi-Fi **off** after first load; get a PDF + ZIP.
- [ ] Network tab shows **zero** requests while filling; no cookies set.
- [ ] Refresh mid-form → answers restored; exported draft imported on a second device.
- [ ] Every required field has an error message in Hebrew that names the fix.
- [ ] A passport holder, a married parent of 3, and a 17-year-old each see the correct
      subset of sections and credit items.
- [ ] Print preview of the PDF is 1–3 A4 pages with no clipped text and a visible signature.
- [ ] Employer link: org block locked, toggles applied, tampering with the fragment fails
      gracefully (falls back to manual employer entry).
- [ ] Keyboard-only completion; screen-reader pass on the wizard; 200 % zoom.
- [ ] Every number in the UI traceable to a source + review date.

## 9. Effort shape (rough, for planning only)

| Slice | What | Weight |
| --- | --- | --- |
| schema + wizard shell | sections, conditionals, validators, progress | 30 % |
| credits section ח + documents | the legal heart, 16 items, file handling | 25 % |
| PDF/print | layout, signature, cover page, ZIP | 20 % |
| employer template encoding | URL fragment, lock, toggles | 8 % |
| content (7 pages) + FAQ | original writing, year-stamped | 12 % |
| a11y + PWA + polish | keyboard, SR, offline | 5 % |

The content is not the cheap part; the PDF is where the schedule usually dies.
