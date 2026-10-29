---
id: source/mdn-storage-persist
title: MDN — StorageManager.persist()
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: MDN Web Docs (Mozilla)
url: https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
retrieved: 2026-10-29
tags: [storage, persistence, api]
---

# `navigator.storage.persist()`

- Secure context only; returns a promise resolving to `true` if the bucket is
  persistent.
- Not available in Web Workers (the `StorageManager` interface is).
- Browsers may ignore the request; the docs describe it as a request, not a
  guarantee.
- The spike's headless Chrome returned **false** in a fresh profile (no
  engagement), and `navigator.storage.estimate()` reported a ~10.7 GB quota.

Use it once, after the first successful save, and never block the save on it.
