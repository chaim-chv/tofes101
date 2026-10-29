---
id: competitor/tech-recon
title: Tech recon — stack, chunks, endpoints, and how the runner is embedded
type: finding
status: verified
confidence: verified
updated: 2026-10-29
tags: [competitor, tech, nextjs, tepez, recon]
sources: [source/tofes101-runner-app, source/tofes101-engine-bundle, source/tofes101-form-runner-api, source/tofes101-sitemap]
related: [finding/tepez-form-runtime, competitor/site-map, product/scope-v1]
up: index
---

# Tech recon

Practical notes from the outside in. Field-level extraction of the form itself is in
[finding/tepez-form-runtime](../finding/tepez-form-runtime.md); this node is about the
**site** — what serves what, where the config lives, and which endpoints exist.

## 1. Hosting & framework

```
GET /forms/itc-101/
HTTP/2 200
Server: Vercel
X-Matched-Path: /he/forms/itc-101
X-Nextjs-Prerender: 1
X-Vercel-Cache: HIT
Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch
ETag: "091a8ef…"   Cache-Control: public, max-age=0, must-revalidate
```

- **Next.js App Router on Vercel**, fully prerendered (`X-Nextjs-Prerender: 1`), served
  from cache (`Age: 884925` ≈ 10 days). Nothing personalised on the server.
- **Locale prefix routing**: internal path is `/he/...`, public URL has no prefix — the
  Hebrew tree is the default and the only fully built one.
- **Turbopack build**: chunk names are content-hashed without readable module names —
  `_next/static/chunks/01xlw8hd842-c.js`, `0y_dssftuo-o4.js`, `15kek4.n1aeu0.js`,
  `turbopack-15v5qrzq234yy.js`. (The *runner*, by contrast, uses webpack-4 style
  `vendors~tepez-front-core-dbee50a7ed.js` — two build systems, two eras.)
- **RSC streaming payload inline in the HTML**: `self.__next_f.push([1,"…"])` with module
  ids (`13:I[63491,["…"],"default"]`). That payload is where the FAQ answers live even
  though the DOM has empty accordions — worth remembering when scraping Next sites.
- **UI**: Tailwind utility classes, shadcn-style `data-slot` primitives **on Base UI**
  (not Radix: `data-slot="navigation-menu"`, `data-slot="accordion-trigger"`),
  lucide icons, self-hosted Heebo woff2, no CSS-in-JS.
- **i18n**: a `useTranslations("navbar")` helper — hand-rolled dictionary, not next-intl.
- **Prefetching**: hovering nav items fires `?_rsc=<hash>` fetches for up to 10 form pages
  (`/forms/gym-health-declaration/?_rsc=k10cb`, …). That is why a single page load
  produced ~40 RSC requests in the network log; it also means their "internal linking"
  is partly prefetch traffic, not crawler-visible expansion.

## 2. Two apps, one product

| | site | runner |
| --- | --- | --- |
| origin | `tofes101.co.il` | `forms.tofes101.co.il` |
| stack | Next.js App Router (React), Base UI | **AngularJS 1.x** (`ng-app="tepez"`, ui-router `ui-view`) |
| build | Turbopack | webpack 4, `assets/js/tepez-front-core-838c548d67.js` |
| state | none (static) | client-side model + **Dexie/IndexedDB** + server drafts |
| PDF | none | `pdf.js` + a server "render" action |
| rich text | — | CKEditor (for `eHtml` blocks) |
| CSS | Tailwind | Bootstrap 3 RTL theme (`assets/themes/bs3/core-bs3-rtl`) + select2 + Font Awesome 4.7 |

The site is a thin marketing shell; the runner is a 2016-era Angular SPA that is still
the actual product. They are coupled by an **iframe**, not an API contract.

## 3. How the runner is embedded

`/forms/itc-101/submit/` renders, in `<main>`, exactly:

```html
<div class="fixed inset-0 z-[60] bg-neutral-100">
  <div class="absolute inset-0 flex items-center justify-center"> … spinner, "טוען טופס..." </div>
  <iframe title="טופס מקוון" class="h-full w-full border-0" allowfullscreen
    src="https://forms.tofes101.co.il/f/5a704edf239da27488a8cd9c?data=%7B%22seo%22…%7D"></iframe>
</div>
```

