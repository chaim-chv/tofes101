---
id: source/mdn-storage-quotas
title: MDN — Storage quotas and eviction criteria
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: MDN Web Docs (Mozilla)
url: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
retrieved: 2026-10-29
tags: [storage, indexeddb, quota, eviction]
---

# Storage quotas and eviction

Verified points:

- Default is **best-effort** storage; `navigator.storage.persist()` opts into
  persistent mode. Chrome/Edge and Safari auto-approve or auto-deny based on
  engagement and show no prompt; Firefox shows a prompt.
- **Web Storage** (`localStorage`/`sessionStorage`) is capped at ~5 MiB each,
  ~10 MiB total across both, and throws `QuotaExceededError`.
- Chromium allows an origin up to ~60% of total disk (persistent *and*
  best-effort); Firefox uses the smaller of 10% of disk or 10 GiB for best-effort.
- Safari: ~60% of disk for browser apps, ~15% for embedded webviews; home-screen
  web apps get the browser-app quota.
- Under storage pressure the browser evicts whole origins with an LRU policy,
  skipping persistent origins.
- "If an origin has no user interaction … in the last seven days of browser use,
  its data created from script will be deleted" in Safari (proactive eviction).
- Eviction deletes **all** of an origin's data at once (IndexedDB + Cache API),
  not parts of it.

Implication: one small draft is nowhere near quota, but eviction is all-or-nothing
and Safari may drop it; export is the only durable backup.
