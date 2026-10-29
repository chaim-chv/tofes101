---
id: competitor/content-strategy
title: Competitor content & SEO strategy (and what we must write ourselves)
type: finding
status: verified
confidence: verified
updated: 2026-10-29
tags: [competitor, content, seo, docs]
sources: [source/tofes101-itc101-landing, source/tofes101-docs-tax-reductions, source/tofes101-docs-tax-adjustment, source/tofes101-docs-faq, source/tofes101-engine-bundle, source/tofes101-legal-pages]
related: [competitor/site-map, competitor/flow-calculators, product/scope-v1, product/personas]
up: index
---

# Content & SEO strategy

**Hard rule first:** every page of their site carries
"תוכן האתר מוגן ברישיון Creative Commons BY-NC-SA 4.0" in the footer. That licence is
non-commercial **and** share-alike — incompatible with our product even with attribution.
So: this node records *structure, topics and facts only*; every sentence we ship must be
written by us. Numbers (credit-point values, thresholds, ages) must come from the law
sources, not from their pages.

## 1. The pattern: one page per *task*, keyword in the title, not the H1

Their titles are formulaic: `{topic} - {benefit} | טופס 101`, description ~150 chars,
keywords array still present. The H1 is the *noun phrase*, the title adds the benefit.

| Route | `<title>` | H1 | Intent | Words |
| --- | --- | --- | --- | --- |
| `/` | טופס 101 מקוון: מלא ושלח בחינם מהמחשב ומהסמארטפון | טופס 101 מקוון | brand + head term | 243 |
| `/forms/itc-101/` | טופס 101 - כרטיס עובד מקוון | טופס 101 - כרטיס עובד | transactional | 237 |
| `/forms/itc-101/organizations/` | טופס 101 לארגונים - צרו קישור למילוי על ידי העובדים | טופס 101 - כרטיס עובד \| שירות חינמי למעסיקים | B2B | 136 |
| `/forms/itc-119/` | טופס 119 - בקשה להקלה ולתיאום בחישוב המס | same | transactional | 44 |
| `/forms/bank-account/` | טופס פרטי חשבון בנק להעברת משכורת | same | transactional | 94 |
| `/forms/itc-1516/` | טופס 1516 - בקשה לפטור ממס הכנסה לנכים | same | transactional + explainer | 542 |
| `/docs/introduction/` | מהו טופס 101 | מהו טופס 101 | informational head | 260 |
| `/docs/online-form/` | טופס 101 מקוון | טופס 101 מקוון | "how does the online one work" | 399 |
| `/docs/online-form/faq/` | שאלות נפוצות - טופס 101 מקוון | שאלות נפוצות | long-tail questions | 174 |
| `/docs/tax-adjustment/` | תיאום מס | תיאום מס | high-value pillar | 853 |
| `/docs/tax-reductions/` | זיכויים ממס | זיכויים ממס | pillar | 581 |
| `/docs/tax-reductions/children/` | נקודות זיכוי עבור ילדים | same | long-tail | 894 |
| `/docs/tax-reductions/newcomer/` | נקודות זיכוי לעולה חדש | same | long-tail | 446 |
| `/forms/vat-calculator/` | מחשבון מע"מ - חישוב מע"מ מכל סכום | מחשבון מע"מ | tool | 56 |
| `/fill-form-101-english/` | 101 Form (Tofes 101) Online - In English | — (app shell) | English speakers | 2 |

Two deliberate choices worth copying:
- **The title carries the query, the H1 carries the object.** "מחשבון מע"מ - חישוב מע"מ
  מכל סכום" ranks for the tool; the H1 stays clean for humans.
- **The landing page is the SEO page; the app is not.** `/submit/` has no H1 and no
  indexable text (2 words). They never try to rank the form itself — the form is a
  conversion step, and its metadata exists only to harvest the "מילוי ושליחה" query.

## 2. The docs tree is the real asset (21 pages, 5 sections)

```
מבוא (3)            מהו 101 · PDF להדפסה · ארכיון 2011–2025
טופס 101 מקוון (5)  העמוד הראשי · FAQ · צירוף מסמכים · טופס מותאם לארגון · בורר תאריכים
תיאום מס (1)        pillar, 853 words, 4 routes + limits + worked examples
זיכויים ממס (11)    hub + 10 eligibility pages (resident, female, youth, children,
                    child-support, unemployed spouse, studies, service, newcomer,
                    returning resident)
+ מדריך מזונות (5)  a separate tree (introduction, authority, children's needs,
                    parents' income, misc)
```

**Pedagogy (consistent across the cluster):**
1. Definition in one sentence, in plain Hebrew.
2. "Who is eligible" as a bullet list of life situations, not legal categories.
3. "How much" as a number **plus a worked example** (they use LaTeX-ish formulas; the
   example is what makes it land).
4. "What to do" — which section of the form, which document to attach.
5. A "read more / related" list, and a repeated left sidebar with all 21 pages.

The hub pages (`זיכויים`, `תיאום מס`) are 600–900 words; the children are 120–900. The
short ones (female 118, youth 124, resident 144) are effectively stubs that exist for
the query — a legitimate strategy, and a signal that *coverage matters more than depth*
for the long tail.

