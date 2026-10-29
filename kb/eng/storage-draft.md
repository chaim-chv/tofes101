---
id: eng/storage-draft
title: Draft storage — versioned IndexedDB envelope, autosave, export/import
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [storage, draft, indexeddb, autosave, migrations, offline]
sources: [source/mdn-storage-quotas, source/mdn-storage-persist, source/webkit-itp-7day-storage, source/mdn-opfs]
related: [decision/adr-0003-draft-storage, eng/architecture, ux/progress-save-resume, ux/trust-local-privacy, eng/offline-pwa]
up: eng/architecture
---

# Draft storage

**Decision:** a Pinia store owns in-memory state; a single module
(`app/utils/draft.ts`) persists a **versioned envelope** to IndexedDB via
`idb-keyval` 6.3.0. Autosave is debounced, with explicit flush points. Export /
import is JSON with the same envelope. See
[ADR-0003](../decisions/adr-0003-draft-storage.md).

Working code: `research/spikes/scaffold/app/utils/draft.ts` (8 Vitest tests pass)
and `research/spikes/scaffold/app/pages/draft-test.vue` (real-browser probe).

## 1. Options considered

| Option | Verdict | Why |
| --- | --- | --- |
| `useState` only | ✗ | dies on reload; that is the feature we must ship |
| `localStorage` | ✗ | 5 MiB, synchronous, string-only, main-thread blocking; every keystroke serializes the whole draft |
| `pinia-plugin-persistedstate` | ✗ (for this) | tiny and good, but it persists *store state* with a `storage` adapter, has no schema migrations, no revision/conflict handling, and defaults to `localStorage`. We would still have to write the important half. |
| VueUse `useStorage` | ✗ | localStorage/sessionStorage wrapper; same limits |
| VueUse `useIndexedDB` | ~ | thin wrapper, no versioning/migrations |
| **`idb-keyval` 6.3.0** | ✓ | 600 B-ish promise wrapper, `createStore`, get/set/del; we own the envelope |
| Dexie 4.4.7 | ~ | excellent if we needed indexes/queries/multi-table; adds ~20 KB+ for one record |
| OPFS | ✗ | byte-level file API; we would rebuild transactions/versioning by hand; same eviction rules |

`idb-keyval` is the smallest tool that gives us async, structured-clone storage.
One record, one key, one migration pipeline.

## 2. Envelope (schema v3)

```ts
export const APP_ID = 'tofes101'
export const SCHEMA_VERSION = 3
export const FORM_YEAR = 2026

export interface Draft {
  app: 'tofes101'          // guard against importing another app's JSON
  schemaVersion: number    // 3 today
  formYear: number         // 2026; a 2027 file is refused by a 2026 app
  id: string               // crypto.randomUUID()
  createdAt: string        // ISO
  updatedAt: string        // ISO
  revision: number         // per-device counter for multi-tab conflict
  data: {
    answers: Record<string, string | number | boolean | null>  // key = field path
    meta: {
      completedSections: string[]
      lastStep: string
      lastField?: string
    }
  }
}
```

Why these fields:

- `answers` is keyed by the **stable field path** (`employee/nameRow/firstName`),
  never by label or array index. Labels are i18n; paths are the contract.
- `schemaVersion` is the *draft format*, not the tax year. `formYear` is data.
- `revision` is local only; it is not a cryptographic version, just enough to
  detect "another tab saved while you were typing".
- `meta.lastStep` enables "resume where you stopped"; `completedSections` drives
  the progress indicator without recomputing everything.

Stored at: IndexedDB database `tofes101`, object store `drafts`, key
`draft:current`. A future "multiple drafts" feature adds keys per id; the API
already exposes `listDraftKeys()`.

## 3. Migrations

```ts
export const migrations: Record<number, (d: any) => any> = {
  1: (d) => ({ /* v1 {name,idNumber} -> v2 {data:{answers}} */ }),
  2: (d) => ({ /* v2 -> v3 envelope + formYear + revision */ })
}

export function migrateDraft(raw: any): Draft {
  let d = structuredClone(raw)
  let v = Number(d.schemaVersion ?? 1)
  if (v > SCHEMA_VERSION) throw new Error('draft is newer than this app')
  while (v < SCHEMA_VERSION) {
    if (!migrations[v]) throw new Error(`no migration from v${v}`)
    d = migrations[v](d)
    v = Number(d.schemaVersion)
  }
  if (d.app !== APP_ID) throw new Error('wrong app id')
  if (!d.data?.answers) throw new Error('missing answers')
  return d as Draft
}
```

Rules:

- Migrations are **pure and one-way**; never edit an old migration after release.
- Unknown future fields are preserved by spreading `...d` in each migration.
- Loading always migrates; saving always writes the current version.
- The v1→v3 path is tested (prototype shape with `name`/`idNumber`).
- Imported JSON goes through the *same* migrator, then gets a new `id` and
  `revision: 1` so it cannot silently overwrite the live draft.

## 4. Autosave

```
keystroke ──schedule(800 ms)──► save
blur / step change ───────────► flush()   (immediate)
visibilitychange → hidden ────► flush()
pagehide ─────────────────────► flush()
```

