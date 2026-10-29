<script setup lang="ts">
/**
 * Step rail. Keyboard: it is a list of buttons (not links) because steps are
 * state inside one route; arrow keys move between them, Enter activates.
 */
import type { StepView } from "~/form/types"

const props = defineProps<{
  steps: StepView[]
  current: number
  disabled?: boolean
  /** Badges only after the user has attempted to move on — no wall of red on arrival. */
  showCounts?: boolean
}>()

const emit = defineEmits<{ select: [index: number] }>()

const { t } = useLocale()
const refs = ref<HTMLButtonElement[]>([])

function onKeydown(event: KeyboardEvent, index: number) {
  const rtl = document.documentElement.dir === "rtl"
  const forward = rtl ? "ArrowLeft" : "ArrowRight"
  const backward = rtl ? "ArrowRight" : "ArrowLeft"
  if (event.key === forward || event.key === "ArrowDown") {
    event.preventDefault()
    refs.value[(index + 1) % props.steps.length]?.focus()
  } else if (event.key === backward || event.key === "ArrowUp") {
    event.preventDefault()
    refs.value[(index - 1 + props.steps.length) % props.steps.length]?.focus()
  } else if (event.key === "Home") {
    event.preventDefault()
    refs.value[0]?.focus()
  } else if (event.key === "End") {
    event.preventDefault()
    refs.value[props.steps.length - 1]?.focus()
  }
}
</script>

<template>
  <nav :aria-label="t('nav.steps')" class="min-w-0">
    <ol class="flex gap-1.5 overflow-x-auto pb-1" role="list">
      <li v-for="(step, index) in props.steps" :key="step.id" class="shrink-0">
        <button
          :ref="(el) => { if (el) refs[index] = el as HTMLButtonElement }"
          type="button"
          :aria-current="index === props.current ? 'step' : undefined"
          :aria-disabled="step.status === 'skipped' || props.disabled || undefined"
          :title="t(step.titleKey)"
          class="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition disabled:opacity-50"
          :class="[
            index === props.current
              ? 'border-primary bg-primary text-inverted font-medium'
              : step.status === 'done'
                ? 'border-success/60 bg-success/10 text-highlighted'
                : step.status === 'skipped'
                  ? 'border-default bg-default text-muted line-through'
                  : 'border-default bg-default text-highlighted hover:bg-elevated',
          ]"
          :tabindex="index === props.current ? 0 : -1"
          @click="emit('select', index)"
          @keydown="onKeydown($event, index)"
        >
          <span class="sr-only">{{ t("common.step", { n: index + 1, total: props.steps.length }) }}:</span>
          <span aria-hidden="true" class="font-mono">{{ index + 1 }}</span>
          <span class="hidden sm:inline">{{ t(step.titleKey) }}</span>
          <span
            v-if="props.showCounts && step.issueCount"
            class="ms-1 rounded-full bg-error px-1.5 text-[10px] font-semibold text-white"
            :aria-label="t('meta.errorsInStep', { n: step.issueCount })"
          >
            {{ step.issueCount }}
          </span>
        </button>
      </li>
    </ol>
  </nav>
</template>
