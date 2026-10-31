<script setup lang="ts">
const { t, init } = useLocale()

onMounted(() => init())
useHead({ title: () => `${t("a11y.title")} — ${t("app.name")}` })

const adjustments = computed(() => [
  t("a11y.what.1"),
  t("a11y.what.2"),
  t("a11y.what.3"),
  t("a11y.what.4"),
  t("a11y.what.5"),
])
</script>

<template>
  <UContainer class="max-w-3xl py-8 sm:py-12">
    <UPageHeader :title="t('a11y.title')" :description="t('a11y.lead')" :ui="{ title: 'text-2xl sm:text-3xl' }" />

    <section class="mt-8 space-y-2">
      <h2 class="text-lg font-semibold text-highlighted">{{ t("a11y.level.title") }}</h2>
      <p class="text-sm leading-relaxed text-muted">{{ t("a11y.level.body") }}</p>
    </section>

    <section class="mt-8">
      <h2 class="text-lg font-semibold text-highlighted">{{ t("a11y.what.title") }}</h2>
      <ul class="mt-3 list-disc space-y-2 ps-5 text-sm leading-relaxed text-muted">
        <li v-for="item in adjustments" :key="item">{{ item }}</li>
      </ul>
    </section>

    <section class="mt-8 space-y-2">
      <h2 class="text-lg font-semibold text-highlighted">{{ t("a11y.limits.title") }}</h2>
      <p class="text-sm leading-relaxed text-muted">{{ t("a11y.limits.body") }}</p>
    </section>

    <section class="mt-8 space-y-2">
      <h2 class="text-lg font-semibold text-highlighted">{{ t("a11y.contact.title") }}</h2>
      <p class="text-sm leading-relaxed text-muted">{{ t("a11y.contact.body") }}</p>
      <UButton
        to="https://github.com/chaim-chv/tofes101/issues"
        target="_blank"
        rel="noopener"
        variant="outline"
        color="neutral"
        icon="i-lucide-link"
        class="mt-2"
      >
        {{ t("a11y.contact.action") }}
      </UButton>
    </section>

    <p class="mt-10 text-xs text-muted">{{ t("a11y.updated") }}</p>
  </UContainer>
</template>
