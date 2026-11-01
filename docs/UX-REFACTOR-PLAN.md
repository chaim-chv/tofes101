# UX refactor plan — tofes101

**Status:** confirmed; phases 0–4 implemented, phase 5 in progress (2026-11-01).
**Date:** 2026-10-31 · updated 2026-11-01.
**Scope:** the whole user-facing product: `/`, `/employer`, `/form`, `/print`, plus the missing completion state.
**Basis:** current working tree (which already contains uncommitted validation work), the project's own UX KB/documented contracts, the competitor teardown, and Nuxt UI 4.12 (already a dependency).

> Implementation status: phases 0–4 are committed (`5963c47`, `818bf88`,
> `f2ad4f2`, `bde40ee`, `181038f`). Phase 5 is verification and polish. See
> `docs/IMPLEMENTATION.md` §15 for the delivered scope and the remaining
> follow-ups (shared `DocumentView`, PDF tagging, dark mode, stricter bundle
> split). The city picker, date field, completion panel and derived summary are
> done; the official document wording is unchanged.
>
> This plan does **not** touch the legal content or the privacy model. It keeps
> the pure schema/engine and the "no server, no account, no ads" promise. It
> builds on the uncommitted validation work in `schema.ts`, `validators.ts`,
> `FormField.vue` and `tests/engine.test.ts`; nothing there needs to be reverted.

---

## 0. Executive summary

### What is already good (keep)

- **The product idea is sharp**: a private, local, no-account 101 with plain-language help. That is the differentiator against the reference (ads, marketing consent, long single page).
- **The architecture is right**: one `FieldDef` per fact, a pure engine, schema-driven rendering, typed i18n, versioned drafts, A4 fallback. The refactor must not move rules into components.
- **Accessibility work is real**: error summary with focus transfer, `aria-describedby`, RTL, 16px+ inputs, axe on every step, keyboard-capable signature alternative.
- **The form is short in the right places**: 9–10 decisions, not 160 fields on one page.

### What hurts (the seven things that matter)

1. **The form is a long column with no persistent action.** On mobile the primary "המשך" is below the card; on the credits step the user scrolls several screens to continue. This violates the project's own mobile rule ([`kb/ux/mobile-layout.md`](../kb/ux/mobile-layout.md): sticky primary, 52px, thumb zone).
2. **Progress is a horizontally scrolling strip of 11 chips.** On mobile it shows only numbers (no names), clips the last step, has 26px targets, and cannot answer "where am I / what is left?". On desktop it is visually noisy.
3. **The step model lies.** The intro is counted as step 1 of 11, so users think there are 11 decisions. Review and sign are two screens for one decision. The project's own design doc says 8–9 steps, ≤8 visible fields per step ([`kb/ux/wizard-vs-long-page.md`](../kb/ux/wizard-vs-long-page.md)).
4. **The credits step is a wall of 16 legal checkboxes + coordination.** It is the highest-value, highest-anxiety part of the form and currently the least designed. It violates "one decision per screen".
5. **There is no "result" moment.** After the PDF downloads, the screen does not change. No confirmation, no file name, no share/print/repeat, no "what now". The user asked for the result; the product should celebrate and close the loop.
6. **Nuxt UI is under-used.** The app depends on Nuxt UI 4.12 but hand-rolls inputs, radio cards, checkboxes, tabs, date inputs, file upload, the header, the footer, the stepper and the progress bar. That is ~400 lines of duplicated a11y/RTL/state logic and the main source of visual inconsistency.
7. **Small but trust-damaging bugs.** Rail clicks jump to the wrong step when a step is skipped; the multi-tab conflict shows "יש תשובות מוסתרות"; "delete everything in one click" is promised but no such button exists; locked prefill fields do not say they are locked; `capture="environment"` forces the camera instead of offering a photo/PDF; a changed answer after signing does not invalidate the signature.

### Recommendation

Do a **UX-first refactor on top of Nuxt UI**, in five phases:

1. **Stop the bleeding** — fix the correctness/trust bugs (P0).
2. **One shell + one design system** — `UHeader`/`UFooter`/`UPage*`, Heebo loaded, tokens, skip link, accessibility/privacy pages.
3. **A real form frame** — 9 honest steps, desktop step rail via `UStepper`, mobile progress + slideover, sticky action bar, draft menu in the header instead of export/import on every step.
4. **Nuxt UI controls** — `UFormField` + `UInput` + `URadioGroup variant="card"` + `UCheckboxGroup` + `UInputDate`/date group + `UInputMenu` (city) + `UFileUpload` + `UTabs` (signature).
5. **Results and closing** — group the credits, simplify income, show derived summaries, merge review+sign, add the completion panel, unify the document view.

Estimated effort for one focused developer: **~3 weeks**, parallelizable to ~2 with the phases split. A "minimum lovable" cut (P0 + shell + frame + results) is ~1 week and removes the worst of the pain.

---

## 1. Method and evidence

> Note: the working tree is being edited concurrently (validation work in
> `schema.ts`, `validators.ts`, `FormField.vue`, tests). Line numbers below are a
> snapshot from the audit; prefer the named functions/components if they drift.

### What I inspected

- Every route and component at 1280×900 and 390×844 (desktop + mobile), including empty, prefilled, filled, error, English and print states.
- Screenshots: `research/ux-audit/*.png` (generated by `tools/e2e/audit-shots.ts`).
- Code: `app/pages/*`, `app/components/**`, `app/composables/**`, `app/form/{schema,engine,derive,documents}.ts`, `app/storage/*`, `app/assets/css/main.css`, `nuxt.config.ts`.
- Project contracts: `docs/IMPLEMENTATION.md` (sections 3, 4, 5, 7, 9), `kb/ux/*` (principles, wizard, mobile, validation, progress, speed, trust), `kb/competitor/flow-employee.md`.
- Nuxt UI 4.12 documentation for `UStepper`, `UFormField`, `URadioGroup` (`variant="card"`), `UCheckboxGroup`, `UFileUpload`, `UInputDate`, `UInputMenu` (`create-item`), `UHeader`, `UFooter`, `UPage*`, `UProgress`, `UTabs`, `UModal`, `USlideover`, `UDropdownMenu`.

### Key evidence

