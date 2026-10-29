---
id: decision/adr-0003-draft-storage
title: ADR-0003 — Draft storage: Pinia + versioned IndexedDB envelope
type: decision
status: verified
confidence: verified
updated: 2026-10-29
tags: [adr, storage, indexeddb, draft, migrations, pinia]
sources: [source/mdn-storage-quotas, source/webkit-itp-7day-storage, source/mdn-storage-persist, source/mdn-opfs]
related: [eng/storage-draft, eng/architecture, ux/progress-save-resume, ux/trust-local-privacy]
up: eng/architecture
---

# ADR-0003 — Draft storage

**Date:** 2026-10-29 · **Status:** accepted

## Context

A 160-field form cannot be completed in one sitting. The draft must survive:

- reload / tab close / phone lock,
- app version upgrades (schema changes),
- a second tab editing the same draft,
- Safari's 7-day eviction and general storage pressure,
- export/import for backup and device transfer.

No server, so no sync and no account recovery.

## Options

1. `useState` / memory only — loses the core feature.
2. `localStorage` — 5 MiB, synchronous, string-only; every save blocks the main
   thread and serializes the whole draft.
3. `pinia-plugin-persistedstate@4.7.1` — tiny (<2 kB), good API (`storage`,
   `pick`, `serializer`), but persists store state with no migration pipeline,
   no revision/conflict handling, and defaults to `localStorage`. We would still
   write the schema/migration/conflict layer ourselves.
4. **Pinia store + custom `app/utils/draft.ts` using `idb-keyval@6.3.0`** —
   async, structured clone, one record, full control of the envelope.
5. Dexie 4.4.7 — indexes/transactions/multi-table; unnecessary for one draft,
   adds weight and a second schema to migrate.
6. OPFS — byte-level files; same eviction rules; we would rebuild atomic writes,
   versioning and queries.
7. `@vueuse/core` `useStorage`/`useIndexedDB` — thin wrappers; no migrations.

## Decision

Adopt **4**:

- Pinia store holds `answers`, `meta`, UI state; it is the single in-memory truth.
- `app/utils/draft.ts` owns the IndexedDB key (`tofes101/drafts/draft:current`),
  the versioned envelope, migrations, revision checks, export/import.
- Autosave: 800 ms debounce + flush on blur, step change, `visibilitychange`
  (hidden), `pagehide`. Never `beforeunload` alone.
- Multi-tab: `BroadcastChannel` + a revision counter; stale writes throw
  `ConflictError` and the UI asks the user to reload or overwrite.
- Export/import: JSON with `app`, `schemaVersion`, `formYear`, `exportedAt`,
  `generator`; import runs migrations, checks the tax year, gets a new id.
- TTL 30 days, shown to the user; no silent deletion.
- `navigator.storage.persist()` once after first save; treat `false` as normal.
- UI must always offer "ייצוא גיבוי (JSON)" and say "הנתונים במכשיר בלבד".

## Consequences

- Positive: one record, one schema, one migration path; no library lock-in for
  persistence.
- Positive: saves are sub-millisecond (0.37–0.45 ms measured); the debounce is
  for write churn, not performance.
- Positive: export is a plain JSON file the user can inspect.
- Negative: we maintain the migrations and the conflict UX (roughly 150–200
  lines, tested).
- Negative: `pinia-plugin-persistedstate`'s devtools integration is not available;
  we add our own `$reset`/hydrate hooks.
- Negative: Safari can evict the draft after 7 days without interaction and
  `persist()` is not guaranteed. The only durable backup is export; copy must
  say so.
- Negative: plain JSON export is unencrypted PII; the UI warns, and encrypted
  export is a v2 option.

## Revisit if

- v2 adds multiple drafts or attachments (scanned ID, PDFs) → move to Dexie with
  a proper table/index design and a migration from the single record.
- The app gains accounts/sync (contradicts the privacy model) → storage becomes a
  cache, not the source of truth.
- Safari/Chrome change eviction or `persist()` semantics enough that a different
  storage class (OPFS) is materially safer.
