---
id: eng/privacy-enforcement
title: Privacy enforcement — CSP, self-hosting, and the build-time gate
type: concept
status: verified
confidence: verified
updated: 2026-11-01
tags: [privacy, csp, security, ci, analytics]
sources: [source/nuxt-ui-4-installation, source/vite-pwa-nuxt]
related: [eng/architecture, eng/offline-pwa, law/privacy-consent, ux/trust-local-privacy, decision/adr-0001-stack, decision/adr-0008-analytics-umami]
up: eng/architecture
---

# Privacy enforcement

The claim is not "we don't collect data" — it is **"the app has no code path that
can send your answers anywhere."** That is enforceable, and we verify it three
ways: headers, bundle inspection, and a runtime network assertion.

## 1. CSP (the enforceable part)

Working meta tag (verified: 0 console errors, page fully interactive):

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://um.csp-monitor.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self';
  connect-src 'self' https://um.csp-monitor.com;
  worker-src 'self';
  object-src 'none';
  base-uri 'none';
  form-action 'none'
">
```

Why `connect-src 'self'` and **not** `'none'`:

- Nuxt fetches its own `_payload.json`, `_i18n/<hash>/he/messages.json` and
  `_nuxt/builds/meta/<id>.json` after hydration. With `'none'` we measured a dozen
  CSP console errors (blocked fetches) while the page still rendered — broken payload
  loading and an error console.
- `'self'` still blocks every third-party origin.
- If we later remove Nuxt payload extraction/i18n runtime fetches, tighten to
  `'none'`. Do not tighten blindly.

Other directives:

- `script-src 'unsafe-inline'` is required by Nuxt's inline hydration payload.
  This weakens XSS defense. Mitigation: no `v-html`, no user HTML, strict schema
  validation on imports. A future step is hashes/nonces via Nitro headers (not
  possible in a pure static meta tag).
- `frame-ancestors` is **ignored in `<meta>`** — set it as an HTTP header
  (`frame-ancestors 'none'`) on the host. Do not claim clickjacking protection
  from the meta tag alone.
- `worker-src 'self'` is not in the root config yet; **add it before the PWA
  ships**, otherwise the service worker can be blocked.
- `'wasm-unsafe-eval'` is currently in the root `script-src`; v1 needs no WASM.
  Remove it unless a reviewed library requires it.

### The one outbound request: Umami (ADR-0008)

`nuxt.config.ts` loads one third-party script, the Umami tracker. It is the
**only** host in `script-src` / `connect-src` beyond `'self'`, and the privacy
gate allow-lists exactly that host in `ALLOW_HOSTS` and `ALLOW_SCRIPT_HOSTS`.

What it sends on a page view is `{ website, screen, language, title, hostname,
url, referrer }` — read from the shipped `script.js`, not from the vendor's
marketing page. What it must **never** send:

- the employer prefill payload in `#e=…` (ADR-0005). The tracker builds its
  `url` from `location.href`; `data-exclude-hash="true"` clears the hash before
  sending, and `data-exclude-search="true"` clears the query. Removing either
  attribute is a privacy regression, not a config tweak.
- cookies or a persistent client ID: the request is a `POST` with
  `credentials: "omit"`.
- form answers, attachments, signature: the tracker never touches `app/storage/`.

`data-do-not-track="true"` disables the tracker when the browser sends DNT. Each
`<script>` tag is emitted on every prerendered page, so `check:privacy` is the
guard that the allow-list did not grow silently.

`/privacy` also carries an opt-out checkbox ("send anonymous usage statistics").
It writes Umami's own `umami.disabled` flag through
`app/composables/useAnalyticsOptOut.ts`; Umami reads that key before every send,
so the change applies without a reload.

## 2. Self-hosted everything

| Asset | Source | Verified |
| --- | --- | --- |
| Font | `public/fonts/Heebo-Variable.ttf` (122,012 B, OFL) | no external font request; `ui.fonts: false` |
| Icons | `@nuxt/icon` with `serverBundle: false` + `clientBundle: { scan: true }` + `@iconify-json/lucide` (root config) | no `api.iconify.design` request in the network log |
| CSS/JS | `_nuxt/*` from our build | no CDN |
| Official PDF | `public/forms/tofes-101-2026.pdf` | local |
| Analytics | Umami, `https://um.csp-monitor.com/script.js` | page views only; no cookies, no cross-site ID; `#fragment` + `?query` stripped; DNT honoured (ADR-0008) |
| Error reporting | none | — |
| Images | inline SVG / local | — |

