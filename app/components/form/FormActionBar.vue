<script setup lang="ts">
/**
 * One action bar for every step. On mobile it is sticky at the bottom of the
 * viewport (52px primary, safe-area aware); on desktop it is a normal row.
 */
const props = defineProps<{
  isFirst?: boolean
  isLast?: boolean
  busy?: boolean
  printHref: string
}>()

const emit = defineEmits<{ back: []; next: []; download: [] }>()
const { t } = useLocale()
</script>

<template>
  <div
    class="actionbar sticky bottom-0 z-30 -mx-4 mt-6 border-t border-default bg-default/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mt-5 sm:border-0 sm:bg-transparent sm:p-0"
  >
    <div class="flex items-center justify-between gap-3">
      <UButton
        variant="ghost"
        color="neutral"
        icon="i-lucide-arrow-right"
        :disabled="props.isFirst"
        @click="emit('back')"
      >
        {{ t("common.back") }}
      </UButton>

      <div class="flex flex-1 items-center justify-end gap-2 sm:flex-none">
        <UButton
          v-if="props.isLast"
          :loading="props.busy"
          icon="i-lucide-file-down"
          size="lg"
          class="min-h-[52px] flex-1 sm:flex-none"
          @click="emit('download')"
        >
          {{ props.busy ? t("pdf.generating") : t("pdf.download") }}
        </UButton>
        <UButton
          v-else
          icon="i-lucide-arrow-left"
          size="lg"
          class="min-h-[52px] flex-1 sm:flex-none"
          @click="emit('next')"
        >
          {{ t("common.next") }}
        </UButton>

        <UButton
          v-if="props.isLast"
          :to="props.printHref"
          variant="outline"
          color="neutral"
          icon="i-lucide-printer"
        >
          {{ t("common.print") }}
        </UButton>
      </div>
    </div>
  </div>
</template>
