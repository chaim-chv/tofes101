<script setup lang="ts">
/**
 * The single documents block: what the answers require, why, and whether it is
 * attached. It replaces the old split between a derived checklist and a separate
 * "attached documents" card, so a requirement and its file live on the same row.
 *
 * On the finish screen it sits before the declaration/signature; the print view
 * renders the same list in `readonly` mode (no previews, no buttons), keeping
 * screen and paper in the same order.
 */
import { createAttachmentStore, type AttachmentView } from "~/storage/files"
import {
  documentChecklist,
  documentStatus,
  documentsSummary,
  type DocumentRequirement,
} from "~/form/documents"
import type { FormState } from "~/form/types"

const props = defineProps<{
  state: FormState
  /** Print view: list only, no attachments, status or actions. */
  readonly?: boolean
}>()
const emit = defineEmits<{ attach: [] }>()
const { t } = useLocale()

const needs = computed(() => documentChecklist(props.state))

const files = ref<AttachmentView[]>([])
const loading = ref(!props.readonly)
/** Guards the async load if the user leaves the step while it is in flight. */
let disposed = false
/** Bytes stay out of the reactive tree; only the page count is display state. */
const sources = new Map<string, Uint8Array>()

onMounted(async () => {
  if (props.readonly) {
    loading.value = false
    return
  }
  const store = import.meta.client ? createAttachmentStore() : null
  if (!store) {
    loading.value = false
    return
  }

  try {
    const rows = await store.loadForPdf()
    if (disposed) return
    files.value = rows.map((row) => {
      sources.set(row.slot, row.bytes)
      const blob = new Blob([row.bytes as BlobPart], { type: row.type })
      return {
        slot: row.slot,
        name: row.name,
        type: row.type,
        size: row.size,
        url: URL.createObjectURL(blob),
        isPdf: row.type === "application/pdf",
        isImage: row.type === "image/png" || row.type === "image/jpeg" || row.type === "image/webp",
        pages: null,
      }
    })
  } catch (error) {
    console.warn("[documents] attachments could not be read", error)
  }

  loading.value = false
  await loadPageCounts()
})

onBeforeUnmount(() => {
  disposed = true
  for (const file of files.value) URL.revokeObjectURL(file.url)
  sources.clear()
})

/** Page counts come from pdf-lib lazily: they must not delay the list. */
async function loadPageCounts() {
  const pdfs = files.value.filter((file) => file.isPdf)
  if (!pdfs.length) return
  try {
    const { PDFDocument } = await import("pdf-lib")
    for (const file of pdfs) {
      const bytes = sources.get(file.slot)
      if (!bytes) continue
      try {
        const doc = await PDFDocument.load(bytes, { updateMetadata: false })
        file.pages = doc.getPageCount()
      } catch {
        // Encrypted or malformed scan: keep the viewer, skip the count.
        file.pages = null
      }
    }
  } catch (error) {
    console.warn("[documents] page count unavailable", error)
  }
}

const attachedSlots = computed(() => new Set(files.value.map((file) => file.slot)))
const statuses = computed(() => {
  const out = new Map<string, ReturnType<typeof documentStatus>>()
  for (const need of needs.value) out.set(need.id, documentStatus(need, attachedSlots.value))
  return out
})
const summary = computed(() => documentsSummary(needs.value, attachedSlots.value))
const summaryText = computed(() => {
  if (props.readonly) return ""
  const s = summary.value
  if (!s.uploadable) return ""
  if (s.needed === s.uploadable && s.missing === 0) return t("doc.summary.all")
  return t("doc.summary", { needed: s.needed, attached: s.attached })
})

/** Files that satisfy a requirement, in slot order. */
function filesFor(need: DocumentRequirement): AttachmentView[] {
  if (!need.slots) return []
  return need.slots.ids
    .map((slot) => files.value.find((file) => file.slot === slot))
    .filter((file): file is AttachmentView => !!file)
}

