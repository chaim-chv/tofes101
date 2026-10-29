import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import {
  emptyDraft,
  migrateDraft,
  saveDraft,
  loadDraft,
  exportDraft,
  importDraft,
  ConflictError,
  deleteDraft,
  SCHEMA_VERSION
} from '../app/utils/draft'

beforeEach(async () => {
  await deleteDraft()
})

describe('migrations', () => {
  it('migrates the v1 prototype shape to v3', () => {
    const d = migrateDraft({ schemaVersion: 1, name: 'דוד', idNumber: '123456789' })
    expect(d.schemaVersion).toBe(SCHEMA_VERSION)
    expect(d.data.answers['personal.firstName']).toBe('דוד')
    expect(d.data.answers['personal.idNumber']).toBe('123456789')
    expect(d.app).toBe('tofes101')
  })

  it('migrates v2 and keeps answers', () => {
    const d = migrateDraft({ schemaVersion: 2, data: { answers: { a: 'b' } } })
    expect(d.data.answers.a).toBe('b')
    expect(d.formYear).toBe(2026)
  })

  it('refuses a newer schema', () => {
    expect(() => migrateDraft({ schemaVersion: 99, app: 'tofes101', data: { answers: {} } })).toThrow(/newer/)
  })

  it('refuses a foreign app id', () => {
    expect(() => migrateDraft({ schemaVersion: 3, app: 'other', data: { answers: {} } })).toThrow(/wrong app/)
  })
})

describe('storage', () => {
  it('round-trips a draft through IndexedDB', async () => {
    const d = emptyDraft('draft-1')
    d.data.answers['personal.lastName'] = 'כהן'
    const saved = await saveDraft(d)
    expect(saved.revision).toBe(2)
    const loaded = await loadDraft()
    expect(loaded?.data.answers['personal.lastName']).toBe('כהן')
    expect(loaded?.schemaVersion).toBe(SCHEMA_VERSION)
  })

  it('detects a conflicting write from another tab', async () => {
    const d = emptyDraft('draft-1')
    const a = await saveDraft(d) // revision 2
    const stale = { ...a, revision: a.revision + 5 } // pretend this tab advanced
    await saveDraft(stale) // revision 3
    await expect(saveDraft({ ...a, revision: a.revision })).rejects.toBeInstanceOf(ConflictError)
  })
})

describe('import/export', () => {
  it('exports JSON with a schema version and re-imports it', () => {
    const d = emptyDraft('draft-1')
    d.data.answers['x'] = 1
    const json = exportDraft(d)
    const obj = JSON.parse(json)
    expect(obj.schemaVersion).toBe(SCHEMA_VERSION)
    expect(obj.exportedAt).toBeTruthy()
    const imported = importDraft(json)
    expect(imported.id).not.toBe('draft-1')
    expect(imported.data.answers.x).toBe(1)
  })

  it('rejects bad JSON and wrong tax year', () => {
    expect(() => importDraft('{oops')).toThrow(/JSON/)
    const json = exportDraft({ ...emptyDraft(), formYear: 2025 })
    expect(() => importDraft(json)).toThrow(/tax year 2025/)
  })
})
