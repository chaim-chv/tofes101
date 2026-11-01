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
    class="actionbar fixed inset-x-0 bottom-0 z-30 border-t border-default bg-default/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:static lg:mx-0 lg:mt-5 lg:border-0 lg:bg-transparent lg:p-0"
  >
    <div class="flex items-center justify-between gap-3">
      <UButton
        variant="ghost"
        color="neutral"
        size="lg"
        icon="i-lucide-arrow-right"
        class="min-h-[52px]"
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
          size="lg"
          icon="i-lucide-printer"
          class="min-h-[52px]"
        >
          {{ t("common.print") }}
        </UButton>
      </div>
    </div>
  </div>
</template>
