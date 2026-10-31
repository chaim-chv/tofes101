<script setup lang="ts">
/**
 * City autocomplete. Kept in its own component so the 1,278-name list and the
 * `UInputMenu` implementation are loaded only on the contact step.
 */
import { CITIES } from "~/form/cities"

defineProps<{
  id: string
  modelValue: string
  disabled?: boolean
  readonly?: boolean
  ariaRequired?: boolean
  ariaInvalid?: boolean
}>()

const emit = defineEmits<{ "update:model-value": [value: string] }>()
const cityItems: string[] = [...CITIES]
</script>

<template>
  <UInputMenu
    :id="id"
    :model-value="modelValue"
    :items="cityItems"
    create-item
    mode="autocomplete"
    size="lg"
    class="w-full"
    :readonly="readonly"
    :disabled="disabled"
    :aria-required="ariaRequired"
    :aria-invalid="ariaInvalid"
    @update:model-value="(value) => emit('update:model-value', String(value ?? ''))"
  />
</template>
