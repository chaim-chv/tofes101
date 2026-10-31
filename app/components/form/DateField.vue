<script setup lang="ts">
/**
 * Locale-friendly date field. The form stores ISO (`yyyy-mm-dd`); the user sees
 * and types `dd/mm/yyyy` (or pastes ISO). Deliberately not `<input type="date">`:
 * the native picker starts at today and is awkward for birth dates.
 */
const props = defineProps<{
  id: string
  modelValue: string
  disabled?: boolean
  readonly?: boolean
  ariaRequired?: boolean
  ariaInvalid?: boolean
}>()

const emit = defineEmits<{ "update:model-value": [value: string] }>()

const text = ref(format(props.modelValue))

watch(
  () => props.modelValue,
  (value) => {
    const next = format(value)
    if (next !== text.value) text.value = next
  },
)

function format(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "")
  return match ? `${match[3]}/${match[2]}/${match[1]}` : ""
}

function toIso(raw: string): string | null {
  const value = raw.trim()
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value)
  const local = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value)
  const parts = iso
    ? { y: Number(iso[1]), m: Number(iso[2]), d: Number(iso[3]) }
    : local
      ? { y: Number(local[3]), m: Number(local[2]), d: Number(local[1]) }
      : null
  if (!parts) return null
  const date = new Date(Date.UTC(parts.y, parts.m - 1, parts.d))
  if (
    date.getUTCFullYear() !== parts.y ||
    date.getUTCMonth() !== parts.m - 1 ||
    date.getUTCDate() !== parts.d ||
    parts.y < 1900 ||
    parts.y > 2100
  ) {
    return null
  }
  return `${parts.y}-${String(parts.m).padStart(2, "0")}-${String(parts.d).padStart(2, "0")}`
}

function onInput(value: string | number) {
  const raw = String(value ?? "")
  text.value = raw
  const iso = toIso(raw)
  // Commit as soon as the value is unambiguous (ISO or a complete local date).
  if (iso) emit("update:model-value", iso)
}

function onBlur() {
  const iso = toIso(text.value)
  if (iso) {
    text.value = format(iso)
    emit("update:model-value", iso)
    return
  }
  if (!text.value.trim()) {
    emit("update:model-value", "")
    return
  }
  // Keep the user's text visible so they can correct it; the engine reports the
  // missing/invalid value on the next validation pass.
  emit("update:model-value", "")
}
</script>

<template>
  <UInput
    :id="id"
    :model-value="text"
    type="text"
    inputmode="numeric"
    autocomplete="off"
    placeholder="dd/mm/yyyy"
    maxlength="10"
    dir="ltr"
    size="lg"
    class="w-full"
    :readonly="readonly"
    :disabled="disabled"
    :aria-required="ariaRequired"
    :aria-invalid="ariaInvalid"
    @update:model-value="onInput"
    @blur="onBlur"
  />
</template>
