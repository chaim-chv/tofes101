/**
 * The only stateful object in the form. Everything else is a pure function.
 *
 * Responsibilities:
 *  - hold the draft (reactive), expose actions with names that say what they do;
 *  - run the engine (visibility/validation) and keep `hidden` in sync;
 *  - persist through the storage adapter (debounced) and handle multi-tab edits;
 *  - never contain a business rule — if you are tempted to write
 *    `if (marital === 'married')` here, it belongs in `schema.ts`.
 */
import { schema as defaultSchema } from "~/form/schema"
import {
  canAdvance,
  isStepVisible,
  isVisible,
  progress as progressOf,
  resolveEntryStep,
  stepViews,
  updateHidden,
  validateAll,
  validateField,
  visibleSteps,
} from "~/form/engine"
import { addRepeatItem, emptyState, removeRepeatItem, setField, setRepeatItemValue } from "~/form/values"
import type { FieldDef, FormSchema, FormState, Issue, Step, ValidationResult } from "~/form/types"
import { createDraftStore, type ImportResult } from "~/storage/draft"

export function useFormStore(options: { schema?: FormSchema } = {}) {
  const schema = options.schema ?? defaultSchema

  const state = useState<FormState>("form-state", () => emptyState(schema.taxYear))
  const hydrated = useState<boolean>("form-hydrated", () => false)
  const saving = useState<boolean>("form-saving", () => false)
  const lastSavedAt = useState<string | null>("form-last-saved", () => null)
  const conflict = useState<boolean>("form-conflict", () => false)

  const store = import.meta.client ? createDraftStore() : null

  /* ------------------------------------------------------------ derived view */

  const issues = computed<ValidationResult>(() => validateAll(schema, state.value))
  const steps = computed(() => stepViews(schema, state.value, issues.value))
  const progress = computed(() => progressOf(schema, state.value))
  const visibleList = computed(() => visibleSteps(schema, state.value))
  const currentStepIndex = computed(() => Math.min(state.value.meta.step, visibleList.value.length - 1))
  const currentStep = computed<Step | undefined>(() => visibleList.value[currentStepIndex.value])
  const currentIssues = computed<Issue[]>(() => {
    const id = currentStep.value?.id
    return id ? (issues.value.byStep[id] ?? []) : []
  })
  const currentErrors = computed(() => currentIssues.value.filter((i) => i.severity === "error"))

  function fieldIssues(id: string): Issue[] {
    return issues.value.byField[id] ?? []
  }

  function visibleFields(step: Step): FieldDef[] {
    return step.fields.filter((f) => isVisible(f, state.value))
  }

  function skipReasonKey(step: Step): string | undefined {
    return !isStepVisible(step, state.value) ? step.skipReasonKey : undefined
  }

  /* ---------------------------------------------------------------- mutations */

  let saveTimer: ReturnType<typeof setTimeout> | null = null
  const channel: BroadcastChannel | null =
    import.meta.client && typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("tofes101.draft") : null

  channel?.addEventListener("message", (event) => {
    if (event.data === "saved" && !saving.value) conflict.value = true
  })
  if (import.meta.client) {
    onScopeDispose?.(() => channel?.close())
  }

  function touch() {
    if (!import.meta.client) return
    if (saveTimer) clearTimeout(saveTimer)
    saving.value = true
    saveTimer = setTimeout(() => void flush(), 500)
  }

  async function flush() {
    if (!store) return
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    try {
      await store.save(state.value)
      lastSavedAt.value = new Date().toISOString()
      channel?.postMessage("saved")
    } catch (e) {
      console.warn("[draft] save failed", e)
    } finally {
      saving.value = false
    }
  }

  function setValue(id: string, value: unknown) {
    state.value = updateHidden(schema, setField(state.value, id, value))
    touch()
  }

  function setSubValue(fieldId: string, key: string, subId: string, value: unknown) {
    state.value = updateHidden(schema, setRepeatItemValue(state.value, fieldId, key, subId, value))
    touch()
  }

  function addRow(field: FieldDef) {
    state.value = updateHidden(schema, addRepeatItem(state.value, field.id, field.fields))
    touch()
  }

  function removeRow(fieldId: string, key: string) {
    state.value = updateHidden(schema, removeRepeatItem(state.value, fieldId, key))
    touch()
  }

  function validateFieldNow(id: string): Issue[] {
    const field = schema.allFields.find((f) => f.id === id)
    return field ? validateField(field, state.value) : []
  }

  /* -------------------------------------------------------------- navigation */

  function goTo(index: number, opts: { force?: boolean } = {}) {
    const list = visibleList.value
    const target = Math.max(0, Math.min(index, list.length - 1))
    const targetStep = list[target]
    if (!targetStep) return { ok: false, errors: [] as Issue[] }

    if (!opts.force && target > currentStepIndex.value) {
      const check = canAdvance(schema, state.value, currentStep.value?.id ?? "")
      if (!check.ok) return check
    }

    const leaving = currentStep.value
    const leavingIsValid = leaving ? canAdvance(schema, state.value, leaving.id).ok : false
    state.value = {
      ...state.value,
      meta: {
        ...state.value.meta,
        completed: leavingIsValid
          ? { ...state.value.meta.completed, [leaving!.id]: true }
          : state.value.meta.completed,
        step: target,
      },
    }
    void flush()
    syncUrl()
    return { ok: true, errors: [] as Issue[] }
  }

  function next() {
    return goTo(currentStepIndex.value + 1)
  }

  function back() {
    return goTo(currentStepIndex.value - 1, { force: true })
  }

  function goToId(id: string, opts: { force?: boolean } = {}) {
    const index = visibleList.value.findIndex((s) => s.id === id)
    return index === -1 ? { ok: false, errors: [] as Issue[] } : goTo(index, opts)
  }

  function syncUrl() {
    if (!import.meta.client) return
    const url = new URL(location.href)
    const step = state.value.meta.step
    if (step === 0) url.searchParams.delete("step")
    else url.searchParams.set("step", String(step))
    history.replaceState(null, "", url.toString())
  }

  /* -------------------------------------------------------------- lifecycle */

  async function hydrate() {
    if (hydrated.value) return
    hydrated.value = true
    if (!store) return
    try {
      const loaded = await store.load()
      if (!loaded) return
      state.value = updateHidden(schema, loaded)
      const requested = Number(new URL(location.href).searchParams.get("step") ?? loaded.meta.step ?? 0)
      const entry = resolveEntryStep(schema, state.value, Number.isFinite(requested) ? requested : 0)
      state.value = { ...state.value, meta: { ...state.value.meta, step: entry.index } }
    } catch (e) {
      console.warn("[draft] load failed", e)
    }
  }

  function applyPrefill(values: Record<string, unknown>) {
    let next = state.value
    for (const [id, value] of Object.entries(values)) next = setField(next, id, value)
    state.value = updateHidden(schema, next)
    touch()
  }

  async function reset() {
    state.value = emptyState(schema.taxYear)
    await store?.clear()
    lastSavedAt.value = null
    syncUrl()
  }

  async function exportDraft(): Promise<Blob | null> {
    return store ? store.export(state.value) : null
  }

  async function importDraft(file: File): Promise<ImportResult> {
    if (!store) return { ok: false, reason: "unavailable" }
    const result = await store.import(file)
    if (result.ok) {
      state.value = updateHidden(schema, result.state)
      await flush()
    }
    return result
  }

  return {
    schema,
    state,
    hydrated,
    saving,
    lastSavedAt,
    conflict,
    issues,
    steps,
    progress,
    currentStep,
    currentStepIndex,
    currentIssues,
    currentErrors,
    fieldIssues,
    visibleFields,
    skipReasonKey,
    setValue,
    setSubValue,
    addRow,
    removeRow,
    validateFieldNow,
    goTo,
    goToId,
    next,
    back,
    hydrate,
    flush,
    reset,
    exportDraft,
    importDraft,
    applyPrefill,
  }
}
