<script setup lang="ts">
/**
 * One field, one component. Renders the label, help, error and the right
 * native control for `field.kind`. Business rules are NOT here: the parent
 * passes the value and the issues the engine computed.
 *
 * Native controls (not `URadioGroup` etc.) on purpose: identical semantics in
 * every browser, full control of RTL, and no hidden focus behavior.
 */
import type { FieldDef, Issue, Option } from "~/form/types"
import type { MessageKey } from "~/locales"

const props = defineProps<{
  field: FieldDef
  value: unknown
  issues?: Issue[]
  disabled?: boolean
  /** State-aware requiredness (a field's `required` may be a predicate). */
  required?: boolean
  /** Unique suffix so repeating rows never share a DOM id or radio group. */
  idSuffix?: string
}>()

const emit = defineEmits<{ "update:value": [value: unknown] }>()

const { t } = useLocale()

const errors = computed(() => props.issues?.filter((i) => i.severity === "error") ?? [])
const warnings = computed(() => props.issues?.filter((i) => i.severity === "warning") ?? [])
const error = computed(() => errors.value[0])
const warning = computed(() => warnings.value[0])
const isRequired = computed(() => props.required ?? props.field.required === true)

const suffix = computed(() => (props.idSuffix ? `-${props.idSuffix}` : ""))
const inputId = computed(() => `f-${props.field.id}${suffix.value}`)
const controlName = computed(() => `${props.field.id}${suffix.value}`)
const helpId = computed(() => `help-${props.field.id}${suffix.value}`)
const warnId = computed(() => `warn-${props.field.id}${suffix.value}`)
const errId = (index = 0) => `err-${props.field.id}${suffix.value}-${index}`

const describedBy = computed(() => {
  const ids: string[] = []
  if (props.field.helpKey) ids.push(helpId.value)
  if (errors.value.length) ids.push(...errors.value.map((_, i) => errId(i)))
  else if (warnings.value.length) ids.push(warnId.value)
  return ids.join(" ") || undefined
})

const inputType = computed(() => {
  if (props.field.kind === "date") return "date"
  if (props.field.inputMode === "email") return "email"
  if (props.field.inputMode === "tel") return "tel"
  return "text"
})

