<script setup lang="ts">
/**
 * Derived documents checklist. One source of truth: `app/form/documents.ts`.
 * Shown on the sign step and on the printed document — never typed by hand.
 */
import { documentChecklist } from "~/form/documents"
import type { FormState } from "~/form/types"

const props = defineProps<{ state: FormState; compact?: boolean }>()
const { t } = useLocale()

const items = computed(() => documentChecklist(props.state))
</script>

<template>
  <section :class="props.compact ? 'mt-6' : 'mt-8'" aria-labelledby="doc-title">
    <h2 id="doc-title" class="flex items-center gap-2 text-sm font-semibold text-highlighted">
      <UIcon name="i-lucide-paperclip" class="size-4 text-primary" />
      {{ t("doc.title") }}
    </h2>

    <p v-if="!items.length" class="mt-2 text-sm text-muted">{{ t("doc.none") }}</p>

    <ul v-else class="mt-3 space-y-2">
      <li
        v-for="item in items"
        :key="item.id"
        class="flex flex-wrap items-start gap-x-3 gap-y-1 rounded-lg border border-default px-3 py-2"
      >
        <span
          class="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
          :class="item.required ? 'bg-error text-white' : 'border border-default bg-default text-highlighted'"
        >
          {{ item.required ? t("doc.required") : t("doc.recommended") }}
        </span>
        <span class="min-w-0 flex-1 text-sm text-highlighted">{{ t(item.labelKey) }}</span>
        <span class="w-full text-xs text-muted sm:w-auto">
          {{ t("doc.because", { reason: t(item.becauseKey) }) }}
        </span>
      </li>
    </ul>
  </section>
</template>
