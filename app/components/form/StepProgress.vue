<script setup lang="ts">
/**
 * Step rail. Keyboard: it is a list of buttons (not links) because steps are
 * state inside one route; arrow keys move between them, Enter activates.
 *
 * Selection is by step **id**, never by array index: a skipped step removes an
 * entry from the visible list, so schema indexes and visible indexes diverge.
 */
import type { StepView } from "~/form/types"

const props = defineProps<{
  steps: StepView[]
  currentId?: string
  /** Badges only after the user has attempted to move on — no wall of red on arrival. */
  showCounts?: boolean
}>()

const emit = defineEmits<{ select: [id: string] }>()

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

function select(step: StepView) {
  if (step.status === "skipped") return
  emit("select", step.id)
}
</script>

<template>
  <nav :aria-label="t('nav.steps')" class="min-w-0">
    <ol class="flex flex-wrap gap-1.5 pb-1" role="list">
      <li v-for="(step, index) in props.steps" :key="step.id" class="shrink-0">
        <button
          :ref="(el) => { if (el) refs[index] = el as HTMLButtonElement }"
          type="button"
          :aria-current="step.id === props.currentId ? 'step' : undefined"
          :aria-disabled="step.status === 'skipped' || undefined"
          :title="t(step.titleKey)"
          :disabled="step.status === 'skipped'"
          class="flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-50"
          :class="[
            step.id === props.currentId
              ? 'border-primary bg-primary font-medium text-inverted'
              : step.status === 'done'
                ? 'border-success/60 bg-success/10 text-highlighted'
                : step.status === 'skipped'
                  ? 'border-default bg-default text-muted line-through'
                  : 'border-default bg-default text-highlighted hover:bg-elevated',
          ]"
          :tabindex="step.id === props.currentId ? 0 : -1"
          @click="select(step)"
          @keydown="onKeydown($event, index)"
        >
          <span class="sr-only">{{ t("common.step", { n: step.visibleIndex + 1, total: props.steps.filter((s) => s.status !== 'skipped').length }) }}:</span>
          <span aria-hidden="true" class="font-mono">{{ step.visibleIndex >= 0 ? step.visibleIndex + 1 : "–" }}</span>
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