Nuxt UI 4 does **not** ship a font CDN by default, but it *does* register
`@nuxt/fonts`, which downloads fonts at build time and can emit remote `@import`s
if configured carelessly. We disable it (`ui.fonts: false`) and declare
`@font-face` ourselves. `@nuxt/icon`'s client runtime still contains the string
`https://api.iconify.design` as a fallback endpoint. The root config sets
`icon.serverBundle: false` + `clientBundle: { scan: true }` with
`@iconify-json/lucide`, so only used icons are bundled; the spike saw **no
request**, and the CSP would block it anyway. Without that config the runtime
*can* fetch icons from the API — the one realistic leak in a Nuxt UI app.

Build-time note: `@nuxt/fonts` fetched Heebo from Google Fonts **during the
build** and emitted local WOFF2 subsets (44.9 KB). That is not a runtime leak,
but it is a build dependency and a reproducibility/privacy consideration for CI.
Before launch, vendor the source font and switch `@nuxt/fonts` to a local
provider (verify the exact option for the installed version) so a build never
needs Google.

The root CSP also adds `'wasm-unsafe-eval'` to `script-src` as a deliberate
allowance for WASM libraries. Nothing in v1 needs WASM; review and remove it
before launch to tighten the policy.

## 3. Invisible third parties

- **Hosting provider** sees IP, User-Agent, requested URL. It does not see
  answers (they never leave the page). The employer prefill link must put data in
  the **fragment (`#`)**, never the query string, so it is not sent to the host
  or its logs (ADR-0004).
- **Browser extensions** can read the DOM; we cannot prevent that and must not
  claim to.
- **OS/browser backup and sync** may copy IndexedDB; "device only" means "not our
  server", not "encrypted at rest".
- **Print dialog / download** hands the PDF to the OS and whatever the user
  chooses next.

Copy must match: "הנתונים לא נשלחים לשרת שלנו" is true; "הנתונים לא יכולים
לצאת מהמכשיר" is false.

## 4. The build-time gate

`scripts/check-privacy.ts` (already in the repo) is the CI contract:

1. Walk `.output/public`.
2. Regex every `http(s)://host` in HTML/JS/CSS/JSON/SVG/webmanifest.
3. Fail on any host not in a commented allowlist (`tailwindcss.com` license
   banner, `a.invalid`/`b.invalid` Nuxt probes, `api.iconify.design` fallback).
4. Fail if any page lacks a CSP meta tag.
5. Fail on an external `<script src>`.

Run it after `bun run generate`:

```bash
bun run generate && bun run check:privacy
```

Do not add a host to the allowlist without a comment explaining why it can never
be fetched.

## 5. Runtime assertion (test, not production code)

`research/spikes/scaffold/scripts/screenshot.mjs` records every request and
asserts `external.length === 0`. Extend it to a Playwright e2e:

```ts
const external = []
page.on('request', r => {
  const u = new URL(r.url())
  if (!['localhost','127.0.0.1'].includes(u.hostname) && u.protocol !== 'data:') external.push(r.url())
})
// ... fill the form, generate the PDF, print preview ...
expect(external).toEqual([])
```

Also assert `performance.getEntriesByType('resource')` contains only same-origin
URLs after a full run.

## 6. Headers to set at the host

```
Content-Security-Policy: <same as meta, plus frame-ancestors 'none'>
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=(), usb=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload   (HTTPS only)
```

`Cache-Control`: `no-cache` for `index.html`/`sw.js`; immutable for hashed
assets. No `Set-Cookie` — the app should never set one.

## 7. Dependency review checklist

Before adding a package:

- Does it fetch anything at runtime (fonts, icons, telemetry, license check)?
- Does it have a `postinstall` script? (bun blocks postinstall by default and
  reports "Blocked 1 postinstall" — keep it that way unless reviewed.)
- Does the built bundle contain an external host? (`check:privacy` will tell you.)
- Does it need `eval`/`new Function`? (breaks strict CSP and our no-eval rule)
- License compatible with a private, distributed app? (OFL fonts fine; GPL/AGPL
  review)

## 8. Residual risks

- A compromised static host can serve different JS; reproducibility + self-hosting
  is the mitigation, not a technical guarantee.
- `'unsafe-inline'` in `script-src` means an HTML injection bug could execute.
  We do not render user HTML, and imports are schema-validated; still a risk.
- No Subresource Integrity for our own hashed chunks (same-origin).
- Browser extensions / a compromised OS are out of scope.
