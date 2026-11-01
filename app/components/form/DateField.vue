<script setup lang="ts">
/**
 * Date field built on Nuxt UI's `UInputDate`: locale-aware day/month/year
 * segments, keyboard editing, and a calendar popover. Storage stays ISO.
 */
import { CalendarDate, type DateValue } from "@internationalized/date"

const props = defineProps<{
  id: string
  label?: string
  defaultYear?: number
  modelValue: string
  disabled?: boolean
  readonly?: boolean
  ariaRequired?: boolean
  ariaInvalid?: boolean
}>()

const emit = defineEmits<{ "update:model-value": [value: string] }>()
const { t } = useLocale()

const model = shallowRef<CalendarDate | null>(fromIso(props.modelValue))
const calendarOpen = ref(false)

const today = new Date()
const maxValue = new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
const calendarStart = computed(
  () => new CalendarDate(props.defaultYear ?? today.getFullYear(), props.defaultYear ? 1 : today.getMonth() + 1, 1),
)

function fromIso(iso: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "")
  return match ? new CalendarDate(Number(match[1]), Number(match[2]), Number(match[3])) : null
}

function toIso(value: DateValue | null | undefined): string {
  if (!value) return ""
  return `${value.year}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`
}

function sameDate(a: CalendarDate | null, b: CalendarDate | null): boolean {
  return a === b || (!!a && !!b && a.year === b.year && a.month === b.month && a.day === b.day)
}

watch(
  () => props.modelValue,
  (value) => {
    const next = fromIso(value)
    if (!sameDate(next, model.value)) model.value = next
  },
)

watch(model, (value) => {
  const iso = toIso(value)
  if (iso !== props.modelValue) emit("update:model-value", iso)
})
</script>

<template>
  <div role="group" :aria-label="label || undefined">
    <UInputDate
      :id="id"
      v-model="model"
      :max-value="maxValue"
      size="lg"
      :class="['w-full', ariaInvalid ? 'ring-2 ring-error' : '']"
      :readonly="readonly"
      :disabled="disabled"
    >
      <template #trailing>
        <UPopover v-model:open="calendarOpen">
          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-lucide-calendar"
            :aria-label="t('common.chooseDate')"
          />
          <template #content>
            <UCalendar v-model="model" :default-value="calendarStart" class="p-2" />
          </template>
        </UPopover>
      </template>
    </UInputDate>
  </div>
</template>
