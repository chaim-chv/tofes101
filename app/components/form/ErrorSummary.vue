<script setup lang="ts">
/**
 * Error summary: the thing screen-reader users need and sighted users benefit
 * from. Rendered above the step, focused on a failed "continue", with links that
 * move focus to the offending field.
 */
import type { Issue } from "~/form/types"
import type { MessageKey } from "~/locales"

const props = defineProps<{ issues: Issue[]; labels: Record<string, string> }>()
const { t } = useLocale()
const el = ref<HTMLElement | null>(null)

const errors = computed(() => props.issues.filter((i) => i.severity === "error"))

function focusField(fieldId: string) {
  const target = document.getElementById(`f-${fieldId}`) ?? document.getElementById(fieldId)
  target?.focus()
  target?.scrollIntoView({ behavior: "smooth", block: "center" })
}

defineExpose({
  focus: () => el.value?.focus(),
})
</script>

<template>
  <div
    v-if="errors.length"
    ref="el"
    tabindex="-1"
    role="alert"
    class="rounded-xl border border-error/40 bg-error/5 p-4"
  >
    <h2 class="flex items-center gap-2 text-sm font-semibold text-error">
      <UIcon name="i-lucide-circle-alert" class="size-4" />
      {{ t("meta.errorsInStep", { n: errors.length }) }}
    </h2>
    <ul class="mt-2 space-y-1 ps-5">
      <li v-for="issue in errors" :key="`${issue.field}-${issue.code}`" class="list-disc text-sm">
        <a
          href="#"
          class="text-error underline decoration-error/40 underline-offset-2 hover:decoration-error"
          @click.prevent="focusField(issue.field)"
        >
          {{ labels[issue.field] ?? issue.field }} — {{ t(issue.messageKey as MessageKey, issue.params) }}
        </a>
      </li>
    </ul>
  </div>
</template>
