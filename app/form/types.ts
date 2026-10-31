/**
 * The form contract. Pure types — nothing here imports Vue, Nuxt or storage.
 *
 * Every fact about a field lives on one `FieldDef`: label, help, condition,
 * requiredness, validation, and its place in the PDF. Adding a copy of any of
 * those somewhere else (a template `v-if`, a second validation in a component)
 * is a bug by definition.
 */
import type { MessageKey } from "~/locales"

export type FieldId = string
export type StepId = string

/** Values a single (non-repeating) field can hold. */
export type FieldValue = string | number | boolean | null | string[] | number[] | undefined

export type FieldKind =
  | "text"
  | "date"
  | "radio"
  | "select"
  | "checkbox"
  | "checkboxGroup"
  | "repeat"
  | "signature"
  | "static"
  | "section"

export type Option = {
  value: string | number | boolean
  labelKey?: MessageKey
  /** Free text for an option that is data, not copy (e.g. a city list item). */
  label?: string
  /** Short note under the option, optional. */
  hintKey?: MessageKey
}

/** Where a value is printed on the official form. View coordinates, A4 points. */
export type PdfSlot = {
  page: 1 | 2
  /** x of the slot's start edge (right edge for RTL text). */
  x: number
  y: number
  size?: number
  maxWidth?: number
  align?: "start" | "end" | "center"
  /** Print the label's value instead of the raw value (radio/checkbox groups). */
  asLabel?: boolean
  /** checked-mark glyph instead of text (checkbox-style boxes on the form). */
  mark?: boolean
}

export type IssueSeverity = "error" | "warning"

export type Issue = {
  field: FieldId
  code: string
  severity: IssueSeverity
  messageKey: MessageKey
  params?: Record<string, string | number>
  /** For a repeat row: the row's stable `_key`, so focus can target that row. */
  rowKey?: string
}

export type Signature = {
  kind: "drawn" | "typed"
  /** Normalised strokes [x,y][], 0..1, only for `drawn`. */
  strokes?: number[][][]
  typedName?: string
  signedAt: string
  declarationVersion: string
  /**
   * Fingerprint of the answers at signing time. When any non-signature answer
   * changes, the signature no longer covers the document and must be renewed.
   */
  answersHash?: string
}

export type RepeatItem = Record<string, FieldValue> & { _key: string }

export type FormValues = Record<FieldId, FieldValue | RepeatItem[] | Signature>

export type FormState = {
  meta: {
    schema: number
    taxYear: number
    locale: "he" | "en"
    /** Legacy numeric step index (still written for old drafts/PDF tests). */
    step: number
    /** Stable step id. This is what the URL and navigation use. */
    stepId?: StepId
    createdAt: string
    updatedAt: string
    /** steps that have been visited and were valid at least once */
    completed: Record<StepId, true>
    declarationVersion: string
    /** Set when a PDF was generated, so a reload can show the result state. */
    lastExportAt?: string
  }
  values: FormValues
  /** answers that are currently hidden by a condition — kept, never deleted */
  hidden: Record<FieldId, true>
}

export type Validator = (value: FieldValue, state: FormState) => Issue[]

export type FieldBase = {
  id: FieldId
  kind: FieldKind
  /** Stable human key; also the export key. */
  labelKey?: MessageKey
  helpKey?: MessageKey
  /** Value the field starts with (before the user touches it). */
  initial?: FieldValue | boolean
  /** Shown only when true (or when absent). */
  when?: (state: FormState) => boolean
  /** Required for this state. */
  required?: boolean | ((state: FormState) => boolean)
  validate?: Validator
  /** Error-only fields block progress; warnings never do. */
  blocksStep?: boolean
  options?: readonly Option[]
  placeholderKey?: MessageKey
  autoComplete?: string
  inputMode?: "text" | "numeric" | "tel" | "email" | "decimal"
  /** Keep the typed value inside the field's alphabet as the user types. */
  inputFilter?: "digits" | "decimal" | "phone"
  /** HTML `pattern` for browsers that support native constraint hints. */
  pattern?: string
  /** Native date bounds (ISO `yyyy-mm-dd`). */
  min?: string
  max?: string
  /** Suggestion list for a searchable text field (free text stays allowed). */
  suggestions?: readonly string[]
  /** Named lazy suggestion source (kept out of the first-load chunk). */
  suggestionsSource?: "cities"
  maxLength?: number
  /** Grid width on desktop, in twelfths. */
  span?: 12 | 6 | 4 | 3
  pdf?: PdfSlot
  /** Static content: rendered as prose inside a step (no value). */
  contentKey?: MessageKey
  variant?: "info" | "warning" | "error" | "success"
  /** For `repeat`: the row template. */
  fields?: readonly FieldDef[]
  /** For `repeat`: message keys for the add button and the row title. */
  addKey?: MessageKey
  rowTitleKey?: MessageKey
  minItems?: number
  maxItems?: number
}

export type FieldDef = FieldBase

export type Step = {
  id: StepId
  titleKey: MessageKey
  /** Long-form explanation shown above the fields. */
  introKey?: MessageKey
  fields: readonly FieldDef[]
  /** Skipped entirely when false, with an explanation (never silently). */
  when?: (state: FormState) => boolean
  skipReasonKey?: MessageKey
}

export type FormSchema = {
  id: "itc-101"
  taxYear: number
  /** Bump when `FormValues` shape changes in a breaking way. */
  schemaVersion: number
  declarationVersion: string
  steps: readonly Step[]
  /** All fields, flattened, in render order (built once at module load). */
  allFields: readonly FieldDef[]
}

export type StepStatus = "todo" | "current" | "done" | "skipped"

export type StepView = {
  id: StepId
  /** Index in `schema.steps` (may include skipped steps). */
  index: number
  /** Index in `visibleSteps`; -1 when the step is skipped. */
  visibleIndex: number
  titleKey: MessageKey
  status: StepStatus
  issueCount: number
}

export type ValidationResult = {
  issues: Issue[]
  errors: Issue[]
  warnings: Issue[]
  byField: Record<FieldId, Issue[]>
  byStep: Record<StepId, Issue[]>
}
