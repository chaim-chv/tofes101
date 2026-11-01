---
id: decision/adr-0008-analytics-umami
title: ADR-0008 — Page-view analytics with Umami
type: decision
status: verified
confidence: verified
updated: 2026-11-01
tags: [adr, privacy, analytics, csp]
sources: []
related: [eng/privacy-enforcement, decision/adr-0005-employer-prefill-link, ux/trust-local-privacy]
up: eng/architecture
---

# ADR-0008 — Page-view analytics with Umami

**Date:** 2026-11-01 · **Status:** accepted (implemented)

## Context

The project's first non-negotiable is privacy: nothing leaves the browser, and
`scripts/check-privacy.ts` fails the build on any external host. That also meant
there was no way to answer the most basic product questions — which pages get
opened, whether the employer link is used, where people stop.

The owner asked for **Umami** (`https://um.csp-monitor.com`), a cookieless,
open-source analytics service that does not store IP addresses or build a
cross-site identifier. That is a narrower promise than "no request at all", so it
has to be written down and enforced rather than implied.

## Decision

Ship the Umami tracker on all pages, configured to collect **page views only**:

```html
<script
  defer
  src="https://um.csp-monitor.com/script.js"
  data-website-id="ecbed3f5-beb5-4174-b0c4-3d5fc42af892"
  data-exclude-search="true"
  data-exclude-hash="true"
  data-do-not-track="true"
></script>
```

The privacy gate allow-lists that one host (`ALLOW_HOSTS` **and**
`ALLOW_SCRIPT_HOSTS`) and the CSP allows it for `script-src` + `connect-src`
only. Every other third-party origin stays blocked.

## Why these attributes are load-bearing

Read from the shipped `script.js`, the tracker sends
`{ website, screen, language, title, hostname, url, referrer }` and derives `url`
from `location.href`.

- `data-exclude-hash` — the employer prefill payload lives in `#e=…`
  ([ADR-0005](./adr-0005-employer-prefill-link.md)). Without this attribute the
  full href, fragment included, is POSTed to the analytics server. This is the
  single most important setting in the tag.
- `data-exclude-search` — keeps future query parameters (source tags, campaign
  links) out of the payload too.
- `data-do-not-track` — sends nothing when the browser signals DNT.
- Cookies / identifiers — the request uses `credentials: "omit"`, and Umami's
  payload has no client ID. The app also sets no `Set-Cookie` of its own.

`referrer` is sent by the tracker but the app already ships
`<meta name="referrer" content="no-referrer">`, so it arrives empty.

## Consequences

- **The privacy promise changed.** The privacy page no longer says "no
  analytics"; it has a dedicated "usage statistics" section naming Umami, the
  fields sent, and the DNT behaviour. `kb/eng/privacy-enforcement.md` documents
  the same.
- `check:privacy` is stricter in one dimension (external `<script src>` is now
  validated against an allow-list instead of a blanket ban) and unchanged in
  every other. Any new host is still a build failure.
- The form itself is unaffected: answers, attachments and the signature live in
  `app/storage/` and the tracker never reads them.
- Analytics can be disabled at runtime the way Umami supports it
  (`localStorage["umami.disabled"] = "1"`). The privacy page exposes this as a
  plain checkbox; the write is isolated in
  `app/composables/useAnalyticsOptOut.ts`, not a bare `localStorage` call in the
  page. The choice persists per browser and applies from the next page view.

## Open questions

- If the self-hosted Umami instance moves, `data-host-url` can point the tracker
  at a different origin; only then should the CSP/allow-list host change.
