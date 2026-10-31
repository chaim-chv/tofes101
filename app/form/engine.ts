/**
 * The engine. Pure functions over `FormSchema` + `FormState`.
 *
 * Nothing here imports Vue, Nuxt, IndexedDB or the DOM — that is what makes the
 * whole product testable, and what lets the same rules drive the UI, the review
 * screen and the PDF.
 */
import type {
  FieldDef,
  FieldValue,
  FieldId,
  FormSchema,
  FormState,
  Issue,
  Step,
  StepId,
  StepView,
  ValidationResult,
} from "./types"
import { isEmpty, rowKey } from "./values"
import { stamp } from "./validators"

/* ------------------------------------------------------------------ visibility */

export function isVisible(field: FieldDef, state: FormState): boolean {
  if (field.kind === "static") return field.when ? field.when(state) : true
  return field.when ? field.when(state) : true
}

export function isStepVisible(step: Step, state: FormState): boolean {
  return step.when ? step.when(state) : true
}

export function isRequired(field: FieldDef, state: FormState): boolean {
  return typeof field.required === "function" ? field.required(state) : field.required === true
}

/* ----------------------------------------------------------------- validation */

/**
 * `maxLength` is enforced here as well as in the input's HTML attribute: pasted,
 * imported and restored drafts never pass through the control.
 */
function lengthIssue(field: FieldDef, value: unknown): Issue | null {
  if (!field.maxLength || typeof value !== "string") return null
  if (value.length <= field.maxLength) return null
  return {
    field: field.id,
    code: "length",
    severity: "error",
    messageKey: "err.tooLong",
    params: { max: field.maxLength },
  }
}

export function validateField(field: FieldDef, state: FormState): Issue[] {
  if (field.kind === "static" || field.kind === "section") return []
  if (!isVisible(field, state)) return []

  const value = state.values[field.id] as FieldValue | undefined
  const required = isRequired(field, state)

  // Repeaters validate their rows: each sub-field keeps its own rules and error
  // target, so the UI can focus the exact input that failed.
  if (field.kind === "repeat") {
    const items = Array.isArray(value) ? (value as unknown as Array<Record<string, unknown>>) : []
    const out: Issue[] = []
    if (required && items.length < Math.max(1, field.minItems ?? 0)) {
      out.push({ field: field.id, code: "required", severity: "error", messageKey: "err.required" })
    }
    // A person cannot appear twice in the same repeater (two children with one ID).
    const seen = new Map<string, number>()
    items.forEach((item, index) => {
      const idKey = field.fields?.find((f) => f.id.endsWith(".idNum"))
      if (!idKey) return
      const value = String(item[rowKey(idKey.id)] ?? "").trim()
      if (!value) return
      const previous = seen.get(value)
      if (previous !== undefined) {
        out.push({
          field: `${field.id}.${rowKey(idKey.id)}`,
          code: "id.duplicate",
          severity: "error",
          messageKey: "err.id.duplicateRow",
          params: { first: previous + 1, second: index + 1 },
          rowKey: String(item._key),
        })
      } else {
        seen.set(value, index)
      }
    })

    for (const item of items) {
      const itemKey = String(item._key)
      for (const sub of field.fields ?? []) {
        const key = rowKey(sub.id)
        const id = `${field.id}.${key}`
        const subValue = item[key]
        const subRequired = typeof sub.required === "function" ? sub.required(state) : sub.required === true
        if (subRequired && isEmpty(sub, subValue)) {
          out.push({ field: id, code: "required", severity: "error", messageKey: "err.required", rowKey: itemKey })
          continue
        }
        if (isEmpty(sub, subValue)) continue
        const tooLong = lengthIssue({ ...sub, id }, subValue)
        if (tooLong) {
          out.push({ ...tooLong, rowKey: itemKey })
          continue
        }
        if (sub.validate) {
          out.push(...stamp(id, sub.validate(subValue as FieldValue, state)).map((i) => ({ ...i, rowKey: itemKey })))
        }
      }
    }
    return out
  }

  if (required && isEmpty(field, value)) {
    return [{ field: field.id, code: "required", severity: "error", messageKey: "err.required" }]
  }

  // an empty optional field has nothing else to prove
  if (isEmpty(field, value)) return []

  const tooLong = lengthIssue(field, value)
  if (tooLong) return [tooLong]

  return stamp(field.id, field.validate ? field.validate(value, state) : [])
}

/** Fields of a step, including the row templates of repeaters (for tests). */
export function stepFields(step: Step): FieldDef[] {
  return [...step.fields]
}

export function validateStep(schema: FormSchema, state: FormState, stepId: StepId): Issue[] {
  const step = schema.steps.find((s) => s.id === stepId)
  if (!step) return []
  if (!isStepVisible(step, state)) return []
  return step.fields.flatMap((f) => validateField(f, state))
}