- Debounce **800 ms**; never save per keystroke.
- `flush()` is idempotent and returns the saved draft.
- `pagehide` is the reliable one on iOS; `beforeunload` is not guaranteed and is
  not used.
- A save takes **0.37–0.45 ms** in Chrome for a small draft (20 sequential
  saves measured in `research/spikes/scaffold`, real IndexedDB). Even at 160
  fields this is negligible; the debounce exists to avoid write churn, not
  latency.
- On failure (`QuotaExceededError`, IDB blocked in private mode): keep state in
  memory, show a persistent banner "השמירה במכשיר נכשלה — ייצאו קובץ גיבוי",
  and never pretend it saved.
- Do not save on every `watch(deep)` tick without debounce; Pinia's deep watcher
  fires for UI-only state too. Watch `answers` + `meta` explicitly.

## 5. Multi-tab

- `BroadcastChannel('tofes101-draft')` posts `{type:'saved', revision, tabId}`
  and `{type:'request-state'}`.
- `saveDraft` reads the stored revision first; if `stored.revision > draft.revision`
  it throws `ConflictError`. The UI shows:
  "נפתח חלון אחר ועדכן את הטופס. טען את הגרסה האחרונה / דרוס אותה."
- "Overwrite" calls `saveDraft(draft, { force: true })` and writes
  `stored.revision + 1`.
- Last-write-wins is *not* silent. Field-level merge is out of scope for v1.
- `storage` events do not fire for IndexedDB, hence BroadcastChannel.

## 6. Quota and eviction (verified)

- Real Chrome probe: `navigator.storage.estimate()` → quota **10,737,491,968 B
  (~10.7 GB)**, usage ~74 KB after 21 revisions; a full draft export was **500 B**
  for 3 answers. A 160-field draft is still well under 100 KB.
- `navigator.storage.persist()` returned **false** in a fresh headless profile.
  Chrome/Safari decide by engagement and do not prompt; call it after the first
  successful save and treat `false` as normal.
- **Safari deletes script-writable storage after 7 days without interaction**
  ([source/webkit-itp-7day-storage](../sources/webkit-itp-7day-storage.md)).
  Home-screen web apps are exempt. This is the single biggest draft risk.
- Eviction is all-or-nothing per origin (IndexedDB + Cache + SW).
- Private/incognito may delete everything at the end of the session.

Product response (copy + UI):

1. A one-line trust statement on the first screen: **"הנתונים נשמרים במכשיר שלך
   בלבד. אין חשבון, אין שרת, אין שליחה."**
2. After the first save: "הטיוטה נשמרה במכשיר. כדאי לייצא גיבוי לקובץ."
3. A visible **"ייצוא גיבוי (JSON)"** action in the header/output step.
4. On Safari (or when `persist()` is false): a dismissible tip
   "אפשר להוסיף את האתר למסך הבית כדי שהטיוטה לא תימחק אחרי 7 ימים".
5. TTL: `expiresAt = updatedAt + 30 days` shown as "הטיוטה תישמר עד …"; do not
   silently delete — on expiry offer **שחזור / מחיקה**.
6. "מחיקת הטיוטה" always available and always confirms (irreversible).

## 7. Export / import JSON

```json
{
  "app": "tofes101",
  "schemaVersion": 3,
  "formYear": 2026,
  "id": "…",
  "createdAt": "2026-10-29T…",
  "updatedAt": "2026-10-29T…",
  "revision": 7,
  "data": { "answers": { "employee/nameRow/firstName": "דוד" }, "meta": { … } },
  "exportedAt": "2026-10-29T…",
  "generator": "tofes101@3"
}
```

- File name: `tofes101-2026-draft-YYYY-MM-DD.json`.
- Import: size cap (e.g. 2 MB), `JSON.parse` in try/catch, `migrateDraft`,
  `formYear` check, then **preview** ("3 תשובות, נשמר לאחרונה …") before replace.
- Never auto-merge an import into a non-empty draft.
- Export contains PII in clear text; the UI must say so: "הקובץ אינו מוצפן".
- A future encrypted export (WebCrypto + passphrase) is a v2 option; do not
  pretend the JSON is safe on a shared drive.

## 8. Failure modes and fallbacks

| Failure | Behavior |
| --- | --- |
| IndexedDB unavailable/blocked | app still works in memory; banner "לא ניתן לשמור במכשיר"; export still available |
| Quota exceeded | catch, show export + delete-old-drafts action; never lose current in-memory state |
| Safari 7-day eviction | draft gone on return; onboarding copy explains export/install |
| Two tabs | conflict banner, explicit reload/overwrite |
| Clock skew | timestamps are display-only; revision is the source of truth |
| Import from 2027 into 2026 app | refused with a clear message (no silent downgrade) |
| Stored draft from a future schema | refused with "עדכנו את האפליקציה" |

## 9. Tests that must exist

- v1→v3 and v2→v3 migration (fixtures checked into the repo).
- Round-trip save/load/migrate.
- Conflict: stale revision throws `ConflictError`.
- Import rejects bad JSON, wrong app id, future schema, wrong tax year.
- Reload persistence in a real browser (Playwright): fill → reload → value present.
- Export produces valid JSON; import creates a new id and revision 1.

The spike covers the first four in `tests/draft.test.ts` and the reload case in
`research/spikes/scaffold/scripts/draft-browser.mjs`.
