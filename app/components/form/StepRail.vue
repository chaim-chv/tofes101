<script setup lang="ts">
/**
 * Desktop step rail.
 *
 * We deliberately do not use `UStepper` here: its trigger contains only the
 * indicator while `aria-labelledby` points at the separate title, which fails
 * `label-content-name-mismatch` (the visible "1" is not in the accessible name).
 * A plain list of buttons gives us the whole-row click target, a correct
 * accessible name, and the same keyboard behavior.
 */
import type { StepView } from "~/form/types"

const props = defineProps<{
  steps: StepView[]
  currentId?: string
  showCounts?: boolean
}>()

const emit = defineEmits<{ select: [id: string] }>()
const { t } = useLocale()

const visible = computed(() => props.steps.filter((s) => s.status !== "skipped"))
const currentVisible = computed(() =>
  Math.max(1, visible.value.findIndex((s) => s.id === props.currentId) + 1),
)
const total = computed(() => visible.value.length)

function number(step: StepView) {
  return step.visibleIndex >= 0 ? step.visibleIndex + 1 : "–"
}
</script>

<template>
  <nav :aria-label="t('nav.steps')">
    <p class="mb-3 text-xs font-medium text-muted">
      {{ t("meta.stepOf", { n: currentVisible, total }) }}
    </p>
    <ol class="space-y-1" role="list">
      <li v-for="step in steps" :key="step.id">
        <button
          type="button"
          :aria-current="step.id === currentId ? 'step' : undefined"
          :disabled="step.status === 'skipped'"
          class="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 py-2 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          :class="
            step.id === currentId
              ? 'bg-primary/10 text-highlighted'
              : 'text-muted hover:bg-elevated/60 hover:text-highlighted'
          "
          @click="emit('select', step.id)"
        >
          <span
            class="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
            :class="
              step.id === currentId
                ? 'bg-primary text-inverted'
                : step.status === 'done'
                  ? 'bg-primary text-inverted'
                  : 'bg-elevated text-muted'
            "
            aria-hidden="true"
          >
            <UIcon v-if="step.status === 'done' && step.id !== currentId" name="i-lucide-check" class="size-4" />
            <template v-else>{{ number(step) }}</template>
          </span>
          <span class="min-w-0 flex-1 text-xs font-medium leading-snug">{{ t(step.titleKey) }}</span>
          <UBadge
            v-if="props.showCounts && step.issueCount"
            size="sm"
            color="error"
            variant="solid"
          >
            {{ step.issueCount }}
          </UBadge>
        </button>
      </li>
    </ol>
  </nav>
</template>
