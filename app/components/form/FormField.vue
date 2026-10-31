<script setup lang="ts">
/**
 * One field, one component. It maps a `FieldDef` to Nuxt UI controls and passes
 * through the value/issues the engine computed. No business rules live here.
 *
 * The `f-<id>` id is kept stable because the error summary focuses those ids and
 * the e2e suite targets them.
 */
import type { CheckboxGroupItem, RadioGroupItem } from "@nuxt/ui"
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
  /** Prefilled by the employer link: readable, but not editable. */
  locked?: boolean
}>()

const emit = defineEmits<{ "update:value": [value: unknown] }>()

const { t } = useLocale()

const errors = computed(() => props.issues?.filter((i) => i.severity === "error") ?? [])
const warnings = computed(() => props.issues?.filter((i) => i.severity === "warning") ?? [])
const isRequired = computed(() => props.required ?? props.field.required === true)
const suffix = computed(() => (props.idSuffix ? `-${props.idSuffix}` : ""))
const inputId = computed(() => `f-${props.field.id}${suffix.value}`)

const label = computed(() => (props.field.labelKey ? t(props.field.labelKey) : ""))
const help = computed(() => (props.field.helpKey ? t(props.field.helpKey) : undefined))
const errorText = computed(() =>
  errors.value.length
    ? errors.value.map((issue) => t(issue.messageKey, issue.params)).join(" · ")
    : undefined,
)
const warningText = computed(() =>
  !errors.value.length && warnings.value.length
    ? warnings.value.map((issue) => t(issue.messageKey, issue.params)).join(" · ")
    : undefined,
)

function optionLabel(option: Option): string {
  if (option.labelKey) return t(option.labelKey as MessageKey)
  return option.label ?? String(option.value)
}

const options = computed(() =>
  (props.field.options ?? []).map((option) => ({
    label: optionLabel(option),
    value: String(option.value),
    description: option.hintKey ? t(option.hintKey) : undefined,
  })),
)

function originalValue(value: unknown): unknown {
  if (value === undefined) return undefined
  return props.field.options?.find((option) => String(option.value) === String(value))?.value
}

const radioValue = computed(() =>
  props.value === undefined || props.value === null ? undefined : String(props.value),
)

const checkboxValues = computed(() =>
  Array.isArray(props.value) ? (props.value as unknown[]).map(String) : [],
)

const textValue = computed(() => (typeof props.value === "string" ? props.value : ""))

const maxDate = computed(() => {
  if (props.field.kind !== "date") return undefined
  if (props.field.max) return props.field.max
  const now = new Date()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${m}-${d}`
})

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

function onText(value: string | number) {
  emit("update:value", filterInput(String(value)))
}

function onBlur(event: FocusEvent) {
  const el = event.target as HTMLInputElement
  if (props.field.inputFilter !== "decimal") return
  const next = el.value.replace(/\.$/, "")
  if (next !== el.value) {
    el.value = next
    emit("update:value", next)
  }
}
</script>

<template>
  <!-- static content: never a control, always announced as prose -->
  <div v-if="field.kind === 'static'" class="my-2">
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

  <UFormField
    v-else
    :name="field.id"
    :label="field.kind === 'checkbox' ? undefined : label"
    :description="field.kind === 'checkbox' ? undefined : help"
    :error="errorText"
    :required="isRequired"
    :hint="locked && field.kind !== 'checkbox' ? t('form.prefill.locked') : undefined"
    :ui="{ label: 'text-sm font-medium text-highlighted' }"
  >
    <div :data-field-id="field.id">
      <URadioGroup
        v-if="field.kind === 'radio'"
        :id="inputId"
        :model-value="radioValue"
        :items="options as RadioGroupItem[]"
        variant="card"
        :disabled="disabled || locked"
        :aria-required="isRequired || undefined"
        :aria-invalid="errorText ? true : undefined"
        :ui="{ fieldset: 'grid gap-2 sm:grid-cols-2' }"
        @update:model-value="(value) => emit('update:value', originalValue(value))"
      />

      <UCheckboxGroup
        v-else-if="field.kind === 'checkboxGroup'"
        :id="inputId"
        :model-value="checkboxValues"
        :items="options as CheckboxGroupItem[]"
        variant="card"
        :disabled="disabled || locked"
        :aria-invalid="errorText ? true : undefined"
        :ui="{ fieldset: 'grid gap-2 sm:grid-cols-2' }"
        @update:model-value="(values) => emit('update:value', (values as unknown[]).map((value) => originalValue(value)))"
      />

      <UCheckbox
        v-else-if="field.kind === 'checkbox'"
        :id="inputId"
        :model-value="value === true"
        :label="label"
        :description="help"
        :disabled="disabled || locked"
        :aria-required="isRequired || undefined"
        :aria-invalid="errorText ? true : undefined"
        @update:model-value="(checked) => emit('update:value', checked)"
      />
      <USelect
        v-else-if="field.kind === 'select'"
        :id="inputId"
        :model-value="textValue"
        :items="options"
        :placeholder="t('common.optionalHint')"
        :disabled="disabled || locked"
        :aria-required="isRequired || undefined"
        :aria-invalid="errorText ? true : undefined"
        size="lg"
        class="w-full"
        @update:model-value="(value) => emit('update:value', String(value ?? ''))"
      />

      <LazyCityField
        v-else-if="field.suggestionsSource === 'cities'"
        :id="inputId"
        :model-value="textValue"
        :readonly="locked"
        :disabled="disabled && !locked"
        :aria-required="isRequired || undefined"
        :aria-invalid="errorText ? true : undefined"
        @update:model-value="(value) => emit('update:value', value)"
      />

      <UInput
        v-else
        :id="inputId"
        :model-value="textValue"
        :type="field.kind === 'date' ? 'date' : field.inputMode === 'email' ? 'email' : field.inputMode === 'tel' ? 'tel' : 'text'"
        :inputmode="field.inputMode"
        :autocomplete="field.autoComplete ?? 'off'"
        :maxlength="field.maxLength"
        :pattern="field.pattern"
        :min="field.kind === 'date' ? field.min : undefined"
        :max="maxDate"
        :readonly="locked"
        :disabled="disabled && !locked"
        :aria-required="isRequired || undefined"
        :aria-invalid="errorText ? true : undefined"
        :dir="field.kind === 'date' || field.inputMode ? 'ltr' : undefined"
        size="lg"
        class="w-full"
        @update:model-value="onText"
        @blur="onBlur"
      />

      <p v-if="warningText" class="mt-1.5 flex items-center gap-1 text-sm text-warning">
        <UIcon name="i-lucide-triangle-alert" class="size-4 shrink-0" />
        {{ warningText }}
      </p>
    </div>
  </UFormField>
</template>
