---
id: source/mdn-opfs
title: MDN — Origin private file system (OPFS)
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: MDN Web Docs (Mozilla)
url: https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
retrieved: 2026-10-29
tags: [storage, opfs, filesystem]
---

# OPFS

- `navigator.storage.getDirectory()` returns the origin-private root.
- Byte-level in-place writes; synchronous access handles are available only
  inside a Web Worker (`createSyncAccessHandle()`), asynchronous on the main
  thread.
- Subject to the same quota and eviction rules as IndexedDB; cleared when site
  data is cleared.
- No built-in transactions, indexes, or schema — it is a file API, not a
  database.

Verdict for the 101 draft: usable, but we would have to build versioning,
atomic replace, conflict handling and migration on top of a file. IndexedDB via
`idb-keyval` is the smaller correct tool.
