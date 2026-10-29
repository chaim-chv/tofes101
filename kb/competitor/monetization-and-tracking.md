---
id: competitor/monetization-and-tracking
title: Competitor monetisation, ads and tracking (what we refuse to do)
type: finding
status: verified
confidence: verified
updated: 2026-10-29
tags: [competitor, monetization, privacy, tracking, trust]
sources: [source/tofes101-form-runner-api, source/tofes101-docs-faq, source/tofes101-legal-pages, source/tofes101-site-home]
related: [competitor/flow-employee, competitor/content-strategy, product/scope-v1, product/personas]
up: index
---

# Monetisation & tracking

The "free" claim is true and load-bearing: `חינם` is in the nav ("כל השירותים — לגמרי
בחינם"), in the hero, and in a fixed disclaimer paragraph on every form landing ("השירותים
באתר ניתנים בחינם, ללא כל עלות. מימון הפעילות מבוסס בין היתר על פרסומות…").

What it costs the user is the rest of this node.

## 1. Three revenue streams, in order of importance

### (a) Lead-gen inside the form — the main one

The 101 form definition ends with an ad block (`cSection:bottomCustom → adWrap → adPanel`)
that renders **after the declaration and before the privacy gate**. It is not a banner:
it is a second, monetised questionnaire.

`auxData` in [start.json](../sources/tofes101-form-runner-api.md):

- `_vars = {active: true, campaignName: "tofes101", formTitle: "טופס 101", env: "prod"}`
- `advertisers` = 5: **סלע ביטוח מבית מיטב** (`selam`), **עילית ביטוח מבית הפניקס**
  (`elite`), **כלל ביטוח ופיננסים** (`clalbit`), **כלל פנסיה וגמל** (`clalbit-p`),
  **קופת חולים לאומית** (`leumit`).
- `ads` = **13 creatives**, each with `segment` (`ins1`, `fin1`, `fin2`), a gendered
  `heading`/`mainText` pair (male/female forms of address), `subText`, `showLogo`,
  sometimes `nextStep`.
- Selection logic (schema `eEq`): sample a segment the user is in → sample an advertiser
  in that segment → sample a creative; `forceSegment` can override; inactive campaigns
  render nothing.

Ad copy is written as advice, e.g. "התחלת עבודה חדשה? קח רגע וטפל בפנסיה!" (clalbit-p),
"עוד שנה בעבודה? רוב הסיכויים… שאתה משלם יותר מידי! על הכסף של עצמך" (selam), with the
reassurance "*השיחה ללא עלות וללא מחויבות*". Each ad then asks 1–3 qualifying questions:

- pension: do you already have a fund? when should we call (morning/noon/afternoon)?
- insurance: do you pay more than 250 ₪/month for private insurance? when to call?
- investment: do you have more than 100k ₪ in study/gemel funds?
- `leumit`: "when should we call you?" with an explicit opt-out
  "אני לא מעוניין לשמוע על הצטרפות ללאומית".
- one `excellentisrael` variant asks about fitness goals and a free trial lesson.

The validator text is the honest part: *"עם שליחת הטופס נעביר את פרטי ההתקשרות שלך
ל{{ advertiser.shortName }}"*, and the decline path says *"לא נעביר את פרטי ההתקשרות"*.
So the mechanism is: **answer "yes" to a marketing question inside your tax form and your
contact details go to an insurer.**

### (b) Display ads

`eAdSenseAdUnit` with `adSlot: 8819230191` appears **4×** in the schema, between sections
(employee, children, income, credits). Plus Google Ads / DoubleClick beacons observed on
load (see §2). The cookie policy documents `__gads`, `__gpi`, `__eoi`, `_gcl_au`,
`_gcl_aw`, `_gcl_dc`, `_gac_*`.

### (c) Data & SaaS

- Privacy §2: funding also via "מחקרי שוק, סקרים, **הצלבות נתונים ממאגרי מידע אחרים**,
  פעילויות שיווקיות ושימושים מסחריים במידע".
- §7.8: with consent, transfer to business partners/advertisers/research firms of contact
  details, demographics, usage data, "מאפיינים כלליים".
- §7.9: data (including marketing/research databases) transfers in a merger/acquisition.
- The employer-side promo is for **עובדיםIO** (paid onboarding SaaS), and the about page
  sells **Tepez** (paid form platform) — the free site is the top of that funnel.
- FAQ `about_us`, verbatim: they built the form **"ככלי שיווקי להצגת יכולות המערכת"**.
- FAQ `sell_data`, verbatim answer: **"כן."**

## 2. Tracking actually observed on the 101 submit page

From `research/raw/network.json` (171 requests, one page load) and the cookie policy:

| Vendor | Identifier / endpoint | Purpose |
| --- | --- | --- |
| Google Tag Manager | `GTM-54CTX27`, `GTM-WBBV7DQ` | two containers, one on the site, one in the runner |
| GA4 | `G-JS7WRFHQZE` (`/g/collect`, `analytics.google.com`) | page views, events |
| Google Ads / DoubleClick | `ad.doubleclick.net/ccm/s/collect`, `stats.g.doubleclick.net`, `google.com/ccm/collect`, `google.co.il/ads/ga-audiences` | remarketing, conversion linking |
| AdSense | `__gads`, `__gpi`, `__eoi` | display ads |
| Meta | `_fbp`, `fr` (per cookie policy) | ad attribution |
| Sentry | `o10531.ingest.us.sentry.io`, `sentry.javascript.browser/7.120.2` | error monitoring (claims IP/user scrubbing when declined) |
| First-party | `tpFirstTouch` in **sessionStorage** | attributes the *form submission* to the ad campaign that brought the visitor |

That last one is the interesting piece: the attribution token is read from
sessionStorage, packed into the iframe's `?data={"seo":{sourceType,landingUrl,parentUrl,
capturedAt}}` parameter, and travels into the form submission. The tax form is a
conversion event in an ad funnel.

Also observed: 3 console errors `418 (Blocked by NetFree)` — the page is browsed on
filtered networks and the ad/tracking calls fail there. So a meaningful share of users
get a partially broken page for the benefit of ads that never render.

## 3. Consent architecture (and why it is the story)

Two consents, both **required to submit**, at the very bottom of a long form:

1. privacy policy + terms — yes/no;
2. **explicit consent to transfer personal data to advertisers, research firms, survey
   companies, business partners, "and additional commercial entities"** for contact,
   direct mailing, market research, surveys, marketing "including approaches in insurance
   and finance" — yes/no, with a stored A/B variant.

Note what this means legally/UX-wise: the *service* is conditioned on answering a
data-sharing question, and the answer must be given *after* the user has typed their ID
number, children's ID numbers, employer, and salary. The privacy policy (§2.3) even says
that in some cases the service may be conditioned on consent. The decline path exists —
but it is a radio at the end of a 20-minute form.

## 4. The legal surface, scored

| Page | Last updated | Problem |
| --- | --- | --- |
| privacy | 19.10.2026 | current, and explicitly describes the data business |
| cookies | 06.08.2026 | current; documents GA/Ads/Meta/Sentry and the attribution key |
| accessibility | 10.08.2025 | claims AA; lists Ctrl+/- zoom as an accessibility feature; no test method, no known-gaps list |
| terms | **20.11.2019** | written for the **paid** Tepez SaaS ("התשלום עבור המערכת", "תקופת ניסיון", refunds); does not describe the free consumer service it governs |

The mismatch is itself a finding: 7-year-old terms attached to a 2026 product whose
privacy policy was rewritten 10 days ago, plus a required consent to sell data. For a
document that carries a person's ID number and salary, that is the trust gap.

Smaller signals: a visually hidden `do not click` link to `/admin-portal-archive` in the
footer of every page (also disallowed in robots.txt); `keywords` meta on every page;
`info@tepez.co.il` as the only support channel.

## 5. What we do instead (and how to say it)

| Dimension | Them | Us (v1) |
| --- | --- | --- |
| Third-party scripts | GTM ×2, GA4, DoubleClick, AdSense, Meta, Sentry | **zero** — no analytics, no error reporting, no fonts/CDN |
| Cookies | 12+ first/third-party | **zero**; drafts in IndexedDB/localStorage, never sent |
| Ads | 4 AdSense units + a lead-gen panel inside the form | none, ever |
| Data reaching a server | answers, attachments, email, employer address | **none** — the app is static files; the only request is fetching the app itself |
| Consent to sell data | required radio at submit | concept does not exist |
| "Free" claim | free + ads + data | free because there is no marginal cost per user |
| Third-party error monitoring | Sentry with user context | none; errors stay in the console |

### The communication, in three concrete artefacts

1. **A one-line promise with a mechanism, not a policy:** "כל מה שאתה ממלא נשאר בדפדפן
   שלך. אין שרת שמקבל את הטופס — אפשר לבדוק את זה בכל רגע ב-DevTools."
2. **A verifiable claim on the trust page:** a short "how to check us" block — open the
   Network tab, fill the form, see zero requests; turn off Wi-Fi mid-form and finish it.
   A claim that can be falsified in 30 seconds is worth more than a policy page.
3. **A comparison table** (their collection vs ours) using *their own published facts* —
   the FAQ answer "כן", the privacy §7.8, the cookie table — with links. Not
   "competitors are bad", just "here is what each site does, you choose".

Do **not** claim: "the Tax Authority approves us", "100 % secure", "legally binding
signature". Their own disclaimer says the opposite of the first, and we have no basis for
the other two. Our honest line: "we produce a standard 101 PDF that you sign and hand to
your employer; we are not the Tax Authority and this is not tax advice."
