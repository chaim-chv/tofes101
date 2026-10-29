<script setup lang="ts">
/** Shared shell: brand, nav, language switch. */
const { t, locale, toggle } = useLocale()
const { path } = useAppPath()

defineProps<{ compact?: boolean }>()
</script>

<template>
  <header class="border-b border-default bg-default/95 backdrop-blur">
    <div class="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
      <NuxtLink :to="path('/')" class="flex items-center gap-2 font-semibold text-highlighted">
        <UIcon name="i-lucide-file-text" class="size-5 text-primary" />
        <span>{{ t("app.name") }}</span>
      </NuxtLink>

      <nav v-if="!compact" class="flex items-center gap-2" :aria-label="t('nav.main')">
        <NuxtLink :to="path('/form/')" class="text-sm text-muted hover:text-highlighted">
          {{ t("nav.form") }}
        </NuxtLink>
        <NuxtLink :to="path('/employer/')" class="text-sm text-muted hover:text-highlighted">
          {{ t("nav.employer") }}
        </NuxtLink>
      </nav>

      <UButton
        variant="ghost"
        color="neutral"
        size="sm"
        icon="i-lucide-languages"
        :aria-label="t('nav.language')"
        @click="toggle()"
      >
        <span class="sr-only sm:not-sr-only">{{ locale === "he" ? "English" : "עברית" }}</span>
      </UButton>
    </div>
  </header>
</template>
