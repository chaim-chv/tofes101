---
id: competitor/flow-employee
title: Competitor flow — employee fills form 101 (screens, states, copy)
type: finding
status: verified
confidence: verified
updated: 2026-10-29
tags: [competitor, flow, employee, form-101, copy]
sources: [source/tofes101-docs-online-form, source/tofes101-itc101-landing, source/tofes101-runner-app, source/tofes101-form-runner-api, source/tofes101-sitemap]
related: [flow/form-101-service, competitor/flow-employer, product/personas, competitor/feature-parity]
up: index
---

# Employee flow — from Google to a PDF in the employer's inbox

Field-level content (the 10 sections, 160 fields, validators) is already specified in
[flow/form-101-service](../flow/form-101-service.md) and
[flow/form-101-field-spec](../flow/form-101-field-spec.md). **This node covers the
screens around the fields** — entry, framing, outputs, errors, and the copy that does
the work — plus what we could and could not observe.

Confidence note: the runner is client-rendered inside an iframe, so the *post-submit*
screen and the pre-form gate were not directly observable without a browser. Everything
below marked **(copy)** was read from the live DOM/schema; **(inferred)** is
reconstruction from the docs + schema flags, and is labelled as such.

## 1. Screen map

```
[0] entry           home CTA / landing CTA / footer / direct URL / English page
      │
[1] /forms/itc-101/submit/      full-viewport overlay + iframe
      │   loading state: spinner + "טוען טופס…"  (only server-rendered text)
      ▼
[2] runner boot      AngularJS overlay (#tp-pre-angular-overlay) → app
      │
[3] in-form intro    title + official instructions + 3 alerts + tax-year chooser
      │
[4] sections א→י     one long scrolling page, 10 lettered panels (+ appendix)
      │   conditional panels appear/disappear; ads interleaved; help bubbles
      ▼
[5] bottom gate      privacy+terms radio · marketing-consent radio · (ad panel)
      │
[6] action bar       send by email · save as PDF · save draft   (below the form)
      │
[7] outcome          /form-submitted/ · PDF downloaded · draft link shown
```

Evidence: `/submit/` HTML contains exactly one element in `<main>` — a
`fixed inset-0` div with a spinner and `טוען טופס...`, then an iframe titled
`טופס מקוון` pointing at `forms.tofes101.co.il/f/<id>?data=…` **(copy)**.
`/form-submitted/` exists and is `Disallow`ed in robots.txt — i.e. there **is** a
dedicated post-submit route, not a modal **(verified by robots.txt)**.

## 2. Screen by screen

### [1] Loading / framing

- The Next.js page is a **shell**: nav + footer + one full-screen overlay. There is no
  H1, no intro text, no breadcrumb on the page that actually hosts the form. The H1 and
  the trust copy live on the *landing* page one click earlier.
- The iframe is `title="טופס מקוון"`, `allowfullscreen`, `class="h-full w-full border-0"`,
  inside `min-h-[80vh]`; overlay is `z-[60]`, so it covers the site nav while loading.
- `?data=` carries `{"seo":{"sourceType","landingUrl","parentUrl","capturedAt"}}` — the
  iframe receives where the user came from **(copy)**. This is attribution plumbing, not
  functionality, but it tells us the runner is designed to be embedded anywhere.

### [3] In-form intro (the "before you start" screen)

There is **no separate wizard step**. The intro is an `eHtml` block at the top of the
form, followed by three alerts **(copy, from schema)**:

- Title block: "טופס 101 / כרטיס עובד - ובקשה להקלה ולתיאום מס על ידי המעסיק / לפי תקנות
  מס הכנסה (ניכוי ממשכורת ומשכר עבודה), התשנ״ג - 1993".