/** Prevent future dates in the native picker too; the engine still validates. */
const maxDate = computed(() => {
  if (props.field.kind !== "date") return undefined
  if (props.field.max) return props.field.max
  const now = new Date()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${m}-${d}`
})

const commonAttrs = computed(() => ({
  id: inputId.value,
  name: controlName.value,
  autocomplete: props.field.autoComplete ?? "off",
  inputmode: props.field.inputMode,
  maxlength: props.field.maxLength,
  pattern: props.field.pattern,
  disabled: props.disabled,
  "data-field-id": props.field.id,
  "aria-invalid": error.value ? true : undefined,
  "aria-describedby": describedBy.value,
  "aria-required": isRequired.value || undefined,
  class: [
    "w-full rounded-lg border bg-default px-3 py-2.5 text-base text-highlighted transition",
    "placeholder:text-dimmed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    error.value ? "border-error" : "border-default",
  ],
}))

function optionLabel(option: Option): string {
  if (option.labelKey) return t(option.labelKey as MessageKey)
  return option.label ?? String(option.value)
}

function textValue(): string {
  return typeof props.value === "string" ? props.value : ""
}

function isChecked(option: Option): boolean {
  if (props.field.kind === "checkbox") return props.value === option.value
  if (props.field.kind === "checkboxGroup") {
    return Array.isArray(props.value) && (props.value as unknown[]).includes(option.value)
  }
  return props.value === option.value
}

function toggleGroup(option: Option, checked: boolean) {
  const current = Array.isArray(props.value) ? [...(props.value as unknown[])] : []
  const next = checked ? [...current, option.value] : current.filter((v) => v !== option.value)
  emit("update:value", next)
}

/**
 * Enforce the field's alphabet while typing. Validation still reports what a
 * paste/import smuggled in; this only keeps the control honest.
 */
function filterInput(raw: string): string {
  switch (props.field.inputFilter) {
    case "digits":
      return raw.replace(/[^\d]/g, "")
    case "phone":
      return raw.replace(/[^\d+\s-]/g, "")
    case "decimal": {
      const cleaned = raw.replace(/[^\d.,]/g, "").replace(/,/g, ".")
      const [int = "", ...rest] = cleaned.split(".")
      const fraction = rest.join("").slice(0, 2)
      return rest.length ? `${int}.${fraction}` : int
    }
    default:
      return raw
  }
}

function onInput(event: Event) {
  const el = event.target as HTMLInputElement
  const next = filterInput(el.value)
  if (el.value !== next) el.value = next
  emit("update:value", next)
}

function onBlur(event: Event) {
  const el = event.target as HTMLInputElement
  let next = filterInput(el.value)
  // A trailing decimal point is not a number yet; drop it on blur.
  if (props.field.inputFilter === "decimal") next = next.replace(/\.$/, "")
  if (el.value !== next) el.value = next
  if (next !== props.value) emit("update:value", next)
}
</script>

<template>
  <!-- static content: never a control, always announced as prose -->
  <div v-if="field.kind === 'static'" :class="field.variant === 'warning' ? 'my-2' : 'my-2'">
    <UAlert
      v-if="field.variant"
      :color="field.variant === 'success' ? 'success' : field.variant === 'warning' ? 'warning' : field.variant === 'error' ? 'error' : 'info'"
      variant="subtle"
      :description="field.contentKey ? t(field.contentKey) : ''"
      :ui="{ description: 'text-highlighted opacity-100' }"
    />
    <p v-else class="text-sm leading-relaxed text-muted">
      {{ field.contentKey ? t(field.contentKey) : "" }}
    </p>
  </div>

  <!-- radio group -->
  <fieldset
    v-else-if="field.kind === 'radio'"
    :id="inputId"
    tabindex="-1"
    class="min-w-0 focus:outline-none"
    :aria-describedby="describedBy"
  >
    <legend class="mb-2 block text-sm font-medium text-highlighted">
      {{ field.labelKey ? t(field.labelKey) : "" }}
      <span v-if="isRequired" class="text-error" aria-hidden="true">*</span>
      <span v-if="isRequired" class="sr-only">({{ t("common.required") }})</span>
    </legend>
    <div class="grid gap-2 sm:grid-cols-2">
      <label
        v-for="(option, optionIndex) in field.options"
        :key="String(option.value)"
        class="flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition hover:bg-elevated/60"
        :class="isChecked(option) ? 'border-primary bg-primary/5' : 'border-default'"
      >
        <input
          :id="`${inputId}-opt-${optionIndex}`"
          type="radio"
          class="mt-1 size-4 shrink-0 accent-[var(--ui-primary)]"
          :name="controlName"
          :value="String(option.value)"
          :checked="isChecked(option)"
          :disabled="disabled"
          :data-field-id="field.id"
          :aria-invalid="error ? true : undefined"
          :aria-describedby="describedBy"
          :aria-required="isRequired || undefined"
          @change="emit('update:value', option.value)"
        />
        <span class="min-w-0 text-sm text-highlighted">{{ optionLabel(option) }}</span>
      </label>
    </div>
    <p v-if="field.helpKey" :id="helpId" class="mt-2 text-xs text-muted">
      {{ t(field.helpKey) }}
    </p>
    <p
      v-for="(issue, issueIndex) in errors"
      :id="errId(issueIndex)"
      :key="`${issue.code}-${issueIndex}`"
      class="mt-2 flex items-center gap-1 text-sm text-error"
    >
      <UIcon name="i-lucide-circle-alert" class="size-4 shrink-0" />
      {{ t(issue.messageKey, issue.params) }}
    </p>
    <p
      v-for="(issue, issueIndex) in errors.length ? [] : warnings"
      :id="warnId"
      :key="`${issue.code}-${issueIndex}`"
      class="mt-2 flex items-center gap-1 text-sm text-warning"
    >
      <UIcon name="i-lucide-triangle-alert" class="size-4 shrink-0" />
      {{ t(issue.messageKey, issue.params) }}
    </p>
  </fieldset>

  <!-- checkbox group -->
  <fieldset
    v-else-if="field.kind === 'checkboxGroup'"
    :id="inputId"
    tabindex="-1"
    class="min-w-0 focus:outline-none"
    :aria-describedby="describedBy"
  >
    <legend class="mb-2 block text-sm font-medium text-highlighted">
      {{ field.labelKey ? t(field.labelKey) : "" }}
      <span v-if="isRequired" class="text-error" aria-hidden="true">*</span>
      <span v-if="isRequired" class="sr-only">({{ t("common.required") }})</span>
    </legend>
    <div class="grid gap-2 sm:grid-cols-2">
      <label
        v-for="(option, optionIndex) in field.options"
        :key="String(option.value)"
        class="flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition hover:bg-elevated/60"
        :class="isChecked(option) ? 'border-primary bg-primary/5' : 'border-default'"
      >
        <input
          :id="`${inputId}-opt-${optionIndex}`"
          type="checkbox"
          class="mt-1 size-4 shrink-0 rounded accent-[var(--ui-primary)]"
          :name="`${controlName}[]`"
          :value="String(option.value)"
          :checked="isChecked(option)"
          :disabled="disabled"
          :data-field-id="field.id"
          :aria-invalid="error ? true : undefined"
          :aria-describedby="describedBy"
          :aria-required="isRequired || undefined"
          @change="toggleGroup(option, ($event.target as HTMLInputElement).checked)"
        />
        <span class="min-w-0 text-sm text-highlighted">{{ optionLabel(option) }}</span>
      </label>
    </div>
    <p v-if="field.helpKey" :id="helpId" class="mt-2 text-xs text-muted">
      {{ t(field.helpKey) }}
    </p>
    <p
      v-for="(issue, issueIndex) in errors"
      :id="errId(issueIndex)"
      :key="`${issue.code}-${issueIndex}`"
      class="mt-2 flex items-center gap-1 text-sm text-error"
    >
      <UIcon name="i-lucide-circle-alert" class="size-4 shrink-0" />
      {{ t(issue.messageKey, issue.params) }}
    </p>
    <p
      v-for="(issue, issueIndex) in errors.length ? [] : warnings"
      :id="warnId"
      :key="`${issue.code}-${issueIndex}`"
      class="mt-2 flex items-center gap-1 text-sm text-warning"
    >
      <UIcon name="i-lucide-triangle-alert" class="size-4 shrink-0" />
      {{ t(issue.messageKey, issue.params) }}
    </p>
  </fieldset>

  <!-- single checkbox -->
  <div v-else-if="field.kind === 'checkbox'" class="min-w-0">
    <label class="flex cursor-pointer items-start gap-3">
      <input
        :id="inputId"
        type="checkbox"
        class="mt-1 size-4 shrink-0 rounded accent-[var(--ui-primary)]"
        :name="controlName"
        :checked="value === true"
        :disabled="disabled"
        :data-field-id="field.id"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
        :aria-required="isRequired || undefined"
        @change="emit('update:value', ($event.target as HTMLInputElement).checked)"
      />
      <span class="min-w-0">
        <span class="block text-sm font-medium text-highlighted">
          {{ field.labelKey ? t(field.labelKey) : "" }}
          <span v-if="isRequired" class="text-error" aria-hidden="true">*</span>
          <span v-if="isRequired" class="sr-only">({{ t("common.required") }})</span>
        </span>
        <span v-if="field.helpKey" :id="helpId" class="mt-0.5 block text-xs text-muted">
          {{ t(field.helpKey) }}
        </span>
      </span>
    </label>
    <p
      v-for="(issue, issueIndex) in errors"
      :id="errId(issueIndex)"
      :key="`${issue.code}-${issueIndex}`"
      class="mt-2 flex items-center gap-1 text-sm text-error"
    >
      <UIcon name="i-lucide-circle-alert" class="size-4 shrink-0" />
      {{ t(issue.messageKey, issue.params) }}
    </p>
    <p
      v-for="(issue, issueIndex) in errors.length ? [] : warnings"
      :id="warnId"
      :key="`${issue.code}-${issueIndex}`"
      class="mt-2 flex items-center gap-1 text-sm text-warning"
    >
      <UIcon name="i-lucide-triangle-alert" class="size-4 shrink-0" />
      {{ t(issue.messageKey, issue.params) }}
    </p>
  </div>

  <!-- text / date / select -->
  <div v-else class="min-w-0">
    <label :for="inputId" class="mb-1.5 block text-sm font-medium text-highlighted">
      {{ field.labelKey ? t(field.labelKey) : "" }}
      <span v-if="isRequired" class="text-error" aria-hidden="true">*</span>
      <span v-if="isRequired" class="sr-only">({{ t("common.required") }})</span>
    </label>

    <select
      v-if="field.kind === 'select'"
      v-bind="commonAttrs"
      :value="textValue()"
      @change="emit('update:value', ($event.target as HTMLSelectElement).value)"
    >
      <option value="">{{ t("common.optionalHint") }}</option>
      <option v-for="option in field.options" :key="String(option.value)" :value="String(option.value)">
        {{ optionLabel(option) }}
      </option>
    </select>

    <input
      v-else
      v-bind="commonAttrs"
      :type="inputType"
      :min="field.kind === 'date' ? field.min : undefined"
      :max="maxDate"
      :dir="field.kind === 'date' || field.inputMode ? 'ltr' : undefined"
      :value="textValue()"
      @input="onInput"
      @blur="onBlur"
    />

    <p v-if="field.helpKey" :id="helpId" class="mt-1.5 text-xs text-muted">
      {{ t(field.helpKey) }}
    </p>
    <p
      v-for="(issue, issueIndex) in errors"
      :id="errId(issueIndex)"
      :key="`${issue.code}-${issueIndex}`"
      class="mt-1.5 flex items-center gap-1 text-sm text-error"
    >
      <UIcon name="i-lucide-circle-alert" class="size-4 shrink-0" />
      {{ t(issue.messageKey, issue.params) }}
    </p>
    <p
      v-for="(issue, issueIndex) in errors.length ? [] : warnings"
      :id="warnId"
      :key="`${issue.code}-${issueIndex}`"
      class="mt-1.5 flex items-center gap-1 text-sm text-warning"
    >
      <UIcon name="i-lucide-triangle-alert" class="size-4 shrink-0" />
      {{ t(issue.messageKey, issue.params) }}
    </p>
  </div>
</template>
