<script setup lang="ts">
/**
 * Attachment step: ID + annex, or passport + residence permit, depending on how
 * the employee identified themselves. Files live in IndexedDB (never in the
 * JSON draft), are previewed here, and are appended to the generated PDF.
 */
import { createAttachmentStore, validateFile, type Attachment, type SlotId } from "~/storage/files"
import type { MessageKey } from "~/locales"

const props = defineProps<{ idKind: "idNum" | "passport" | undefined }>()

const { t } = useLocale()
const store = import.meta.client ? createAttachmentStore() : null

type Slot = { id: SlotId; labelKey: MessageKey; helpKey?: MessageKey; recommended?: boolean }

const slots = computed<Slot[]>(() =>
  props.idKind === "passport"
    ? [
        { id: "passport", labelKey: "upload.passport", helpKey: "upload.passport.help", recommended: true },
        { id: "residence", labelKey: "upload.residence", helpKey: "upload.residence.help", recommended: true },
      ]
    : [
        { id: "id-front", labelKey: "upload.idFront", helpKey: "upload.idFront.help", recommended: true },
        { id: "id-annex", labelKey: "upload.idAnnex", helpKey: "upload.idAnnex.help", recommended: true },
      ],
)

const files = ref<Attachment[]>([])
const previews = ref<Record<string, string>>({})
const busy = ref<SlotId | null>(null)
const problem = ref<"size" | "type" | null>(null)

async function refresh() {
  if (!store) return
  files.value = await store.list()

  for (const [slot, url] of Object.entries(previews.value)) {
    if (!files.value.some((f) => f.slot === slot)) {
      URL.revokeObjectURL(url)
      delete previews.value[slot]
    }
  }

  const withBytes = await store.loadForPdf()
  for (const row of withBytes) {
    if (previews.value[row.slot] || !row.type.startsWith("image/")) continue
    const blob = new Blob([row.bytes as BlobPart], { type: row.type })
    previews.value[row.slot] = URL.createObjectURL(blob)
  }
}

onMounted(refresh)
onBeforeUnmount(() => {
  for (const url of Object.values(previews.value)) URL.revokeObjectURL(url)
})

function fileFor(slot: SlotId) {
  return files.value.find((f) => f.slot === slot)
}

async function onPick(slot: SlotId, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ""
  if (!file || !store) return
  const invalid = validateFile(file)
  if (invalid) {
    problem.value = invalid as "size" | "type"
    return
  }
  problem.value = null
  busy.value = slot
  try {
    await store.add(slot, file)
    await refresh()
  } finally {
    busy.value = null
  }
}

async function onRemove(slot: SlotId) {
  if (!store) return
  await store.remove(slot)
  await refresh()
}

function humanSize(bytes: number): string {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}

const problemMessage = computed(() =>
  problem.value === "size" ? t("upload.tooBig") : problem.value === "type" ? t("upload.badType") : null,
)
</script>

<template>
  <section class="mt-6" aria-labelledby="upload-title">
    <h2 id="upload-title" class="text-sm font-semibold text-highlighted">{{ t("upload.title") }}</h2>
    <p class="mt-1 text-sm text-muted">{{ t("upload.intro") }}</p>

    <UAlert
      v-if="problemMessage"
      class="mt-3 [&_[data-slot=description]]:!text-highlighted [&_[data-slot=description]]:!opacity-100"
      color="error"
      variant="subtle"
      :description="problemMessage"
    />

    <ul class="mt-4 grid gap-3 sm:grid-cols-2">
      <li v-for="slot in slots" :key="slot.id" class="min-w-0 rounded-xl border border-default p-3">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="text-sm font-medium text-highlighted">
              {{ t(slot.labelKey) }}
            </p>
            <UBadge v-if="slot.recommended" size="sm" color="neutral" variant="subtle" class="mt-1">
              {{ t("upload.recommended") }}
            </UBadge>
            <p v-if="slot.helpKey" class="mt-0.5 text-xs text-muted">{{ t(slot.helpKey) }}</p>
          </div>
          <span
            v-if="fileFor(slot.id)"
            class="shrink-0 rounded-full bg-green-800 px-2 py-0.5 text-xs font-medium text-white"
          >
            {{ t("upload.attached") }}
          </span>
        </div>

        <div v-if="fileFor(slot.id)" class="mt-3">
          <img
            v-if="previews[slot.id]"
            :src="previews[slot.id]"
            :alt="t(slot.labelKey)"
            class="max-h-40 w-full rounded-lg border border-default object-contain"
          />
          <p v-else class="rounded-lg border border-default px-3 py-6 text-center text-xs text-muted">
            {{ fileFor(slot.id)!.name }}
          </p>
          <div class="mt-2 flex items-center justify-between gap-2 text-xs text-muted">
            <span class="truncate" dir="ltr">
              {{ fileFor(slot.id)!.name }} · {{ humanSize(fileFor(slot.id)!.size) }}
            </span>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-red-700 hover:bg-red-50"
              @click="onRemove(slot.id)"
            >
              <UIcon name="i-lucide-trash-2" class="size-3.5" />
              {{ t("common.remove") }}
            </button>
          </div>
        </div>

        <div class="mt-3">
          <label
            class="inline-flex cursor-pointer items-center gap-2 rounded-md border border-default px-3 py-1.5 text-sm text-highlighted hover:bg-elevated"
            :class="busy === slot.id ? 'opacity-60' : ''"
          >
            <UIcon name="i-lucide-camera" class="size-4" />
            {{ fileFor(slot.id) ? t("upload.replace") : t("upload.choose") }}
            <input
              type="file"
              class="sr-only"
              :aria-label="t(slot.labelKey)"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              :disabled="busy === slot.id"
              @change="onPick(slot.id, $event)"
            />
          </label>
        </div>
      </li>
    </ul>

    <p class="mt-3 text-xs text-muted">{{ t("upload.privacy") }}</p>
  </section>
</template>
