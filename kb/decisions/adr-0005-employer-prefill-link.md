---
id: decision/adr-0005-employer-prefill-link
title: ADR-0005 — Employer prefill link (no-server template replacement)
type: decision
status: draft
confidence: likely
updated: 2026-10-29
tags: [adr, employer, url, privacy]
sources: []
related: [decision/adr-0004-v1-scope, field/101-employer-block, eng/architecture]
up: product/scope-v1
---

# ADR-0005 — Employer prefill link

**Date:** 2026-10-29 · **Status:** proposed (needs eng review)

## Problem

The reference lets an employer configure the form once and send employees a
link; the filled forms come back by email. We have no server, so the employer
side must degrade to **"prepare the employer block, get a link"**. The employee
side must accept it without any network call.

## Decision (proposed)

A dedicated route, `/employer` (`/en/employer`), renders a 5-field form and
produces:

1. a **link** `…/#e=<payload>` — data in the **fragment**, so it is never sent
   to any host, CDN or log;
2. a **file** `tofes101-employer-<slug>.json` with the same payload, for
   employers who prefer emailing a file or whose mail client mangles URLs;
3. a **QR code** of the link (the realistic way this gets to a phone).

The employee side reads `#e=` on first load, offers
_"הפרטים של <employer> הוזנו מראש — לאשר?"_, and either accepts (fields become
read-only if the employer locked them) or dismisses (payload is kept in memory
only, never auto-saved to the draft until accepted).

## Payload

```jsonc
{
  "v": 1,                       // schema version, required
  "k": "emp",                   // kind, reserved for future payload types
  "i": "acme-2026",             // optional issuer/slug, for display & file name
  "l": "he",                    // language hint for the employee UI
  "e": {                        // employer block, all optional
    "n": "חברת אקמה בע\"מ",       // name
    "a": "רחוב הרצל 1, תל אביב",  // address
    "p": "03-1234567",          // phone
    "d": "912345678"            // ניכויים file number
  },
  "lock": ["n", "a", "p", "d"], // which keys the employee may not edit
  "x": 2026                     // tax year the employer prepared for
}
```

Encoding: `deflate-raw` + `base64url`, via the built-in `CompressionStream`
(no dependency, no library), prefixed with `v1.` so we can change encodings:

```
#e=v1.<base64url(deflate-raw(JSON))>
```

Budget: the example above is ~200 bytes raw, ~180 compressed, ~240 in base64 —
well under the ~2 000 chars that survive every client. A hard cap of 8 KB
decoded, with a clear error instead of a broken form.

## Validation rules (fail closed, never throw)

- Unknown `v` → ignore the payload, show a one-line notice, continue with a
  blank employer block. **Never** block the form because a link is old.
- Whitelist keys; drop everything else (no prototype pollution: parse with
  `JSON.parse` then copy known keys only).
- All values: strings, max 200 chars, HTML-escaped at render (never `v-html`).
- `lock` must be a subset of known keys.
- If `x` (tax year) ≠ the app's year → offer the yearly switch, do not silently
  apply.

## Why the fragment and not `?query`

- Query strings appear in server access logs, `Referer` headers of any outbound
  link, and analytics. Fragments never leave the browser.
- Consequence: the payload cannot be used for server-side rendering / link
  previews. Acceptable — and the page should still render a sensible `<title>`
  and a generic preview.
- Add `<meta name="referrer" content="no-referrer">` regardless, and never put
  the fragment into any `href` we generate (e.g. the "open tax authority site"
  link).

## What the employer UI must say

- "הקישור מכיל את פרטי החברה שהזנת. אל תכניס/י מידע אישי של עובדים."
- "אין לנו שרת. אנחנו לא רואים מי פתח את הקישור, ואנחנו לא מקבלים את הטפסים
  שמולאו."
- "העובד/ת ישלח/תשלח לך את ה-PDF בעצמו/ה."

## Open questions

- Should a locked field also be *hidden* from the employee (less clutter) or
  shown read-only (more transparency)? Proposal: shown read-only with a lock
  icon and a tooltip, because an employee who cannot see the employer's name
  will not trust the link.
- Do we want a short "fingerprint" (first 6 chars of a hash) displayed to both
  sides so they can confirm they are looking at the same payload? Cheap, no
  server. Proposal: yes, in the employer screen and in the accept prompt.