| Evidence | Where |
| --- | --- |
| 11-step rail, save text, action row cramped together | `app/pages/form.vue:294-306`, `:409-437` |
| Rail buttons are 26px tall, names hidden under `sm` | `app/components/form/StepProgress.vue:42-77` |
| Skipped-step index bug: rail sends schema index, `goTo` expects visible index | `app/form/engine.ts:152-168` + `app/composables/useFormStore.ts:131-157` |
| Verified bug: with a passport, clicking "ההכנסות" lands on "נקודות זיכוי" | temporary test (see §2) |
| Conflict alert reuses the "hidden answers" string | `app/pages/form.vue:308-315` |
| Skip reason is dead code (current step is always visible) | `app/pages/form.vue:194`, `:327` |
| Reset clears the draft but not attachment blobs | `app/composables/useFormStore.ts:206-211`, `app/storage/files.ts` |
| Camera forced on every upload slot | `app/components/form/DocumentUploads.vue:160-168` |
| Print CTA is labelled "מצב מסמך מלא" | `app/pages/print.vue:74` |
| Hardcoded Hebrew outside catalogs (employer, print, home footer) | `app/pages/employer.vue:112,146-157`; `app/pages/print.vue:80-109`; `app/pages/index.vue:76` |
| Heebo is declared but never loaded | `app/assets/css/main.css:14-18`, `public/fonts/Heebo-Variable.ttf` |
| Unused strings that reveal missing UX: continue draft, locked by employer, delete all, re-sign, import hint, last saved | `app/locales/he.ts` |
| Children/coordination rows: PDF prints only 5 children / 3 employers with no warning | `app/pdf/fields.ts:203-204` |
| Derived results exist but no screen uses them | `app/form/derive.ts` (only `spousePresent` is imported) |

### The verified skipped-step bug

```text
visible: intro, employer, identity, contact, status, income, credits, attach, review, sign
views:   intro:0 current | children:5 skipped | income:6 todo | credits:7 todo ...
click "income" -> goTo index 6 -> resolves to "credits"
```

Any flow where a step is skipped (passport → children) makes the rail jump to
the wrong step. The fix is to navigate by **step id**, not by array index, and
to make `StepView` carry a `visibleIndex`.

---

## 2. The decision framework

Every screen in this plan was tested with five questions:

1. **What is the user's job here?** (Not "what fields do we have".)
2. **What is the measurable benefit of this screen/field/control?**
3. **Is it necessary at all?** Could the same benefit be delivered in a smaller, smarter way?
4. **Is this the most understandable and correct form of it?** (Plain language, one decision, progressive disclosure, no dead ends.)
5. **Does the user get feedback and a result when they act?** (Saved, valid, generated, done, what next.)

The tie-breakers are the project's own rules:

- One decision per screen ([`kb/ux/wizard-vs-long-page.md`](../kb/ux/wizard-vs-long-page.md)).
- Never hide a required question; never delete an answer ([`kb/ux/required-optional-conditional.md`](../kb/ux/required-optional-conditional.md)).
- Never disable the primary action without saying why ([`kb/ux/validation-and-errors.md`](../kb/ux/validation-and-errors.md)).
- Mobile first: 44px targets, 52px primary, sticky action bar, keyboard-aware ([`kb/ux/mobile-layout.md`](../kb/ux/mobile-layout.md)).
- RTL is the default, not a translation ([`kb/ux/rtl-foundations.md`](../kb/ux/rtl-foundations.md)).
- No dark patterns; the PDF is a right, not a product ([`kb/ux/ux-principles.md`](../kb/ux/ux-principles.md)).

---

## 3. Screen-by-screen audit

### 3.1 Home (`/`)

**Job:** decide whether this is trustworthy, understand what it is, start or resume.

| Question | Answer |
| --- | --- |
| Benefit | Trust + orientation + one clear entry point. |
| Necessary? | Yes, but it duplicates the intro step and has two competing large CTAs. |
| Current problems | Generic hero; two large buttons of equal weight; no "continue draft" even though a draft may exist and the string exists; no "what to prepare"; no footer links (accessibility statement/privacy/source); header is a second, different implementation from `AppHeader`. |
| Better way | `UPageHero` + one primary CTA + a smaller employer link; a client-only "continue draft" card with saved date and step; a 3-item "what you need" list; `UPageSection` benefit cards; real `UFooter` links. |

**Decision:** rebuild on Nuxt UI page components; add resume, preparation list and real footer. Do not add marketing sections.

### 3.2 Employer link builder (`/employer`)

**Job:** create a link that pre-fills the employer block, and send it to employees.

| Question | Answer |
| --- | --- |
| Benefit | Removes repeated typing for every employee and reduces employer-detail errors. This is the employer-side hook. |
| Necessary? | Yes. But the current page mixes three jobs: filling the form, reading the result, and reading an explainer. |
| Current problems | No site shell/header (looks like another product); result appears below the fold; long URL in a plain input; a developer-facing fingerprint and JSON download; no ready-to-send message; no validation beyond "name length > 1"; hardcoded Hebrew; warning is good but buried. |
| Better way | Two explicit states (compose → result). Compose: `UForm`/`UFormField` with real validation (deduction file 9 digits starting with 9, phone). Result: link + copy + open + "copy a message for employees" + QR optional; JSON/fingerprint under "פרטים טכניים" (collapsed). Add "create another link". |

**Decision:** keep the feature, split the states, hide the developer artifacts, localize. The "copy a ready message" is the missing job-to-be-done: the employer needs to send instructions, not just a URL.

### 3.3 Form shell and progress (`/form`)

**Job:** know where I am, what is left, and move forward confidently.

| Question | Answer |
| --- | --- |
| Benefit | Orientation; reduces abandonment. |
| Necessary? | Yes, but the current rail is the wrong tool on mobile and too noisy on desktop. |
| Current problems | 11 chips; names hidden on mobile; horizontal scroll with no affordance; 26px targets; last chip clipped; save text is a tiny line under the rail; skipped steps are struck through but clickable; dead clicks when the current step is invalid; no announcement of the new step; export/import take prime space in the action row. |
| Better way | Desktop: two columns (`UPage`): sticky aside with `UStepper orientation="vertical"` (short titles, status icon, error badge) + content. Mobile: sticky compact header with "שלב 3 מתוך 9 · מי אתם" + `UProgress` + "כל השלבים" opening a `USlideover` with the same vertical stepper. Sticky bottom action bar. Move export/import/delete to a header "טיוטה" `UDropdownMenu`. |

**Decision:** replace `StepProgress` with `StepRail` (desktop) + `StepProgress` (mobile) built on `UStepper`, `UProgress`, `USlideover`. Keep the `aria-current="step"` semantics.

### 3.4 The step model

**Current (11 counted steps):**
`intro → employer → identity → contact → status → children → income → credits → attach → review → sign`