- Instructions: who fills it and when ("every employee at the start of employment, and at
  the start of every tax year unless the manager approved otherwise"), what it is for
  (basis for withholding reliefs and coordination), and the 7-day duty to report changes.
- Alert 1: link to the **English version**.
- Alert 2: "הטופס מעודכן לשנת 2026" + a 4-item "at the bottom of the page you can:"
  list — download a PDF of what you filled / email it to yourself and the employer /
  **save a draft and continue later** / link to FAQ if you have a question.
- Alert 3 (legal): "שירות חינמי המופעל ע״י חברת Tepez… מימון הפעילות מבוסס בין היתר על
  פרסומות… שימוש מסחרי בפרטי המשתמש והעברתם לשותפים עסקיים… **הטופס אינו מופעל או
  מקושר עם רשות המסים**".

Then the **tax-year chooser** (locked to the current year; December offers next year,
January offers previous year — see [flow/form-101-service](../flow/form-101-service.md)).

*Design read:* this is the whole "how it works" surface. Four sentences and a link. Our
version can do better with a real 3-step preview, but note the copy is doing something
clever — it answers "is this official?" and "will I get a file?" *before* the first field.

### [4] The form proper

- One scrolling page, numbered panels א→י, no progress bar, no step counter, no
  per-section validation gate. `secType: panel|well` gives the visual hierarchy.
- Conditional sections **collapse to an alert instead of vanishing**: e.g. section ו
  when not married shows "חלק זה רלוונטי רק אם הינך נשוי/אה"; children for a passport
  holder shows "חלק זה אינו רלוונטי משום שהינך מזוהה עם דרכון זר". Section ז is *only*
  such an alert (the printed "changes during the year" block is deliberately replaced
  by an explanation).
- Help is delivered as `helpBub` bubbles (a "?" next to the label) plus `helpText`
  under it. Many strings link out to kolzchut ("קרא על זיכוי זה באתר כל זכות") — the
  competitor outsources explanation instead of writing it in-page.
- Ads: AdSense unit `8819230191` appears 4× between sections, plus the full lead-gen
  panel after the declaration (see
  [competitor/monetization-and-tracking](monetization-and-tracking.md)).

### [5] Bottom gate (before any output)

Two required radios, both timestamps recorded into hidden fields **(copy)**:

1. `אני מאשר/ת את מדיניות הפרטיות ו<a>תנאי השימוש</a> באתר` — yes/no.
2. `אני נותן/ת את הסכמתי המפורשת לכך שטפז תהיה רשאית להעביר את המידע האישי שמסרתי
   למפרסמים, חברות מחקר, חברות סקרים, שותפים עסקיים וגורמים מסחריים נוספים…` — yes/no,
   **required to submit**, with an A/B-test variant field stored alongside.

*This is the single most important screen in the product for our positioning.* A tax form
that will be sent to the user's employer cannot be submitted unless the user also
answers yes-or-no to "may we hand your details to advertisers". The consent text is ~55
words of legalese at the end of a long form.

### [6] Action bar

Three actions, all at the bottom of the page **(copy via docs)**:

| Action | Behaviour | Notes |
| --- | --- | --- |
| `שלח באימייל` | validates; on success inserts answers into the official 101 PDF and emails it to **employee + employer** | blocking validation; errors mark fields red |
| `שמור PDF` | renders the PDF locally; allowed any number of times, **even with unanswered questions** | fields with *invalid* values are dropped from the PDF |
| `שמור טיוטה` | returns a **link** that "is like a password" — anyone holding it can open the form | can be emailed to yourself; explicit warning not to send it to the employer |

`showActionBar: false` in the schema means the action bar is the runner's own, not
schema-driven — so its exact labels are the runner's defaults, not per-form copy.

### [7] Outcome

- `/form-submitted/` (exists, noindexed) is the success route. Its copy was not captured.
- Practical "what now", assembled from the docs: the email arrives with the PDF
  attached for both parties; the user can re-download the PDF later *only* from the same
  draft link, because nothing is stored under an account.
- No account, no history, no "my documents". The email *is* the archive. The site even
  sells this as a feature: "לעולם לא תאבדו טופס — חפשו את הטופס בתיבת האימייל".

## 3. States: error · back · refresh · resume

| Event | Reference behaviour | Evidence |
| --- | --- | --- |
| invalid field on send | send blocked; a message appears; **all** offending fields marked red; fix then resend | docs/online-form **(copy)** |
| invalid value + PDF | the field is **silently omitted** from the PDF (e.g. bad ID number) | docs/online-form **(copy)** |
| navigate away with unsaved work | `unsavedMessage: true` → runner asks for confirmation | schema flag **(verified)**; exact string not captured |
| refresh / close tab | answers are gone unless a draft was saved; a local copy may survive via the runner's IndexedDB (Dexie) store | Dexie is loaded by the runner **(verified)**; autosave granularity **(inferred)** |
| back button | single-page app; browser back leaves the form (no in-app history) | **(inferred)** from ui-router single view |
| resume | open the draft link → form repopulates from the server draft | docs **(copy)** |
| wrong email sent | FAQ question exists — **no answer published** | FAQ **(copy)** |
| several employers | FAQ question exists — **no answer published** | FAQ **(copy)** |

## 4. Copy inventory (what we would have to write ourselves)

Reusable *ideas* (never their sentences): the 4-line "what you'll get at the bottom"
list; "the file you receive is a normal, standard 101"; "no printing, no scanning";
"only the parts relevant to you are shown"; "sign with a mouse or a finger".

Copy we must **not** reuse, and must actively replace:
- the funding/advertising disclosure (we have nothing to disclose);
- "the form is not operated by or affiliated with the Tax Authority" — we do need an
  equivalent, but ours is stronger: "everything stays in your browser; we never see it";
- the marketing-consent radio (we delete the concept, not just the wording).

## 5. Friction that the flow creates (and that we can remove)

1. **Two clicks of framing** (landing → submit) and then a spinner inside a page with no
   heading; the user's first impression of the product is a loading state.
2. **No progress model.** 10 panels, no "3 of 10", no estimate, no save reminder. A
   20-minute form with no sense of position.
3. **Validation at the end only.** The docs describe the failure mode precisely: you
   reach the bottom, press send, and get a wall of red fields above you.
4. **Silent data loss in the PDF** for invalid values — the user believes they sent a
   complete form.
5. **The draft link is a bearer token** with a warning not to share it, plus a second
   warning not to email it to the employer. Two warnings about the delivery mechanism is
   a smell.
6. **The consent gate sits between the user and their own document**, and one of the two
   consents is a data-sale opt-in.
7. **The FAQ has 12 unanswered questions**, including the two most common failure modes
   (wrong email, several employers). Support load is pushed to `info@tepez.co.il`.
