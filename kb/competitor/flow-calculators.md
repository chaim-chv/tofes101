---
id: competitor/flow-calculators
title: Competitor calculators — what exists and what it computes
type: finding
status: verified
confidence: verified
updated: 2026-10-29
tags: [competitor, calculators, tools, seo]
sources: [source/tofes101-engine-bundle, source/tofes101-site-home]
related: [competitor/site-map, competitor/content-strategy, product/scope-v1, competitor/feature-parity]
up: index
---

# Calculators

`getCalculators()` in the site bundle
([source/tofes101-engine-bundle](../sources/tofes101-engine-bundle.md)) is literally
`getAllForms().filter(f => f.type === Calculator)` — so calculators are form-registry
entries, not a separate system. There are **four**:

| slug | label | render | notes |
| --- | --- | --- | --- |
| `vat-calculator` | מחשבון מע"מ | inline React (`VatCalculator`), `directSubmit: true` | no runner, no privacy gate (`showPrivacyNotice: false`) |
| `percentage-calculator` | מחשבון אחוזים | inline React (`PercentageCalculator`) | same |
| `advance-notice-calculator` | מחשבון הודעה מוקדמת | inline React (`AdvanceNoticeCalculator`) | page carries a full law explainer (~378 words) |
| `child-support-calculator` | מחשבון: קביעת דמי מזונות | **full-page wizard** at `/forms/child-support-calculator/submit/` | the only calculator with a landing page that says "כניסה למחשבון" |

All four live under `/forms/…` on purpose (slug inheritance for SEO), all are in the
sitemap, and all are cross-sold from the home page under "מחשבונים".

## 1. מחשבון מע"מ (VAT)

Three modes on one screen, results update live:

1. **Add VAT to an amount** — input: amount before VAT; output: VAT amount + total
   (default example: 100 → ₪18 VAT → ₪118).
2. **Remove VAT from an amount** — input: amount including VAT; output: pre-VAT amount +
   the VAT component (118 → 100 + 18).
3. **Compute the VAT amount** — input: the VAT sum; output: pre-VAT amount + total.

Settings: **VAT rate %** (default 18) and **rounding digits**. No date/history — which
matters, because Israeli VAT changed in 2025; a calculator with a free-text rate is
actually the honest design (the user supplies the rate that applies to their invoice).

## 2. מחשבון אחוזים (percentages)

Three modes:

1. **X % of Y** — "כמה זה X% מתוך Y" (example 25 % of 150 → 37.5).
2. **What percent is X of Y** — value ÷ base (example 50 → 50 %).
3. **Proportion** — "if X is Y %, how much is Z %" (rule of three).

Setting: rounding digits (default 2).

## 3. מחשבון הודעה מוקדמת (notice period)

Inputs: notice date · wage type (**monthly** vs **daily/hourly**) · seniority basis
(**by start date** vs **by duration**) · start date.
Outputs: notice date · employment period in months · required notice (e.g. "חודש קלנדרי
אחד") · resulting **end-of-employment date**.

Rules it implements (per חוק הודעה מוקדמת לפיטורים ולהתפטרות, התשס״א-2001, §3–§4; the
page reproduces them as two tables):

- **Monthly wage:** under 1 month → none; 1–6 months → 1 day per month worked;
  7–11 months → 6 days + 2.5 days per month beyond the 6th; ≥ 1 year → one full month.
- **Daily/hourly wage:** under 1 month → none; year 1 → 1 day per month; year 2 →
  14 days + 1 day per 2 months; year 3 → 21 days + 1 day per 2 months; year 4+ → one
  full month.
- **Seniority** counts in **complete calendar months** (day X to day X of the next
  month, not X−1), with a worked example on the page.
- §7 consequence (explained, not computed): the side that did not give notice owes
  compensation equal to the wage for the notice period, and the employer may deduct it
  from anything owed to the employee, including severance.

This is the best-designed of the four: inputs mirror how people actually think
("I was hired on…", "I want to quit on…"), the result is a **date**, and the page
explains the rule so the number is auditable.

## 4. מחשבון מזונות (child support)

The odd one out: a landing page that is 80 % essay + a wizard behind "כניסה למחשבון
המזונות". The essay (~573 words) is a careful *anti*-promise: it quotes ע"מ 919/15 on
judicial discretion, says the tool is a "cold calculation", that formulas came from a
review of Israeli case law with domain experts, and explicitly warns the user not to
trust any tool that promises a definite number.

Implications for us: this calculator is a **content product**, not a utility. Its value
is the framing ("here is why no number is final") plus a parametric estimate. Building
it means owning a legal-content position we may not want in v1 — it is family law, not
the 101 form.

## 5. Pattern observations

- **Every calculator is single-screen and stateless.** No save, no share, no export, no
  "email me the result". They are SEO + trust assets that feed the form funnel.
- **The privacy gate is switched off for calculators** (`showPrivacyNotice: false`) —
  because there is nothing to submit and nothing to monetise, which is a clean signal
  about where the money actually is.
- **Explainer-below-the-widget** is the reusable SEO pattern: widget for the query,
  300–900 words of original law explanation for the ranking, then cross-links.
- None of them are linked from the `/docs` tree, only from home + navbar. The docs and
  the tools are two separate funnels.

## 6. For our v1

| Calculator | Build? | Why |
| --- | --- | --- |
| VAT | **yes** — cheapest credibility win | pure client-side, no law risk, shareable URL with state |
| percentages | **yes, but low priority** | commodity; only useful as a footer tool |
| notice period | **yes, if we do employment content** | it pairs with 101 / resignation letter; needs year-stamped law citation |
| child support | **no** | family-law liability + a whole separate content tree |

The one thing to steal is the *shape*: input → live result → one paragraph of "why this
is the rule" → link to the form that acts on it. Not the numbers, not the text.
