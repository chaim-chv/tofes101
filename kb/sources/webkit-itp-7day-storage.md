---
id: source/webkit-itp-7day-storage
title: WebKit — 7-day cap on all script-writeable storage (ITP)
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: WebKit (Apple)
url: https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/
retrieved: 2026-10-29
tags: [safari, storage, eviction, privacy, pwa]
---

# Safari's 7-day storage cap

From the WebKit post (2020-03-24), still the governing policy in the current
storage documentation:

> ITP has aligned the remaining script-writable storage forms with the existing
> client-side cookie restriction, deleting all of a website's script-writable
> storage after seven days of Safari use without user interaction on the site.

Affected: **IndexedDB, LocalStorage, Media keys, SessionStorage, Service Worker
registrations and cache**.

Home-screen web apps are exempt:

> Web applications added to the home screen are not part of Safari and thus have
> their own counter of days of use. Their days of use will match actual use of the
> web application which resets the timer.

Consequence for form 101: a draft in a normal Safari tab can disappear after a
week of not visiting; an installed PWA does not. The app must say so and offer a
JSON export.
