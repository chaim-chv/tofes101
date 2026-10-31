<script setup lang="ts">
/**
 * Mobile progress header: one line of text, a thin bar, and a button that opens
 * the full step list in a slideover. The old horizontally scrolling chips hid
 * the step names and clipped the last steps.
 */
import type { StepView } from "~/form/types"

const props = defineProps<{
  steps: StepView[]
  currentId?: string
}>()

const emit = defineEmits<{ select: [id: string] }>()
const { t } = useLocale()
const open = ref(false)

const visible = computed(() => props.steps.filter((s) => s.status !== "skipped"))
const currentIndex = computed(() => Math.max(0, visible.value.findIndex((s) => s.id === props.currentId)))
const current = computed(() => visible.value[currentIndex.value])
const total = computed(() => visible.value.length)

function choose(id: string) {
  open.value = false
  emit("select", id)
}
</script>

<template>
  <div class="lg:hidden">
    <div class="flex items-center justify-between gap-3">
      <div class="min-w-0">
        <p class="text-xs font-medium text-muted">
          {{ t("meta.stepOf", { n: currentIndex + 1, total }) }}
        </p>
        <p class="truncate text-sm font-semibold text-highlighted">
          {{ current ? t(current.titleKey) : "" }}
        </p>
      </div>
      <UButton variant="outline" color="neutral" size="sm" @click="open = true">
        {{ t("nav.steps") }}
      </UButton>
    </div>
    <UProgress class="mt-2" :model-value="currentIndex + 1" :max="total" size="xs" />
  </div>

  <USlideover v-model:open="open" :title="t('nav.steps')">
    <template #body>
      <StepRail :steps="steps" :current-id="currentId" @select="choose" />
    </template>
  </USlideover>
</template>