export function validateAll(schema: FormSchema, state: FormState): ValidationResult {
  const issues: Issue[] = []
  const byStep: Record<StepId, Issue[]> = {}
  for (const step of schema.steps) {
    if (!isStepVisible(step, state)) continue
    const stepIssues = step.fields.flatMap((f) => validateField(f, state))
    if (stepIssues.length) byStep[step.id] = stepIssues
    issues.push(...stepIssues)
  }
  const byField: Record<FieldId, Issue[]> = {}
  for (const i of issues) (byField[i.field] ??= []).push(i)

  return {
    issues,
    errors: issues.filter((i) => i.severity === "error"),
    warnings: issues.filter((i) => i.severity === "warning"),
    byField,
    byStep,
  }
}

/** Whether the user may move from `stepId` to the next step. */
export function canAdvance(
  schema: FormSchema,
  state: FormState,
  stepId: StepId,
): { ok: boolean; errors: Issue[] } {
  const errors = validateStep(schema, state, stepId).filter((i) => i.severity === "error")
  return { ok: errors.length === 0, errors }
}

/* ------------------------------------------------------------------ navigation */

export function visibleSteps(schema: FormSchema, state: FormState): Step[] {
  return schema.steps.filter((s) => isStepVisible(s, state))
}

export function stepViews(schema: FormSchema, state: FormState, issues: ValidationResult): StepView[] {
  const visible = visibleSteps(schema, state)
  const currentIndex = Math.min(state.meta.step, visible.length - 1)
  return schema.steps.map((step, index) => {
    const visibleIndex = visible.findIndex((s) => s.id === step.id)
    const isCurrent = visibleIndex === currentIndex && visibleIndex !== -1
    const skipped = visibleIndex === -1
    const done = !skipped && !!state.meta.completed[step.id]
    return {
      id: step.id,
      index,
      visibleIndex,
      titleKey: step.titleKey,
      status: skipped ? "skipped" : isCurrent ? "current" : done ? "done" : "todo",
      issueCount: issues.byStep[step.id]?.filter((i) => i.severity === "error").length ?? 0,
    }
  })
}

export function progress(schema: FormSchema, state: FormState): { done: number; total: number; pct: number } {
  const visible = visibleSteps(schema, state)
  const done = visible.filter((s) => state.meta.completed[s.id]).length
  const total = visible.length
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) }
}

/** Next visible step after `stepId`, or null at the end. */
export function nextStep(schema: FormSchema, state: FormState, stepId: StepId): Step | null {
  const visible = visibleSteps(schema, state)
  const i = visible.findIndex((s) => s.id === stepId)
  return i === -1 ? null : (visible[i + 1] ?? null)
}

export function prevStep(schema: FormSchema, state: FormState, stepId: StepId): Step | null {
  const visible = visibleSteps(schema, state)
  const i = visible.findIndex((s) => s.id === stepId)
  return i <= 0 ? null : (visible[i - 1] ?? null)
}

/**
 * Find where the user actually is when they deep-link to a step: the first step
 * that has an error, or the requested one if everything before it is valid.
 */
export function resolveEntryStep(
  schema: FormSchema,
  state: FormState,
  requested: number,
): { index: number; redirected: boolean; blockingStepId?: StepId } {
  const visible = visibleSteps(schema, state)
  const target = Math.max(0, Math.min(requested, visible.length - 1))
  for (let i = 0; i < target; i++) {
    const step = visible[i]
    if (!step) break
    const errors = validateStep(schema, state, step.id).filter((x) => x.severity === "error")
    if (errors.length) return { index: i, redirected: true, blockingStepId: step.id }
  }
  return { index: target, redirected: target !== requested }
}

/* -------------------------------------------------------------------- summary */

/** All visible fields of a step with their resolved values, for the review page. */
export function stepSummary(step: Step, state: FormState) {
  return step.fields
    .filter((f) => f.kind !== "static" && isVisible(f, state))
    .map((f) => ({ field: f, value: state.values[f.id], required: isRequired(f, state) }))
}

/**
 * Recompute `hidden` so the app knows which answers are currently suppressed.
 * Answers are never deleted here — see ADR "never lose an answer".
 */
export function updateHidden(schema: FormSchema, state: FormState): FormState {
  const hidden: Record<FieldId, true> = {}
  for (const f of schema.allFields) {
    if (f.kind === "static" || f.kind === "section") continue
    if (!isVisible(f, state) && !isEmpty(f, state.values[f.id])) hidden[f.id] = true
  }
  const sameKeys =
    Object.keys(hidden).length === Object.keys(state.hidden).length &&
    Object.keys(hidden).every((k) => state.hidden[k])
  return sameKeys ? state : { ...state, hidden }
}

export function hiddenCount(state: FormState): number {
  return Object.keys(state.hidden).length
}