**Proposed (9 counted steps):**
`employer → identity → contact → status → children → income → credits → attach (optional) → finish (review + declaration + signature + download)`

Why:

- **Intro is not a decision.** Its three facts belong on the home page and in a collapsible "מה זה טופס 101?" on the first step. Counting it makes the form look 20% longer than it is and lies about progress.
- **Review and sign are one decision**: "this is correct, I declare it, give me the file." Two screens duplicate the same content and split the legal moment. Merge them into `finish`; the document view, declaration, signature and download live together.
- **Attach stays separate** because uploading is a distinct task (camera/file), but it is clearly optional and can be skipped with one secondary action. If it turns out to be noise, fold it into `finish` in a later iteration.
- Result: users see "9 steps" (8 real decisions + optional documents), matching the design doc.

**Alternative if you want a smaller change:** keep `review` and `sign` separate (10 steps) but still remove `intro` and merge nothing else. The rest of the plan is unchanged; only the step list and the final screen differ.

### 3.5 Step 1 — Employer

**Job:** capture who the employer is (or mark it unknown).

| Question | Answer |
| --- | --- |
| Benefit | The employer block is required on the form; prefill removes repetition. |
| Necessary? | Yes. Tax year is already fixed (2026), so do not ask it — show a `UBadge` instead. |
| Current problems | Prefilled fields are disabled with no visual "locked" state; `form.prefill.locked` is unused; the "unknown" checkbox is visually detached; address/phone hints are thin; the prefill card sits above the step and pushes everything down. |
| Better way | `UCard` with a "מוזן על ידי המעסיק" `UBadge` + lock icon; use `readonly` (not `disabled`) so values stay readable/copyable; "אני לא יודע/ת" uses `UCheckbox` + explanation and a confirmation if it clears values; prefill becomes a `UModal` (or a compact `UAlert` + "פרטים") so the step does not jump. Add diff warning if the link would overwrite existing answers. |

### 3.6 Step 2 — Identity

**Job:** identify the person and the branch (ID vs passport).

