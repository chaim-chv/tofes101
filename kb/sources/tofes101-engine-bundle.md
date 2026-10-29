---
id: source/tofes101-engine-bundle
title: tofes101.co.il Next.js chunks — forms registry + docs tree
type: source
status: verified
confidence: verified
authority: secondary
publisher: Tepez Ltd (tofes101.co.il)
url: https://tofes101.co.il/_next/static/chunks/15kek4.n1aeu0.js
retrieved: 2026-10-29
tags: [source, competitor, tech, ia, seo]
---

# Two client chunks that *are* the site's configuration

**Status:** 200 (`15kek4.n1aeu0.js` 43 KB, `0uc.b_ov5kl_e.js` 68 KB).

`15kek4.n1aeu0.js` exports `getAllForms()`, `getCalculators()`, `getFormsBySlugs()`,
`getFormDefaultHref()` over an array of form records:

```
{id (tepez 24-hex form id), slug, label, navbarLabel, cardDescription, type: Form|Calculator,
 canCreateTemplate, templateId, pdfUrl, fillFormBtnLabel, createTemplateBtnLabel,
 labels: [form|calculator|itc|employment|…], contentComponentKey, thumbnails,
 meta: { index: {title, keywords[], description}, submit: {title, keywords[], description} }}
```

and `getFormDefaultHref` = `externalUrl ?? (directSubmit ? /forms/<slug>/ : /forms/<slug>/submit/)`
— which explains why the 4 calculators open inline while forms open a runner page.

`0uc.b_ov5kl_e.js` holds the navbar composition (employer forms group =
itc-101, bank-account, electronic-pay-slip, itc-119, resignation-letter + English;
work-accident group = btl-250, btl-283; then calculators and docs) and the **complete
`/docs` tree** with section titles and page positions (introduction 3, online-form 5,
tax-adjustment 1, tax-reductions 11, child-support-docs 5).

**Why it matters:** this is the competitor's IA and SEO metadata in machine-readable
form, and it is the cheapest possible blueprint for our own route table and nav.

**Local copies:** `research/raw/site/chunks/{15kek4.n1aeu0,0uc.b_ov5kl_e}.js`;
extracted registry table in `kb/competitor/site-map.md`.
**Node:** [competitor/tech-recon](../competitor/tech-recon.md).
