<script setup lang="ts">
/**
 * One attached file: everything the finish screen needs to show it without
 * leaving the page. Images render inline; PDFs open in a scrollable viewer so
 * every page is visible (front, back and ספח often share one file).
 */
import type { AttachmentView } from "~/storage/files"

const props = defineProps<{ file: AttachmentView; label: string }>()
const { t } = useLocale()

function pageText(pages: number): string {
  return pages > 1 ? t("attach.view.allPages", { n: pages }) : t("attach.view.onePage")
}

function humanSize(bytes: number): string {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`
}
</script>

<template>
  <div class="rounded-lg border border-default p-2">
    <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
      <p class="min-w-0 truncate text-xs text-muted" dir="ltr">{{ props.file.name }} · {{ humanSize(props.file.size) }}</p>
      <div class="flex shrink-0 items-center gap-2">
        <UBadge v-if="props.file.isPdf && props.file.pages" size="sm" color="neutral" variant="subtle">
          {{ pageText(props.file.pages) }}
        </UBadge>
        <a
          :href="props.file.url"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium text-primary hover:bg-elevated"
        >
          <UIcon name="i-lucide-external-link" class="size-3.5" />
          {{ t("attach.view.open") }}
        </a>
      </div>
    </div>

    <img
      v-if="props.file.isImage"
      :src="props.file.url"
      :alt="`${props.label} — ${props.file.name}`"
      class="mt-2 max-h-80 w-full rounded border border-default bg-elevated/20 object-contain"
    />
    <iframe
      v-else-if="props.file.isPdf"
      :src="props.file.url"
      :title="t('attach.view.preview', { name: props.file.name })"
      class="mt-2 h-72 w-full rounded border border-default bg-elevated/20"
    ></iframe>
    <p v-else class="mt-2 rounded border border-default px-3 py-4 text-center text-xs text-muted">
      {{ t("attach.view.unsupported") }}
    </p>
  </div>
</template>