- `z-[60]` overlay covers the site nav: the user is in a full-screen app with no way back
  except the browser button.
- The `data` parameter is a JSON blob; on a normal visit it carries only
  `{"seo":{"sourceType","landingUrl","parentUrl","capturedAt"}}`. The template flow uses
  the same channel (`data.entry.status === "template"`, `data.action === "preFill"`) —
  i.e. **the employer's configuration travels in the URL, not in a database**.
- `showFooter: false`, `showActionBar: false` in the form schema: the runner owns the
  chrome, so per-form customisation is limited to panels.

## 4. Endpoints & routes that matter

| URL | What | Auth |
| --- | --- | --- |
| `GET https://api.tepez.co.il/v1.0/form/<formId>/start?locale=he` | the entire form definition (JSON, 285 KB for 101) | none |
| `GET https://forms.tofes101.co.il/f/<formId>?data=<json>` | runner shell | none |
| `https://forms.tofes101.co.il/assets/js/tepez-front-core-<hash>.js` | runner bundle | none |
| `https://images-cdn.tepez.co.il/forms-assets/tofes101/logo.png` | logo asset | none |
| `https://tpz.link/<code>` | short link for employer templates | none |
| `/form-submitted/` | post-submit route (robots-disallowed) | none |
| `/admin-portal-archive`, `/data-export-legacy` | legacy admin surfaces (robots-disallowed, linked from a hidden footer anchor) | none |

`formId` for 101 = `5a704edf239da27488a8cd9c`. The English 101 is a **different form id**,
not a locale of the same form.

## 5. The IA is in the JS, not in a CMS

Two chunks are worth more than a crawl:

- `/_next/static/chunks/15kek4.n1aeu0.js` — the forms registry:
  `{id, slug, label, navbarLabel, cardDescription, type: Form|Calculator, canCreateTemplate,
  templateId, pdfUrl, fillFormBtnLabel, createTemplateBtnLabel, labels[], contentComponentKey,
  thumbnails[], meta:{index:{title,keywords,description}, submit:{…}}}` and the helpers
  `getAllForms / getCalculators / getFormsBySlugs / getFormDefaultHref`.
  `getFormDefaultHref` = `externalUrl ?? (directSubmit ? "/forms/<slug>/" : "/forms/<slug>/submit/")`
  — this single line explains the whole routing scheme (calculators open inline, forms
  go to the runner page).
- `/_next/static/chunks/0uc.b_ov5kl_e.js` — navbar composition and the `/docs` tree
  (sections, page titles, positions).

Saved locally in `research/raw/site/chunks/`; extracted table in
[competitor/site-map](site-map.md).

## 6. Tracking & third parties (summary)

GTM ×2 (`GTM-54CTX27`, `GTM-WBBV7DQ`), GA4 `G-JS7WRFHQZE`, DoubleClick/Google Ads beacons,
AdSense, Meta pixel, Sentry 7.120.2, plus a first-party `tpFirstTouch` sessionStorage key
that carries campaign attribution into the iframe `data` and from there into the
submission. Full table: [competitor/monetization-and-tracking](monetization-and-tracking.md).

**No "fillout"** anywhere in the site, runner or form schema (searched all downloaded
artifacts) — the form layer is tepez only.

## 7. Consequences for our build

1. **Do not clone their architecture.** Two apps + iframe + server drafts + email is the
   shape of their constraints (multi-tenant form builder), not of ours. One static app,
   one schema, one renderer.
2. **Their schema is the best spec we have** — but it is a vendor implementation, not
   law. Use it for structure (section order, conditionals, validators), replace every
   number with a cited, year-stamped value.
3. **Prerender everything.** Their SEO works because every landing page is static; our
   app routes should be the only non-prerendered surface, and they should be `noindex`.
4. **No iframe.** An iframe costs us accessibility (focus traps across documents), the
   back button, deep links per section, and `prefers-*`/zoom behaviour. All of that is
   free in a single SPA.
5. **Watch the PDF, not the HTML.** The only artefact an employer sees is the PDF. Their
   weakness (invalid values silently omitted) is a correctness bug we can turn into a
   trust feature: a cover page listing exactly what is missing.
