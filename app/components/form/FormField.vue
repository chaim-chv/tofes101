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
  firstErrorId?: string
}>()

const emit = defineEmits<{ "update:value": [value: unknown] }>()

const { t } = useLocale()

const error = computed(() => props.issues?.find((i) => i.severity === "error"))
const warning = computed(() => props.issues?.find((i) => i.severity === "warning"))
const isRequired = computed(() => props.field.required === true)
const describedBy = computed(() => {
  const ids: string[] = []
  if (props.field.helpKey) ids.push(`help-${props.field.id}`)
  if (error.value) ids.push(`err-${props.field.id}`)
  else if (warning.value) ids.push(`warn-${props.field.id}`)
  return ids.join(" ") || undefined
})
const inputId = computed(() => `f-${props.field.id}`)

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

const commonAttrs = computed(() => ({
  id: inputId.value,
  name: props.field.id,
  autocomplete: props.field.autoComplete ?? "off",
  inputmode: props.field.inputMode,
  maxlength: props.field.maxLength,
  disabled: props.disabled,
  "aria-invalid": error.value ? true : undefined,
  "aria-describedby": describedBy.value,
  "aria-required": isRequired.value || undefined,
  class: [
    "w-full rounded-lg border bg-default px-3 py-2.5 text-base text-highlighted transition",
    "placeholder:text-dimmed focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    error.value ? "border-error" : "border-default",
  ],
}))
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
    class="min-w-0"
    :aria-describedby="describedBy"
  >
    <legend class="mb-2 block text-sm font-medium text-highlighted">
      {{ field.labelKey ? t(field.labelKey) : "" }}
      <span v-if="isRequired" class="text-error" aria-hidden="true">*</span>
      <span v-if="isRequired" class="sr-only">({{ t("common.required") }})</span>
    </legend>
    <div class="grid gap-2 sm:grid-cols-2">
      <label
        v-for="option in field.options"
        :key="String(option.value)"
        class="flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition hover:bg-elevated/60"
        :class="isChecked(option) ? 'border-primary bg-primary/5' : 'border-default'"
      >
        <input
          type="radio"
          class="mt-1 size-4 shrink-0 accent-[var(--ui-primary)]"
          :name="field.id"
          :value="String(option.value)"
          :checked="isChecked(option)"
          :disabled="disabled"
          :aria-describedby="describedBy"
          @change="emit('update:value', option.value)"
        />
        <span class="min-w-0 text-sm text-highlighted">{{ optionLabel(option) }}</span>
      </label>
    </div>
    <p v-if="field.helpKey" :id="`help-${field.id}`" class="mt-2 text-xs text-muted">
      {{ t(field.helpKey) }}
    </p>
    <p v-if="error" :id="`err-${field.id}`" class="mt-2 flex items-center gap-1 text-sm text-error">
      <UIcon name="i-lucide-circle-alert" class="size-4 shrink-0" />
      {{ t(error.messageKey, error.params) }}
    </p>
  </fieldset>

  <!-- checkbox group -->
  <fieldset
    v-else-if="field.kind === 'checkboxGroup'"
    class="min-w-0"
    :aria-describedby="describedBy"
  >
    <legend class="mb-2 block text-sm font-medium text-highlighted">
      {{ field.labelKey ? t(field.labelKey) : "" }}
      <span v-if="isRequired" class="text-error" aria-hidden="true">*</span>
    </legend>
    <div class="grid gap-2 sm:grid-cols-2">
      <label
        v-for="option in field.options"
        :key="String(option.value)"
        class="flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition hover:bg-elevated/60"
        :class="isChecked(option) ? 'border-primary bg-primary/5' : 'border-default'"
      >
        <input
          type="checkbox"
          class="mt-1 size-4 shrink-0 rounded accent-[var(--ui-primary)]"
          :name="`${field.id}[]`"
          :value="String(option.value)"
          :checked="isChecked(option)"
          :disabled="disabled"
          @change="toggleGroup(option, ($event.target as HTMLInputElement).checked)"
        />
        <span class="min-w-0 text-sm text-highlighted">{{ optionLabel(option) }}</span>
      </label>
    </div>
    <p v-if="field.helpKey" :id="`help-${field.id}`" class="mt-2 text-xs text-muted">
      {{ t(field.helpKey) }}
    </p>
    <p v-if="error" :id="`err-${field.id}`" class="mt-2 flex items-center gap-1 text-sm text-error">
      <UIcon name="i-lucide-circle-alert" class="size-4 shrink-0" />
      {{ t(error.messageKey, error.params) }}
    </p>
  </fieldset>

  <!-- single checkbox -->
  <div v-else-if="field.kind === 'checkbox'" class="min-w-0">
    <label class="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        class="mt-1 size-4 shrink-0 rounded accent-[var(--ui-primary)]"
        :checked="value === true"
        :disabled="disabled"
        :id="inputId"
        :aria-describedby="describedBy"
        @change="emit('update:value', ($event.target as HTMLInputElement).checked)"
      />
      <span class="min-w-0">
        <span class="block text-sm font-medium text-highlighted">
          {{ field.labelKey ? t(field.labelKey) : "" }}
        </span>
        <span v-if="field.helpKey" :id="`help-${field.id}`" class="mt-0.5 block text-xs text-muted">
          {{ t(field.helpKey) }}
        </span>
      </span>
    </label>
    <p v-if="error" :id="`err-${field.id}`" class="mt-2 flex items-center gap-1 text-sm text-error">
      <UIcon name="i-lucide-circle-alert" class="size-4 shrink-0" />
      {{ t(error.messageKey, error.params) }}
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
      :type="field.kind === 'date' ? 'date' : 'text'"
      :dir="field.kind === 'date' || field.inputMode ? 'ltr' : undefined"
      :value="textValue()"
      @input="emit('update:value', ($event.target as HTMLInputElement).value)"
    />

    <p v-if="field.helpKey" :id="`help-${field.id}`" class="mt-1.5 text-xs text-muted">
      {{ t(field.helpKey) }}
    </p>
    <p v-if="error" :id="`err-${field.id}`" class="mt-1.5 flex items-center gap-1 text-sm text-error">
      <UIcon name="i-lucide-circle-alert" class="size-4 shrink-0" />
      {{ t(error.messageKey, error.params) }}
    </p>
    <p v-else-if="warning" :id="`warn-${field.id}`" class="mt-1.5 flex items-center gap-1 text-sm text-warning">
      <UIcon name="i-lucide-triangle-alert" class="size-4 shrink-0" />
      {{ t(warning.messageKey, warning.params) }}
    </p>
  </div>
</template>
