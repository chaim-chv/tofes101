<script setup lang="ts">
/**
 * Repeating rows (children, other employers). One implementation for every
 * repeater: rows are `<fieldset>`s with a real legend, deletion moves focus to
 * the next sensible target, and additions are announced.
 */
import type { FieldDef, Issue, RepeatItem } from "~/form/types"

const props = defineProps<{
  field: FieldDef
  items: RepeatItem[]
  issuesByField: (id: string) => Issue[]
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
}

const canAdd = computed(() => !props.field.maxItems || props.items.length < props.field.maxItems)
</script>

<template>
  <div class="min-w-0">
    <div class="mb-3 flex items-baseline justify-between gap-3">
      <h3 class="text-sm font-medium text-highlighted">
        {{ props.field.labelKey ? t(props.field.labelKey) : "" }}
      </h3>
      <span v-if="props.field.helpKey" class="text-xs text-muted">{{ t(props.field.helpKey) }}</span>
    </div>

    <ol v-if="items.length" class="space-y-4">
      <li v-for="(item, index) in items" :key="item._key">
        <fieldset class="rounded-xl border border-default bg-elevated/20 p-4">
          <legend class="px-1 text-xs font-medium text-muted">{{ rowTitle(index) }}</legend>
          <div class="grid gap-4 sm:grid-cols-2">
            <template v-for="child in props.field.fields" :key="child.id">
              <FormField
                :field="{ ...child, id: `${props.field.id}.${subId(child.id)}` }"
                :value="item[subId(child.id)]"
                :issues="issuesByField(`${props.field.id}.${subId(child.id)}`)"
                :disabled="props.disabled"
                @update:value="(v) => emit('update', item._key, subId(child.id), v)"
              />
            </template>
          </div>
          <div class="mt-3 flex justify-end">
            <UButton
              type="button"
              variant="ghost"
              color="error"
              size="sm"
              icon="i-lucide-trash-2"
              @click="onRemove(item._key, index)"
            >
              {{ t("common.remove") }}
            </UButton>
          </div>
        </fieldset>
      </li>
    </ol>

    <p v-else class="rounded-lg border border-dashed border-default px-4 py-6 text-center text-sm text-muted">
      {{ t("common.optionalHint") }}
    </p>

    <div class="mt-3">
      <UButton
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

    <p class="sr-only" aria-live="polite">{{ liveMessage }}</p>
  </div>
</template>
