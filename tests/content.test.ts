import { describe, expect, test } from "bun:test"
import he from "../app/locales/he"
import en from "../app/locales/en"
import { schema } from "../app/form/schema"
import { parseEnvelope, migrate, encodeDraft, SCHEMA_VERSION } from "../app/storage/draft"

const heKeys = new Set(Object.keys(he))
const enKeys = new Set(Object.keys(en))

describe("catalogs", () => {
  test("he and en define exactly the same keys", () => {
    const onlyHe = [...heKeys].filter((k) => !enKeys.has(k))
    const onlyEn = [...enKeys].filter((k) => !heKeys.has(k))
    expect({ onlyHe, onlyEn }).toEqual({ onlyHe: [], onlyEn: [] })
  })

  test("no empty strings", () => {
    for (const [k, v] of Object.entries(he)) expect(`${k}:${v}`.endsWith(":")).toBe(false)
    for (const [k, v] of Object.entries(en)) expect(`${k}:${v}`.endsWith(":")).toBe(false)
  })
})

describe("schema i18n coverage", () => {
  const keys = new Set<string>()
  for (const step of schema.steps) {
    keys.add(step.titleKey)
    if (step.introKey) keys.add(step.introKey)
    if (step.skipReasonKey) keys.add(step.skipReasonKey)
    for (const f of step.fields) {
      collect(f)
    }
  }
  function collect(field: (typeof schema.allFields)[number]) {
    if (field.labelKey) keys.add(field.labelKey)
    if (field.helpKey) keys.add(field.helpKey)
    if (field.contentKey) keys.add(field.contentKey)
    if (field.rowTitleKey) keys.add(field.rowTitleKey)
    if (field.addKey) keys.add(field.addKey)
    if (field.placeholderKey) keys.add(field.placeholderKey)
    for (const o of field.options ?? []) if (o.labelKey) keys.add(o.labelKey)
    for (const sub of field.fields ?? []) collect(sub)
  }

  test("every key the schema references exists in both catalogs", () => {
    const missing = [...keys].filter((k) => !heKeys.has(k) || !enKeys.has(k))
    expect(missing).toEqual([])
  })

  test("field ids are unique across the schema", () => {
    const ids = schema.allFields.map((f) => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test("every non-static field has a label", () => {
    const missing = schema.allFields.filter((f) => f.kind !== "static" && !f.labelKey)
    expect(missing.map((f) => f.id)).toEqual([])
  })

  test("every option has a label or a literal label", () => {
    const missing = schema.allFields.flatMap((f) =>
      (f.options ?? []).filter((o) => !o.labelKey && !o.label).map((o) => `${f.id}:${o.value}`),
    )
    expect(missing).toEqual([])
  })
})

describe("draft envelopes", () => {
  const good = {
    app: "tofes101" as const,
    schema: SCHEMA_VERSION,
    savedAt: "2026-10-29T00:00:00.000Z",
    state: {
      meta: {
        schema: SCHEMA_VERSION,
        taxYear: 2026,
        locale: "he" as const,
        step: 0,
        createdAt: "2026-10-29T00:00:00.000Z",
        updatedAt: "2026-10-29T00:00:00.000Z",
        completed: {},
        declarationVersion: "2026-he-1",
      },
      values: { "employee.firstName": "דנה" },
      hidden: {},
    },
  }

  test("accepts a well-formed envelope", () => {
    const r = parseEnvelope(good)
    expect(r.ok).toBe(true)
  })

  test("refuses a foreign file", () => {
    const r = parseEnvelope({ ...good, app: "other" })
    expect(r).toEqual({ ok: false, reason: "foreign" })
  })

  test("refuses a draft from a newer schema", () => {
    const r = parseEnvelope({ ...good, schema: SCHEMA_VERSION + 1 })
    expect(r).toEqual({ ok: false, reason: "newer" })
  })

  test("refuses garbage without throwing", () => {
    for (const bad of [null, 42, "x", {}, { app: "tofes101" }]) {
      expect(parseEnvelope(bad).ok).toBe(false)
    }
  })

  test("migrate is a no-op on the current version", () => {
    const r = parseEnvelope(good)
    if (!r.ok) throw new Error("expected ok")
    expect(migrate(r.state)).toEqual(r.state)
  })

  test("migrates v1 intro/review/sign onto the 9-step model", () => {
    const v1 = {
      ...good.state,
      meta: { ...good.state.meta, schema: 1, step: 9, completed: { intro: true, review: true } },
    }
    const migrated = migrate(v1)
    expect(migrated.meta.schema).toBe(2)
    expect(migrated.meta.stepId).toBe("finish")
    expect(migrated.meta.step).toBe(8)
    expect(migrated.meta.completed).toEqual({ finish: true })
  })

  test("migrates the old numeric step to the matching new step", () => {
    const v1 = { ...good.state, meta: { ...good.state.meta, schema: 1, step: 5, completed: {} } }
    expect(migrate(v1).meta.stepId).toBe("children")
    expect(migrate(v1).meta.step).toBe(4)
  })

  test("encodeDraft produces a JSON blob with the app marker", async () => {
    const r = parseEnvelope(good)
    if (!r.ok) throw new Error("expected ok")
    const text = await encodeDraft(r.state).text()
    expect(text).toContain('"app": "tofes101"')
  })
})
