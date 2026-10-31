<script setup lang="ts">
/**
 * Review screen: every visible answer, grouped by step, each with an edit link
 * that jumps to the step. It renders exactly what the print view prints — no
 * second formatting path.
 */
import { formatDate, formatValue } from "~/form/format"
import type { FieldDef, FormSchema, FormState } from "~/form/types"
import { isVisible } from "~/form/engine"
import { repeatItems } from "~/form/values"

const props = defineProps<{
  schema: FormSchema
  state: FormState
  /** Print view: no edit affordances. */
  readonly?: boolean
}>()

const emit = defineEmits<{ edit: [stepId: string] }>()

const { t, locale } = useLocale()

type Row = { field: FieldDef; text: string }
type Group = { stepId: string; titleKey: FieldDef["labelKey"]; rows: Row[] }

const groups = computed<Group[]>(() => {
  const out: Group[] = []
  for (const step of props.schema.steps) {
    if (step.id === "finish") continue
    const rows: Row[] = []
    for (const field of step.fields) {
      if (field.kind === "static" || field.kind === "section") continue
      if (!isVisible(field, props.state)) continue
      const value = props.state.values[field.id]
      if (field.kind === "repeat") {
        const items = repeatItems(props.state, field.id)
        if (!items.length) continue
        for (const item of items) {
          const parts = (field.fields ?? [])
            .map((sub) => {
              const key = sub.id.slice(sub.id.lastIndexOf(".") + 1)
              const v = item[key]
              const text = formatValue(sub, v, locale.value, t)
              return text ? `${t(sub.labelKey ?? "common.unknown")}: ${text}` : ""
            })
            .filter(Boolean)
          rows.push({ field, text: parts.join(" · ") })
        }
        continue
      }
      const text = formatValue(field, value, locale.value, t)
      if (text) rows.push({ field, text })
    }
    if (rows.length) out.push({ stepId: step.id, titleKey: step.titleKey as FieldDef["labelKey"], rows })
  }
  return out
})

function label(field: FieldDef): string {
  return field.labelKey ? t(field.labelKey) : field.id
}
</script>

<template>
  <div class="space-y-6">
    <section v-for="group in groups" :key="group.stepId" class="rounded-xl border border-default bg-default">
      <header class="flex items-center justify-between gap-3 border-b border-default px-4 py-2.5">
        <h2 class="text-sm font-semibold text-highlighted">{{ group.titleKey ? t(group.titleKey) : group.stepId }}</h2>
        <UButton
          v-if="!props.readonly"
          variant="link"
          size="xs"
          color="primary"
          class="no-print"
          @click="emit('edit', group.stepId)"
        >
          {{ t("review.editStep") }}
        </UButton>
      </header>
      <dl class="divide-y divide-default">
        <div v-for="(row, i) in group.rows" :key="`${row.field.id}-${i}`" class="grid gap-1 px-4 py-2 sm:grid-cols-3">
          <dt class="text-xs text-muted">{{ label(row.field) }}</dt>
          <dd class="text-sm text-highlighted sm:col-span-2">{{ row.text }}</dd>
        </div>
      </dl>
    </section>

    <p v-if="!groups.length" class="text-sm text-muted">{{ t("review.empty") }}</p>

    <p class="text-xs text-muted">
      {{ t("step.review.intro") }}
    </p>
  </div>
</template>