**Weaknesses to beat:**
- **Frozen numbers.** `tax-adjustment` says "נכון לשנת 2016", 48 % max rate, 444,480 ₪
  cap; `tax-reductions` uses 216 ₪ per credit point "בשנת 2016". The form itself says
  "מעודכן לשנת 2026". A user in 2026 is reading 2016 figures on a page that claims to
  be current.
- **Docs never deep-link into the form.** Every guide ends with a generic "fill the
  form" link; the "read about this credit" bubbles inside the form link **out** to
  kolzchut. Their own content and their own product do not talk to each other.
- **No glossary, no index, no search.** 21 pages navigated only by a sidebar.
- **12 of 15 FAQ entries are empty.** Including "I sent it to the wrong address" and
  "how do I send to several employers".
- **English is a separate form**, not a translation layer — so it drifts.

## 3. Keyword surface (what we would target, not what they wrote)

| Cluster | Head query | Supporting | Page type |
| --- | --- | --- | --- |
| Form 101 | טופס 101 | טופס 101 2026, כרטיס עובד, טופס 101 למילוי online, טופס 101 PDF | landing + app |
| Filing mechanics | איך ממלאים טופס 101 | מה זה טופס 101, מתי ממלאים, טופס 101 באנגלית | guide |
| Employers | טופס 101 למעסיקים | קישור למילוי טופס 101, טופס 101 לארגון, טופס 101 דיגיטלי | B2B landing |
| Credits | נקודות זיכוי | נקודות זיכוי 2026, זיכוי ממס, טבלת נקודות זיכוי | hub + 10 children |
| Coordination | תיאום מס | תיאום מס אונליין, טופס 116, 48% ניכוי מקסימלי | pillar |
| Adjacent forms | טופס 119 / 1516 / 106 / bank details | — | landing per task |
| Tools | מחשבון מע"מ / מחשבון אחוזים / מחשבון הודעה מוקדמת | — | tool |
| Trust | מי עומד מאחורי האתר, האם זה מאושר ע"י רשות המסים | — | about/trust |

Note the trust queries are **not** targeted by them, even though their FAQ answers them.
That is our opening (see §5).

## 4. What we must write ourselves — page by page

Minimum original content for v1 (Hebrew, RTL, ~4,000 words total). Each row is an
outline, not a draft.

1. **`/` home** — 150–250 words. One sentence on what the site does; the three-step
   "fill → check → download"; the privacy claim with a one-line mechanism ("your answers
   never leave this browser"); two CTAs (employee / employer). No form grid in v1.
2. **`/101/` landing** — 400–600 words. Who must file and when; what the employer does
   with it; what you get at the end (PDF + print); what you need before you start
   (ID, employer's deduction file number, spouse/children details, certificates);
   the 5 things people get wrong (ID digits, income type, credit items, tax
   coordination, forgetting to sign); FAQ ingress. This page must be *better* than
   their 237-word page at answering "will my employer accept it".
3. **`/101/employer/`** — 300 words. What a template link is, what it pre-fills, what it
   explicitly does **not** collect, how to send it, how the employee returns the file.
4. **`/guides/` hub + 6 guides** (~600 words each). Topics, in this order of value:
   (a) מהו טופס 101 ומתי ממלאים; (b) תיאום מס — 4 routes; (c) נקודות זיכוי — how points
   work + which 16 items exist on the form; (d) טופס 119; (e) נספח המסמכים — what to
   attach and why; (f) למעסיקים — what to check on a returned 101.
   Each guide ends with a **deep link into the exact section of the form** (our
   advantage: we own both sides).
5. **`/about/`** — who we are, why the site exists, how it is funded ("it isn't: no ads,
   no accounts, no data"), what we cannot do (not affiliated with the Tax Authority, not
   tax advice), how to report a bug.
6. **`/privacy/`** — short and specific: "no server receives your answers; drafts are in
   this browser; the only network request is loading the app". Must be *true by
   architecture*, not by policy.
7. **`/accessibility/`** — real statement: what we tested, with what, known gaps,
   contact. Their statement claims AA and lists Ctrl+/- as an "adjustment"; we can be
   specific (keyboard map, screen-reader pass, focus order, 200 % zoom).
8. **`/faq/`** — answer the 12 questions they left empty. That is free differentiation:
   wrong email, several employers, "my attachment didn't appear", "I made a mistake",
   "my city isn't listed", "I'd rather use paper".

**Content we should NOT write in v1:** child support (family law), long-term-care
insurance claims, police certificates, COVID-era forms, the 19-form historical archive.

## 5. The trust content they cannot copy

Their own pages hand us the material:

- FAQ: "we built this form **as a marketing tool**" + "do you sell my data? **כן**".
- Privacy §2: funding via ads, commercial collaborations, market research, **cross-
  referencing with other databases**; §7.9 data survives a merger.
- Terms: written for the **paid** SaaS, last touched 2019, while privacy was rewritten
  10 days ago — i.e. the legal surface is inconsistent.
- Cookie policy lists GA, Google Ads, Meta, AdSense, Sentry and a
  `tpFirstTouch` sessionStorage entry that attributes the *form submission* to an ad
  campaign.

Our trust page is therefore not marketing fluff, it is a **comparison table**: what they
collect vs what we can technically collect (nothing). That is the one piece of content
where being a small static site is the argument.
