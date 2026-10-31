<script setup lang="ts">
/**
 * Persistent, calm save indicator. The old line under the step rail was easy to
 * miss and disappeared as soon as the user moved; this lives in the header.
 */
const { t, locale } = useLocale()
const form = useFormStore()

const time = computed(() => {
  const iso = form.lastSavedAt.value
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat(locale.value === "he" ? "he-IL" : "en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso))
  } catch {
    return null
  }
})

const label = computed(() => {
  if (form.saving.value) return t("common.saving")
  if (time.value) return t("save.savedAt", { time: time.value })
  return t("save.local")
})
</script>

<template>
  <UTooltip :text="t('save.local')">
    <span class="inline-flex items-center gap-1.5 text-xs text-muted" aria-live="polite">
      <UIcon
        :name="form.saving.value ? 'i-lucide-refresh-cw' : 'i-lucide-check-circle-2'"
        class="size-3.5"
        :class="form.saving.value ? 'animate-spin text-primary' : 'text-success'"
      />
      <span class="hidden sm:inline">{{ label }}</span>
      <span class="sr-only sm:hidden">{{ label }}</span>
    </span>
  </UTooltip>
</template>
