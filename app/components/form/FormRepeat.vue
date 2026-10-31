<script setup lang="ts">
/**
 * Repeating rows (children, other employers). One implementation for every
 * repeater: each row is a named group, deletion returns focus to the add
 * button, and additions are announced.
 */
import type { FieldDef, Issue, RepeatItem } from "~/form/types"
import { TAX_YEAR } from "~/form/values"
import { ageAt, parseDate } from "~/form/validators"

const props = defineProps<{
  field: FieldDef
  items: RepeatItem[]
  issuesByField: (id: string) => Issue[]
  /** Container-level issues (e.g. "add at least one row"). */
  issues?: Issue[]
  required?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  add: []
  remove: [key: string]
  update: [key: string, subId: string, value: unknown]
}>()

const { t } = useLocale()
const liveMessage = ref("")

function rowTitle(index: number) {
  return props.field.rowTitleKey ? t(props.field.rowTitleKey, { n: index + 1 }) : `${index + 1}`
}

function ageFor(item: RepeatItem): string {
  if (props.field.id !== "children") return ""
  const birth = parseDate(item["birthDate"])
  if (!birth) return ""
  const age = ageAt(birth, new Date(Date.UTC(TAX_YEAR, 11, 31)))
  if (age === null) return ""
  return age === 0 ? t("f.children.age.born") : t("f.children.age", { age })
}

function subId(id: string) {
  // child fields are declared as "children.name"; the value lives under "name"
  return id.includes(".") ? id.slice(id.lastIndexOf(".") + 1) : id
}

function onAdd() {
  emit("add")
  liveMessage.value = t("common.add")
  // Focus the first input of the row that was just created (never the button,
  // so the keyboard user lands exactly where they need to type).
  nextTick(() => {
    const inputs = document.querySelectorAll<HTMLInputElement>(`[id^="f-${props.field.id}."]`)
    inputs[inputs.length - (props.field.fields?.length ?? 1)]?.focus()
  })
}

function onRemove(key: string, index: number) {
  emit("remove", key)
  liveMessage.value = t("common.remove")
  void index
  nextTick(() => document.getElementById(`add-${props.field.id}`)?.focus())
}

const canAdd = computed(() => !props.field.maxItems || props.items.length < props.field.maxItems)
const containerErrors = computed(() => (props.issues ?? []).filter((i) => i.severity === "error"))
</script>

<template>
  <div :id="`f-${props.field.id}`" tabindex="-1" class="min-w-0 focus:outline-none">
    <div class="mb-3 flex items-baseline justify-between gap-3">
      <h3 class="text-sm font-medium text-highlighted">
        {{ props.field.labelKey ? t(props.field.labelKey) : "" }}
        <span v-if="props.required" class="text-error" aria-hidden="true">*</span>
        <span v-if="props.required" class="sr-only">({{ t("common.required") }})</span>
      </h3>
      <span v-if="props.field.helpKey" class="text-xs text-muted">{{ t(props.field.helpKey) }}</span>
    </div>

    <ol v-if="items.length" class="space-y-4">
      <li v-for="(item, index) in items" :key="item._key">
        <div role="group" :aria-label="rowTitle(index)">
          <UCard :ui="{ root: 'bg-elevated/10', header: 'p-3 sm:px-4', body: 'p-4 sm:p-5' }">
            <template #header>
              <div class="flex items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs font-medium text-muted">{{ rowTitle(index) }}</span>
                  <UBadge v-if="ageFor(item)" size="sm" color="neutral" variant="subtle">
                    {{ ageFor(item) }}
                  </UBadge>
                </div>
                <UButton
                  type="button"
                  variant="ghost"
                  color="error"
                  size="xs"
                  icon="i-lucide-trash-2"
                  @click="onRemove(item._key, index)"
                >
                  {{ t("common.remove") }}
                </UButton>
              </div>
            </template>

            <div class="grid gap-4 sm:grid-cols-2">
              <template v-for="child in props.field.fields" :key="child.id">
                <FormField
                  :field="{ ...child, id: `${props.field.id}.${subId(child.id)}` }"
                  :value="item[subId(child.id)]"
                  :issues="issuesByField(`${props.field.id}.${subId(child.id)}`)"
                  :required="child.required === true"
                  :id-suffix="item._key"
                  :disabled="props.disabled"
                  @update:value="(v) => emit('update', item._key, subId(child.id), v)"
                />
              </template>
            </div>
          </UCard>
        </div>
      </li>
    </ol>

    <UEmpty
      v-else
      icon="i-lucide-file-text"
      :title="props.required ? t('common.addAtLeastOne') : t('common.optionalHint')"
      :description="props.field.helpKey ? t(props.field.helpKey) : undefined"
      class="rounded-xl border border-dashed border-default py-6"
    />

    <div class="mt-3">
      <UButton
        :id="`add-${props.field.id}`"
        type="button"
        variant="outline"
        color="neutral"
        icon="i-lucide-plus"
        :disabled="props.disabled || !canAdd"
        @click="onAdd"
      >
        {{ props.field.addKey ? t(props.field.addKey) : t("common.add") }}
      </UButton>
    </div>

    <p
      v-for="(issue, issueIndex) in containerErrors"
      :id="`err-${props.field.id}`"
      :key="`${issue.code}-${issueIndex}`"
      class="mt-2 flex items-center gap-1 text-sm text-error"
    >
      <UIcon name="i-lucide-circle-alert" class="size-4 shrink-0" />
      {{ t(issue.messageKey, issue.params) }}
    </p>

    <p class="sr-only" aria-live="polite">{{ liveMessage }}</p>
  </div>
</template>
