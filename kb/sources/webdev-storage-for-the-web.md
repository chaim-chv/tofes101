---
id: source/webdev-storage-for-the-web
title: web.dev — Storage for the web (quota, persistence, eviction)
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: web.dev (Google Chrome team)
url: https://web.dev/articles/storage-for-the-web
retrieved: 2026-10-29
tags: [storage, quota, persistence, reference]
---

# Storage for the web

Referenced by MDN's quota article for the Chromium behavior. Key points used in
the draft design:

- IndexedDB/Cache storage is per-origin and managed by the browser's quota
  system; `navigator.storage.estimate()` is the supported way to read usage.
- Best-effort data can be evicted under storage pressure; `persist()` moves the
  origin into the persistent bucket (still revocable by the user).
- Browser eviction is all-or-nothing per origin.
- Chrome team research: eviction is rare for regularly visited sites, but a
  privacy-first app should still offer an explicit export.

This node exists so the quota claims in [eng/storage-draft](../../eng/storage-draft.md)
have a citable secondary source in addition to MDN.