| Question | Answer |
| --- | --- |
| Benefit | Determines later branches and the document list. |
| Necessary? | Yes. |
| Current problems | Native `type="date"` for birth date shows `dd/mm/yyyy` in an otherwise Hebrew UI and opens a picker at today (the project's own mobile doc says not to do this); ID is a plain text box; passport country is a select but the country list is not obvious; "why identity first" is explained, which is good. |
| Better way | `URadioGroup variant="card"` for ID kind; `UInput` with digits filter + 9-digit hint for ID; 3-part date group (day/month/year) for birth/aliyah dates with `UFormField`; `USelect`/`UInputMenu` for passport country; inline age preview ("בן/בת 35 בשנת המס") using `derive()` when both dates exist. |

### 3.7 Step 3 — Contact

**Job:** capture address and a way to reach the person.

| Question | Answer |
| --- | --- |
| Benefit | Required on the form; a phone is how the employer asks a question. |
| Necessary? | Yes, but the email field is a false promise: it says "used only if you want a copy", yet nothing sends email. |
| Current problems | City is free text (errors, spelling variants); email claims a capability that does not exist; zip validation was added but the hint is thin; no "same as employer"? (not applicable). |
| Better way | City: `UInputMenu` with a bundled city list (~1,300) and `create-item` so free text still works; street free text; house number + zip in a 2-column row; mobile with `type=tel` + filter; **remove the email field** (or reword to "לשימוש עצמי שלך" with no promise) — decision D5. |

### 3.8 Step 4 — Status (and spouse)

**Job:** capture the facts that determine credits and withholding.

| Question | Answer |
| --- | --- |
| Benefit | High: wrong status → wrong tax. |
| Necessary? | Yes. |
| Current problems | The spouse sub-form appears inline with only a text divider; the page becomes a long mixed form; "תושב/ת ישראל" and "קיבוץ" use inconsistent controls; health fund is a radio group of 4 (fine, but could be a select); no visual grouping. |
| Better way | Sections with `USeparator` + headings: "פרטים אישיים", "תושבות", "קופת חולים", "בן/בת הזוג" (only when married). Use `URadioGroup` for yes/no and marital (cards), `USelect` for the fund. Add "העתקת שם/כתובת" only if useful (spouse surname often same) — with explicit confirmation, never silently. |

### 3.9 Step 5 — Children

**Job:** capture children for credit points.

| Question | Answer |
| --- | --- |
| Benefit | Directly changes credits. |
| Necessary? | Yes, when relevant. |
| Current problems | The whole step is hidden for passport holders and the skip reason is never shown (dead code) — the user just never sees it; rows are cards but the "empty" state says "אפשר להשאיר ריק" which reads like "nothing to do"; `maxItems: 12` but the PDF prints only 5 with no warning; no age feedback. |
| Better way | Show the step with an explained "לא רלוונטי" state if the law excludes passport holders (verify in `kb/law/`), or show it for everyone and let them add rows. Use `UCard` rows with "ילד/ה 1" header, `UEmpty` for the empty state ("אין ילדים? אפשר להמשיך"), and a live age chip per child. Warn when >5 children that the official form has 5 rows and the rest go to an appendix (or print an appendix). |

### 3.10 Step 6 — Income

**Job:** say what kind of pay comes from this employer and when it started.

| Question | Answer |
| --- | --- |
| Benefit | Determines withholding; the "additional job" warning is one of the most valuable explanations in the product. |
| Necessary? | Yes. |
| Current problems | Six checkboxes (monthly/additional/partial/daily/allowance/scholarship) with one dense help paragraph; users do not know which one applies; the warning appears after selection (good) but the definitions are remote. |
| Better way | `UCheckboxGroup variant="card"` with a **description per option** ("משכורת חודש — 18 יום בחודש ומעלה", "משרה נוספת — יותר מ־5 שעות ביום..."), note "אפשר לסמן יותר מאחד"; start date via `UInputDate` constrained to the tax year; the additional-job warning stays as a `UAlert color="warning"` directly under the selection. |

### 3.11 Step 7 — Credits (the big one)

**Job:** claim the credits the user is entitled to, without a law degree.

| Question | Answer |
| --- | --- |
| Benefit | Highest financial impact of the whole form. |
| Necessary? | Yes, but not as 16 flat legal checkboxes. |
| Current problems | 16 items numbered 5–16 (the first four have no numbers, which is confusing), plus coordination; no grouping, no prioritization, no plain-language summary; the legal label is the only label; the page is ~2.5 screens; it is the step most likely to be abandoned or answered wrongly. |
| Better way | Group into 3 credit groups + coordination, show the 4 common personal credits first, put the long tail under "עוד סעיפים" (accordion or "show more"), keep the legal wording as a secondary line/badge, and add a plain-language one-liner per item. Show a live summary: "סימנתם 3 סעיפים · 2 ילדים בחזקה". Coordination is a separate, collapsed section because most users do not need it. |

Proposed grouping:

| Group | Items | Presentation |
| --- | --- | --- |
| זיכויים אישיים | resident, disabled (+2ב monthly stipend), locality (+name/from), immigrant (+type/from/no-income-until) | Always visible, 4 compact rows; detail fields open inline. |
| משפחה וילדים | 5 incomeless spouse, 6 single parent, 7 children custody, 8 toddlers, 9 sole parent, 10 non-custody support, 11 disabled child (+count), 12 alimony | Visible; 7 and 8 only when ID; plain-language descriptions. |
| שירות, לימודים, מילואים | 13 young employee, 14 discharged (+dates), 15 studies, 16 reserve (+days) | Behind "עוד סעיפים" (collapsed by default), with a count badge. |
| תיאום מס | request, reason, other employers repeater / approved | `UCollapsible` / `UAccordion`, clearly "לא נפוץ". |

**Decision:** one step, three visual groups, long tail collapsed. Do **not** split into two steps yet — grouping should be enough; if usability testing still shows overload, split "family credits" into its own step in a later iteration.

### 3.12 Step 8 — Attachments

**Job:** optionally attach ID/annex or passport/residence so the PDF is complete.

| Question | Answer |
| --- | --- |
| Benefit | Saves the employer a separate scan; supports the declaration. |
| Necessary? | Optional, but useful. It should not feel mandatory. |
| Current problems | The step repeats the title/intro ("צירוף מסמכים" + "מסמכים לצירוף"); the ID slot shows a red required star while the copy says it is optional; `capture="environment"` forces the camera (users cannot pick an existing photo or PDF); custom file input; no drag/drop; no remove-undo. |
| Better way | One heading; `UFileUpload` (variant area, layout list, accept images/PDF, `:multiple="false"`) per slot; two explicit actions on mobile ("צילום" / "בחירת קובץ") or none (let the OS choose); `UBadge` "מומלץ" not a required star; remove with confirm/undo; a small "הקבצים נשארים במכשיר" line. Keep IndexedDB. |

### 3.13 Step 9 — Review, declaration, signature, download (merged)

**Job:** verify the document, declare it, sign it, get the file.

| Question | Answer |
| --- | --- |
| Benefit | The legal moment and the actual result. |
| Necessary? | Yes. Two screens are not necessary; one is stronger. |
| Current problems | Review is a stack of cards, print is a different layout, PDF is a third representation; 8 "עריכה" links; the declaration is styled as a yellow warning; signature tabs are a hand-rolled `role="tablist"`; the PDF box is nested inside the step with a duplicate "מצב מסמך מלא"; the last-step primary CTA is "מצב מסמך מלא" instead of download; no success state; changing an answer after signing does not invalidate the signature (`sign.resign` unused). |
| Better way | One `DocumentView` (the A4 document) used by both review and `/print`; edit links per section; a derived summary ("מה כלול"); declaration in a neutral `UCard` (not `UAlert color=warning`), full legal text; `UTabs` for draw/type signature; date auto; primary sticky "הורדת PDF מלא" (enabled only when valid — if not, clicking shows the summary); secondary "הדפסה"; after download a `CompletionPanel`. |

**Signature integrity:** store a hash of the answers (excluding signature/date) with the signature. When the hash changes, show `sign.resign` and require a new signature before export. This is both trust and legal correctness.

### 3.14 Print (`/print`)

**Job:** read/print a clean copy; fallback if PDF generation fails.

| Question | Answer |
| --- | --- |
| Benefit | Always-works output; a readable document. |
| Necessary? | Yes as a fallback/reading view, but it is not the primary result. |
| Current problems | The primary button is labelled "מצב מסמך מלא" and only calls `window.print()`; no PDF download; hardcoded Hebrew; different visual language from review; sections can split across pages; the signature area is fragile. |
| Better way | Reuse `DocumentView`; toolbar: "הורדת PDF" (primary) + "הדפסה" (secondary) + "חזרה"; `break-inside: avoid` per section; print-specific spacing; keep the document RTL/Hebrew regardless of UI language; add "הופק מקומית" footer. |

### 3.15 Completion (missing)

**Job:** confirm the result and tell the user what to do next.

| Question | Answer |
| --- | --- |
| Benefit | Closure, confidence, a path to the employer. |
| Necessary? | Yes — this is the "get the asked result" moment. |
| Current problems | None: it does not exist. After download, the sign screen stays unchanged. |
| Better way | `CompletionPanel`: "הקובץ מוכן" + file name + "הורדה חוזרת" + "שיתוף" (Web Share API when available) + "הדפסה" + "מה עכשיו?" (send to employer, keep a copy, changes during the year → new form) + "התחלת טופס חדש" (with confirm). Persist `meta.lastExportAt` so a reload can show the panel. |

### 3.16 Global: error, save, draft, conflict, hidden answers

| Element | Current | Target |
| --- | --- | --- |
| Error summary | Good focus/link behavior; sits inside the step. | Keep the component; ensure it appears above the fields and is focused on failed next; on rail jump failure, show it too (no dead clicks). |
| Save status | Tiny line under the rail; `dirty` never resets, so "saved" is approximate. | `SaveStatus` in the header: "נשמר אוטומטית · 14:32" (`aria-live="polite"`), "שומר…", error state with a backup link. Reset `dirty` after flush. |
| Draft actions | Export+import buttons on every step, next to Next. | `DraftMenu` (`UDropdownMenu`) in the header: export, import, delete all, start over. Toast results. Import uses `UModal` preview. |
| Multi-tab conflict | Shows `common.hideAnswers` ("יש תשובות מוסתרות") — wrong message. | `UAlert`/`UModal`: "הטיוטה עודכנה בטאב אחר" + "טעינת הגרסה האחרונה" / "המשך כאן". |
| Hidden answers | `hidden` is computed but never surfaced; conflict reuses the string. | `HiddenAnswersNotice` when `hiddenCount > 0`: "שמרנו תשובות לסעיפים שלא רלוונטיים" + review/clear. Never delete silently. |
| Delete all | Promised on the home page, not implemented; reset does not clear attachments. | Two-step `UModal`; clears draft + attachments + signature; returns home; toast. |
| Skip reason | Dead code. | Show a notice when a step becomes skipped, and in the all-steps panel; link to the answer that changed. |

---

## 4. The target experience

### First visit (desktop)

`/` → one clear CTA ("התחלת מילוי") + "מה צריך להכין" + privacy badge + employer link. The header has nav, language, and (if a draft exists) "המשך טיוטה". Clicking start opens `/form` at step 1.

`/form` is a two-column page: a sticky vertical step list on the inline-start side, the step card on the other. A compact "שנת המס 2026" badge sits above the title. Only one decision is on screen. The primary "המשך" is always visible at the bottom of the viewport.

### First visit (mobile)

Same content, one column. Under the app header: "שלב 3 מתוך 9 · מי אתם" + a thin progress bar + "כל השלבים". The step card is full-width. The action bar is sticky at the bottom: "חזרה" (ghost) and "המשך" (full-width, 52px). It hides when the keyboard is open. Export/import/delete live in the header menu, not next to Next.

### Returning user

The home page detects a draft (after mount) and shows "יש טיוטה מ־30/10 · שלב 5 מתוך 9" with "המשך" and "התחלה מחדש". The header always shows the save state. Closing the tab loses nothing.

### The finish

The final step shows the actual document (same component as print), a derived summary, the full declaration, the signature, and one primary action: "הורדת PDF מלא". After success, the primary area becomes a completion panel: file name, re-download, share, print, "מה עכשיו?", start new.

### Employer

`/employer` has the same shell. A short form with real validation; after submit, the page turns into a result: link, copy, open, "העתקת הודעה לעובד", advanced details collapsed. No fingerprint in the main flow.

---

## 5. Component and Nuxt UI map

> Principle: use Nuxt UI for **presentation and interaction**; keep the **rules** in `schema.ts`/`engine.ts`. A component may map a `FieldDef` to props; it may not decide visibility or validity.

| Current | Target | Why |
| --- | --- | --- |
| Inline header in `index.vue` + `AppHeader.vue` | `SiteHeader` wrapping `UHeader` + `UNavigationMenu` + `UDropdownMenu` | One shell, mobile menu built in, a11y. |
| Inline footers | `SiteFooter` wrapping `UFooter`/`UFooterColumns` | Real links (accessibility, privacy, source), localized. |
| `StepProgress.vue` | `StepRail.vue` (desktop `UStepper orientation="vertical"`) + `StepProgress.vue` (mobile `UProgress` + `USlideover`) | Correct semantics, 44px targets, no clipped names. |
| `FormField.vue` (386 lines of native controls) | Thin `FormField.vue` using `UFormField` + `UInput` / `URadioGroup variant="card"` / `UCheckboxGroup` / `USelect` / `UCheckbox` | Removes duplicated a11y/RTL/state; consistent visuals. |
| Raw `<input type="date">` | `UInputDate` for tax-year dates; 3-part `UInput` group for birth/aliyah dates | No `dd/mm/yyyy` mismatch; no picker starting today. |
| `select` for health fund | `USelect` | Compact, consistent. |
| Custom radio cards | `URadioGroup variant="card"` | Same look, built-in keyboard/ARIA. |
| Custom checkbox cards | `UCheckboxGroup variant="card"` | Same. |
| Hand-rolled tablist in signature | `UTabs` (`draw`/`type`) + `UFormField` + `UButton` | Correct ARIA, keyboard, slots. |
| Custom file input + preview | `UFileUpload` (`accept`, `layout="list"`, `variant="area"`) | Drag/drop, previews, errors, keyboard; no forced camera. |
| Hidden JSON import input + `confirm()` | `UModal` + `UFileUpload`/`UInput` + `useToast` | Preview before replacing; no native dialogs. |
| Custom sticky-ish action row | `FormActionBar` using `UButton` (size lg, block on mobile) | 52px, safe-area, keyboard-aware, one primary. |
| Cards on review vs print article | `DocumentView` (`UCard` on screen, plain `article` in print) | One source of truth for the document. |
| `UAlert` for neutral intro copy | `p`/`UCard` for neutral; `UAlert` only for info/warning/error | Color means something. |
| `static` divider fields | `USeparator` + heading | Semantic, less markup. |
| No empty states | `UEmpty` for no children/no attachments/no draft | Clear next action. |
| No toasts | `useToast()` for copy/import/export/PDF/delete | Transient feedback without permanent alerts. |

### Where **not** to use Nuxt UI

- **The engine and schema** stay pure; no component imports Vue into `app/form`.
- **`ErrorSummary`** stays custom (or becomes a thin `UAlert` wrapper): it owns the focus transfer and the list of links, which no generic component does.
- **`DocumentView`** stays custom: an A4 document is not a card.
- **The signature canvas** stays custom (pointer strokes); only its container/tabs use Nuxt UI.
- **The PDF overlay** stays custom (pdf-lib).

### Nuxt UI specifics to verify in the spike

- `UStepper` `v-model` + click navigation, vertical orientation, RTL, custom `#indicator`/`#title` slots for error badges.
- `URadioGroup variant="card"` with descriptions and 2-column layout; `UCheckboxGroup variant="card"` equivalent.
- `UFormField` ID association so `f-<field-id>` remains stable for the error summary and e2e tests.
- `UInputDate` ↔ ISO conversion and locale from `UApp`.
- `UFileUpload` preserving the file for IndexedDB and showing image previews.
- Bundle impact (stay under the 260KB first-load budget; measure after each phase).

---

## 6. Design system

### Typography

- **Load Heebo** from `public/fonts/Heebo-Variable.ttf` with `@font-face`, `font-display: swap`, self-hosted, preloaded. The file is already shipped; today it is unused, so the app silently falls back to the system font.
- Scale: 12 (helper/meta), 14 (labels), 16 (inputs/body), 18 (lead), 20 (card title), 24–30 (h1). Line height 1.5–1.6 for Hebrew body, 1.2 for headings.
- No text below 12px. No all-caps. Numbers/IDs LTR with `unicode-bidi: isolate`.

### Color and surfaces

- Keep teal as primary, but use it for **action and focus**, not for large surfaces. Recommended tokens: `primary` teal-700; hover teal-800; subtle teal-50; success/warning/error only for semantics.
- One page background (`bg-elevated/30`), one card surface (`bg-default`), one border (`border-default`). Remove nested boxes (the PDF box inside the sign card).
- `UAlert` colors: info = neutral/info, warning = real risk (additional job, employer PII), error = validation, success = saved/complete. The intro privacy message is not a success alert.

### Layout

- Marketing pages: `UContainer` max-w-5xl/6xl; hero max-w-2xl text.
- Form: `UPage` with aside (240–280px) + content max-w-2xl; on mobile one column, no aside.
- Step card: `UCard` padding 20/28; radius 12–16px; no shadow or a very subtle one.
- Action bar: sticky bottom, top border, backdrop blur, `padding-bottom: env(safe-area-inset-bottom)`; hidden when `[data-keyboard]`.
- Spacing rhythm: 4/8/12/16/24/32/48; section gaps 24–32.

### Motion

- 150–200ms ease-out for hover/expand; no continuous animation; respect `prefers-reduced-motion`.
- Step change: focus the h1 + a polite live announcement; no page-transition animation that delays input.

### RTL

- Logical properties only; `dir` on `<html>`; the document/PDF stays RTL/Hebrew even in English UI.
- Nuxt UI components inherit direction from `UApp`; verify the stepper, tabs, slideover and file upload in RTL.

---

## 7. Architecture changes

### 7.1 Layouts

Create `app/layouts/default.vue` (marketing/employer/legal: header + main + footer) and `app/layouts/wizard.vue` (form: compact header + step frame + action bar). `app.vue` becomes `UApp` + `NuxtLayout` + `NuxtPage`. This removes the duplicated header in `index.vue` and the header-less employer/print pages.

### 7.2 Step identity and URL

- Add `StepView.visibleIndex`; navigate with `goToId` only.
- Store `meta.stepId` (and keep `meta.step` as a derived/legacy field). URL becomes `?step=<id>` (e.g. `?step=credits`); accept numeric `?step=6` for old links and redirect.
- Bump `SCHEMA_VERSION` to 2 with a migration: `intro` → `employer`; `review`/`sign` → `finish`; unknown → nearest previous step.
- `resolveEntryStep` returns a step id, not an index.
- This fixes the skipped-step bug and makes links stable when steps are added/removed.

### 7.3 Save, draft, conflict

- `useFormStore`: `saveState: 'idle'|'saving'|'saved'|'error'`, `lastSavedAt`, `dirty` reset on flush, `conflict` with a real message and a `reload` action.
- `reset()` clears attachments via `createAttachmentStore().clear()` and the signature; `deleteAll()` is the UI action; `startOver()` may keep attachments? No — clear everything for privacy.
- `DraftMenu` (header) + `ImportDialog` (`UModal`) + `DeleteDialog` (two-step).
- Export excludes attachments: say so explicitly in the UI ("הגיבוי כולל תשובות, לא קבצים") or include them (decision D6). Default: exclude + clear label.
- Import: preview counts/date, confirm, clear old attachments (or ask), toast.
- Multi-tab: `BroadcastChannel` message includes `savedAt`; the other tab shows "עודכן בטאב אחר" with "טעינה" (reload) / "המשך כאן" (dismiss).
- Save status in the header; `aria-live="polite"`; no per-keystroke announcements.

### 7.4 Prefill

- Decode on mount **and** on `hashchange` (fixes the same-route hash navigation).
- Show `form.badPayload` when decoding fails (string exists, unused).
- If the draft already has employer values, show a diff/confirm before overwriting.
- Readonly + lock badge for locked fields; `disabled` only when the field is truly not applicable.

### 7.5 Signature integrity and completion

- On sign, store `answersHash` (stable JSON of visible values, excluding `sign.*`) with the signature.
- On any later change, compare; show `sign.resign` and block export until re-signed.
- `usePdfExport` returns `{ fileName, pages, bytes? }`; store `meta.lastExportAt`; show `CompletionPanel`.
- Web Share: `navigator.canShare({ files })` → `UButton` "שיתוף"; fallback to download.

### 7.6 Derived results

- Use `derive()` in the UI: child count/bands/ages, claimed credit items, spouse presence, credits-blocked.
- Review summary: "2 ילדים · 3 סעיפי זיכוי · 2 מסמכים".
- Children rows: age-at-year-end chip.
- Credits: selected count + a plain-language list of what was claimed.
- Do **not** compute tax amounts; add a one-line "איננו מחשבים מס" to avoid advice liability.

### 7.7 One document view

- `DocumentView` renders the same sections as today's print, with `readonly` and optional `edit` slots.
- `/print` = `DocumentView` + toolbar; final step = `DocumentView` + declaration/signature/download; PDF = the same data via `buildItems`.
- This removes the three-way drift between review cards, print article, and PDF.

### 7.8 Small correctness fixes (P0)

- Rail navigation by id (above).
- Conflict message.
- Reset clears attachments.
- Prefill same-hash + bad payload.
- Locked badge.
- `capture` removal.
- Required star on optional upload removed.
- Print CTA label.
- Localize hardcoded Hebrew.
- Show the skip reason / hidden-answers notice.
- Warn when children >5 / coord employers >3 (PDF capacity).
- `sign.resign` enforced.

---

## 8. Phased refactor plan

Each phase ends with `bun run verify` green and a screenshot pass. No phase requires a server or a new backend.

### Phase 0 — Trust and correctness (P0, ~1–2 days)

**Goal:** remove the bugs that make the product feel broken before changing the look.

- [ ] Navigate steps by id; add `visibleIndex` to `StepView`; update `goTo/jump/StepProgress`; regression test for passport flow.
- [ ] Fix the multi-tab conflict copy + action.
- [ ] `reset()`/delete-all clears attachments and signature; add the UI entry point (header menu) with a two-step `UModal`.
- [ ] Prefill: `hashchange` + `form.badPayload` alert; diff warning; locked badge (`readonly` + `UBadge`).
- [ ] Show skip reasons (all-steps panel + notice) and hidden-answers notice.
- [ ] Remove `capture="environment"`; remove the required star from optional uploads.
- [ ] Rename the print CTA to "הדפסה"; add a real "הורדת PDF" there.
- [ ] Move hardcoded Hebrew into catalogs (`employer`, `print`, home footer, `aria-label`s).
- [ ] Warn at >5 children / >3 coordination employers that the official PDF has 5/3 rows.
- [ ] Enforce re-sign after changes (`sign.resign`).

**Files:** `app/form/engine.ts`, `app/form/types.ts`, `app/composables/useFormStore.ts`, `app/pages/form.vue`, `app/components/form/StepProgress.vue`, `app/components/form/DocumentUploads.vue`, `app/pages/print.vue`, `app/pages/employer.vue`, `app/pages/index.vue`, `app/locales/*`, tests.

**Acceptance:** passport flow rail clicks land on the right step; "delete all" really deletes everything; conflict message makes sense; no hardcoded Hebrew in pages; e2e green.

### Phase 1 — One shell + design system (~2–3 days)

**Goal:** the app looks and behaves like one product.

- [ ] `app/layouts/default.vue` + `app/layouts/wizard.vue`; `app.vue` with `NuxtLayout`.
- [ ] `SiteHeader` (`UHeader` + `UNavigationMenu` + language + save status + draft menu) and `SiteFooter` (`UFooter` + links).
- [ ] Load Heebo (`@font-face`, preload); define tokens/radius/type in `main.css` and `app.config.ts`.
- [ ] Add skip link, `UMain`, landmarks, `scroll-padding`.
- [ ] Add `/accessibility` and `/privacy` pages (content from `kb/ux/a11y-statement.md` + `kb/eng/privacy-enforcement.md`); footer links.
- [ ] Replace home with `UPageHero`/`UPageSection`/`UPageGrid`/`UPageCard`; add "what you need" and draft-resume card.
- [ ] Rebuild employer page with `UForm`/`UFormField`, two states, copy-message action, advanced details collapsed.
- [ ] Add `useToast` usage for copy/import/export.

**Acceptance:** every route has the same header/footer; mobile menu works; English mode has no Hebrew UI except the official document; axe 0; type/space consistent.

### Phase 2 — Form frame and navigation (~3–4 days)

**Goal:** the user always knows where they are and can move without scrolling.

- [ ] New step model (remove `intro`; merge `review`+`sign` → `finish`; keep `attach` optional); schema migration v2.
- [ ] `StepRail` (desktop `UStepper vertical`) + `StepProgress` (mobile) + `USlideover` all-steps.
- [ ] `FormActionBar` sticky (safe area, keyboard-aware, 52px primary, full width mobile).
- [ ] `DraftMenu` in the header; remove export/import from the action row.
- [ ] `SaveStatus` in the header (`aria-live`).
- [ ] Error summary on failed rail jumps; no dead clicks.
- [ ] Focus/live announcement on step change; `prefers-reduced-motion`.
- [ ] URL `?step=<id>` + back/forward behavior documented.

**Acceptance:** mobile user never scrolls to find "המשך"; rail shows names; skipped steps explained; step count is 9; keyboard-only flow works.

### Phase 3 — Nuxt UI controls (~3–5 days)

**Goal:** delete the hand-rolled control layer and inherit Nuxt UI's a11y/consistency.

- [ ] `FormField` → `UFormField` + `UInput`/`USelect`/`URadioGroup variant="card"`/`UCheckboxGroup`/`UCheckbox`.
- [ ] Date fields: `UInputDate` for tax-year dates; 3-part group for birth/aliyah; shared conversion helpers + tests.
- [ ] City: `UInputMenu` with bundled city list + `create-item`; free text fallback.
- [ ] `FormRepeat` → `UCard` rows + `UEmpty` + add/remove with focus management.
- [ ] `FormSignature` → `UTabs` + `UFormField` + `UButton`; keep canvas.
- [ ] `DocumentUploads` → `UFileUpload`; keep IndexedDB; two mobile actions.
- [ ] Keep stable `f-<id>` IDs for the error summary/e2e.
- [ ] Measure bundle after each swap; lazy-load anything that breaks the budget.

**Acceptance:** no visual regression in RTL; axe 0; keyboard-only; iOS zoom avoided; the form still renders from `FieldDef` only.

### Phase 4 — Step content and results (~4–6 days)

**Goal:** make the hard steps understandable and show the user what their answers produce.

- [ ] Credits: 3 groups + coordination; plain-language descriptions; legal reference secondary; "עוד סעיפים" collapsed; selected-count summary.
- [ ] Income: option descriptions; start date constraints; warning placement.
- [ ] Status: sections for personal/residence/fund/spouse; health fund select.
- [ ] Children: explained skip/empty state; age chips; >5 warning.
- [ ] Contact: city picker; remove or reword email; address group.
- [ ] Employer: readonly lock badge; unknown toggle; prefill diff.
- [ ] Review summary from `derive()` + `documentChecklist()`; one `DocumentView`.
- [ ] Final step: declaration + signature + download; stale-signature state.
- [ ] Completion panel: file name, re-download, share, print, what now, start new.

**Acceptance:** credits step fits one screen on desktop and ~1.5 on mobile; the user can explain what they claimed; completion is visible after download; no legal copy changed.

### Phase 5 — Polish and verification (~2–3 days)

- [ ] Print CSS: page breaks, signature, attachments, margins.
- [ ] Empty/loading/error states for every async action (`UEmpty`, skeleton where relevant).
- [ ] Microcopy pass (gender, second person, no legalistic filler, no false promises).
- [ ] Visual QA at 360/390/768/1280/1440; 200% zoom; keyboard; reduced motion.
- [ ] E2E: full flow, passport flow, resume, delete all, import/export, stale signature, completion, English, mobile sticky.
- [ ] axe on all routes; perf budget; update `docs/IMPLEMENTATION.md` + ADRs; update `PLAN.md`.
- [ ] Optional: dark mode (`UColorModeButton`) if it does not complicate the design; otherwise remove `color-scheme: light dark` confusion.

**Acceptance:** `bun run verify` green; screenshots approved; no console errors.

---

## 9. Acceptance criteria and metrics

### Functional

- 9 counted steps; step count/names always visible; no dead rail click.
- Resume from draft in one click from home; delete-all removes draft + attachments.
- Every optional step can be skipped explicitly; every skipped step is explained.
- PDF download produces the official form + attachments; completion panel appears; re-download works.
- Changing an answer after signing requires a new signature before download.
- English UI has no Hebrew UI copy (official document/declaration may stay Hebrew; decision D3).

### Accessibility

- axe 0 on `/`, `/employer`, all form steps, `/print`, `/accessibility`, `/privacy`.
- Keyboard-only: home → employer → full form → sign → download.
- 44px targets; 52px primary on mobile; visible focus; no keyboard trap; screen-reader labels for dynamic groups.
- Step changes announced; save status announced politely; errors focus the summary then the field.
- `prefers-reduced-motion` respected.

### Performance

- First-load JS ≤260KB gzip (existing budget); PDF lazy.
- LCP ≤2.0s slow 4G; CLS 0.
- No network requests after load (privacy gate still green).

### UX (measured without analytics)

Run 5 task-based usability sessions (Hebrew speakers, at least 2 on mobile):
- Can they start, resume, and finish without help?
- Can they explain what credits they claimed?
- Do they find "delete all" and trust it?
- Time to complete and error count per step.
- SUS or 5-question satisfaction.

No telemetry is added; this stays consistent with the privacy promise.

---

## 10. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Scope creep / a 3-week refactor stalls | Phase 0 + 1 first; each phase is shippable; keep the "minimum lovable" cut. |
| Nuxt UI bundle growth | Measure after each phase; lazy-load heavy pieces; keep custom components where they earn their keep. |
| RTL bugs in third-party components | Spike `UStepper`/`UTabs`/`UFileUpload`/`USlideover` in RTL before committing; keep logical CSS. |
| Legal copy drift | Never translate/alter the declaration; version it; keep the official Hebrew document independent of UI locale. |
| Draft migration | Schema v2 migration + fixtures; test old envelope import. |
| Concurrent uncommitted work | Rebase/coordinate before Phase 3 (the working tree already has validation changes); no reverts. |
| "One more feature" | Explicit non-goals: no accounts, no analytics beyond the reviewed Umami page-view tag (ADR-0008), no tax calculation, no multi-year in this refactor. |

---

## 11. Open decisions (please confirm)

**D1 — Step model.** Remove the intro and merge review+sign into 9 steps? *Recommendation: yes.* Alternatives: keep review/sign separate (10 steps), or keep all 11.

**D2 — Attachments.** Keep as an optional step, or fold into the final step? *Recommendation: keep separate + clear "לא חובה" and skip.*

**D3 — English.** Full UI localization while the official document/declaration stays Hebrew? *Recommendation: yes; add an English "translation for convenience" only next to the Hebrew declaration, never replacing it.*

**D4 — City.** Bundle a city list (~1,300) and use `UInputMenu` with free text? *Recommendation: yes. No street autocomplete; street stays free text.*

**D5 — Email.** Remove the employee email field (nothing sends email), or reword it? *Recommendation: remove it; it is not on the official form and the current help text promises a capability that does not exist.*

**D6 — Backup scope.** Export answers only (current) and label it clearly, or include attachments? *Recommendation: answers only + explicit label; attachments are large and sensitive.*

**D7 — Credits layout.** Grouped headings + collapsed long tail, or split into two steps? *Recommendation: grouped headings + collapsed long tail first; split only if testing shows overload.*

**D8 — Tax year.** Show a fixed "שנת המס 2026" badge (no field), or a select? *Recommendation: badge. The current schema is single-year; a select would lie.*

**D9 — Employer page extras.** Keep fingerprint/JSON under "פרטים טכניים", or remove? *Recommendation: keep collapsed for support; not in the main flow.*

**D10 — Dark mode.** Add now, or explicitly defer? *Recommendation: defer; do not ship a half-tested dark theme.*

**D11 — Signature enforcement.** Hard-block export until re-sign after a change, or warn? *Recommendation: hard-block + clear message, because a signature over changed data is not the signed document.*

---

## 12. What I would do first (if approved)

1. **Phase 0** in one PR: the correctness/trust fixes. This alone removes the "broken" feeling.
2. **Phase 1** in one PR: shell + Heebo + home/employer rebuild + legal pages. This makes it look like a product.
3. **Phase 2** in one PR: 9-step model + rail/mobile progress + sticky action bar + draft menu. This fixes the navigation.
4. Then Phase 3 (controls), Phase 4 (content/results), Phase 5 (polish), each independently shippable.

If you want the fastest visible improvement, do **Phase 0 + Phase 2** first and keep the current look for a week; the form will already feel dramatically shorter and safer.

---

## Appendix A — copy changes to decide/apply

| Current | Problem | Suggested |
| --- | --- | --- |
| "מצב מסמך מלא" (print button) | Says "view" but prints | "הדפסה" / "תצוגת המסמך" |
| "התחלת מילוי" always | Ignores an existing draft | "המשך מהטיוטה" when a draft exists |
| "אפשר למחוק הכול בקליק" | No such button | Add the button, or remove the claim |
| "המייל משמש רק אם תרצו לשמור עותק" | No email is sent | Remove field or "לשימוש עצמי" |
| "יש תשובות מוסתרות" on conflict | Wrong meaning | "הטיוטה עודכנה בטאב אחר" |
| "מסמכים לצירוף" duplicate heading | Redundant | One heading, one intro |
| "חובה" star on optional upload | Contradicts the copy | "מומלץ" |
| "סעיף 7." as the label | Legalistic | Plain label + "סעיף 7" badge |
| "הנתונים לא נשלחו לשום מקום" every step | Repetition | Keep once in the header/footer + welcome |

## Appendix B — files most affected

```
app/app.vue
app/layouts/default.vue                  (new)
app/layouts/wizard.vue                   (new)
app/components/layout/SiteHeader.vue     (new)
app/components/layout/SiteFooter.vue     (new)
app/components/layout/SaveStatus.vue     (new)
app/components/layout/DraftMenu.vue      (new)
app/components/form/StepRail.vue         (new)
app/components/form/StepProgress.vue     (rewrite)
app/components/form/FormActionBar.vue    (new)
app/components/form/FormField.vue        (rewrite around UFormField)
app/components/form/FormRepeat.vue       (rewrite)
app/components/form/FormSignature.vue    (UTabs + keep canvas)
app/components/form/DocumentUploads.vue  (UFileUpload)
app/components/form/DocumentView.vue     (new, replaces ReviewList visual role)
app/components/form/CompletionPanel.vue  (new)
app/pages/index.vue                      (UPage*)
app/pages/employer.vue                   (UForm + two states)
app/pages/form.vue                       (orchestrator, much smaller)
app/pages/print.vue                      (DocumentView + toolbar)
app/pages/accessibility.vue              (new)
app/pages/privacy.vue                    (new)
app/form/schema.ts                       (step model v2)
app/form/engine.ts                       (visibleIndex, step id)
app/composables/useFormStore.ts          (save state, reset, conflict)
app/composables/useDraftSummary.ts       (new)
app/assets/css/main.css                  (Heebo, tokens, sticky/print)
app/locales/he.ts, en.ts                 (new copy, remove dead keys)
tests/*                                  (migrations, step navigation, signature)
tools/e2e/*                              (new scenarios)
```

---

### One-sentence version

The current app is a correct, private, accessible **prototype** with a navigation and design layer that has not caught up to the idea; the refactor should keep the engine, replace the shell and controls with Nuxt UI, cut the form to 9 honest steps, make the hard steps explain themselves, and end with a real result screen.