/** Files the current answers do not ask for (e.g. left over after switching kind). */
const orphans = computed(() => {
  const claimed = new Set(needs.value.flatMap((need) => need.slots?.ids ?? []))
  return files.value.filter((file) => !claimed.has(file.slot))
})

function levelLabel(need: DocumentRequirement): string {
  if (need.level === "identity") return t("doc.required")
  if (need.level === "credit") return t("doc.level.credit")
  return t("doc.level.coordination")
}

function levelClass(need: DocumentRequirement): string {
  return need.level === "identity"
    ? "bg-error text-white"
    : "border border-default bg-default text-highlighted"
}

function statusLabel(need: DocumentRequirement): string {
  const status = statuses.value.get(need.id)
  if (status === "attached") return t("doc.status.attached")
  if (status === "partial") return t("doc.status.partial")
  if (status === "handover") return t("doc.status.handover")
  return t("doc.status.missing")
}

function statusClass(need: DocumentRequirement): string {
  const status = statuses.value.get(need.id)
  if (status === "attached") return "bg-green-800 text-white"
  if (status === "handover") return "border border-default bg-default text-highlighted"
  return need.level === "identity" ? "bg-error text-white" : "bg-amber-100 text-amber-900"
}
</script>

<template>
  <section aria-labelledby="docs-title">
    <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <h2 id="docs-title" class="flex items-center gap-2 text-sm font-semibold text-highlighted">
        <UIcon name="i-lucide-paperclip" class="size-4 text-primary" />
        {{ t("doc.title") }}
      </h2>
      <p v-if="!props.readonly && !loading && summaryText" class="text-xs text-muted">{{ summaryText }}</p>
    </div>

    <p v-if="loading" class="mt-2 text-sm text-muted">{{ t("common.loading") }}</p>

    <template v-else>
      <p v-if="!needs.length" class="mt-2 text-sm text-muted">{{ t("doc.none") }}</p>

      <ul v-else class="mt-3 space-y-2">
        <li v-for="need in needs" :key="need.id" class="rounded-lg border border-default px-3 py-2">
          <div class="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
            <div class="flex min-w-0 items-start gap-2">
              <span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold" :class="levelClass(need)">
                {{ levelLabel(need) }}
              </span>
              <div class="min-w-0">
                <p class="text-sm text-highlighted">{{ t(need.labelKey) }}</p>
                <p class="mt-0.5 text-xs text-muted">{{ t("doc.because", { reason: t(need.becauseKey) }) }}</p>
                <p v-if="need.noteKey" class="mt-0.5 text-xs text-muted">{{ t(need.noteKey) }}</p>
              </div>
            </div>

            <div v-if="!props.readonly" class="flex shrink-0 flex-wrap items-center gap-2">
              <span
                class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                :class="statusClass(need)"
              >
                <UIcon
                  v-if="statuses.get(need.id) === 'attached'"
                  name="i-lucide-check"
                  class="size-3.5"
                />
                {{ statusLabel(need) }}
              </span>
              <UButton
                v-if="need.slots"
                size="xs"
                variant="outline"
                color="neutral"
                icon="i-lucide-camera"
                @click="emit('attach')"
              >
                {{ statuses.get(need.id) === "attached" ? t("doc.replace") : t("doc.attach") }}
              </UButton>
            </div>
          </div>

          <div v-if="!props.readonly && filesFor(need).length" class="mt-2 space-y-2">
            <DocumentPreview
              v-for="file in filesFor(need)"
              :key="file.slot"
              :file="file"
              :label="t(need.labelKey)"
            />
          </div>
        </li>
      </ul>

      <template v-if="!props.readonly && orphans.length">
        <h3 class="mt-4 text-xs font-semibold text-highlighted">{{ t("doc.orphan.title") }}</h3>
        <div class="mt-2 space-y-2">
          <DocumentPreview
            v-for="file in orphans"
            :key="file.slot"
            :file="file"
            :label="t('doc.orphan.title')"
          />
        </div>
      </template>
    </template>
  </section>
</template>
