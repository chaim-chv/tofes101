<script setup lang="ts">
const { t, init } = useLocale()

onMounted(() => init())
useHead({ title: () => `${t("privacyPage.title")} — ${t("app.name")}` })
</script>

<template>
  <UContainer class="max-w-3xl py-8 sm:py-12">
    <UPageHeader
      :title="t('privacyPage.title')"
      :description="t('privacyPage.lead')"
      :ui="{ title: 'text-2xl sm:text-3xl' }"
    />

    <div class="mt-8 space-y-8">
      <section class="space-y-2">
        <h2 class="text-lg font-semibold text-highlighted">{{ t("privacyPage.local.title") }}</h2>
        <p class="text-sm leading-relaxed text-muted">{{ t("privacyPage.local.body") }}</p>
      </section>
      <section class="space-y-2">
        <h2 class="text-lg font-semibold text-highlighted">{{ t("privacyPage.files.title") }}</h2>
        <p class="text-sm leading-relaxed text-muted">{{ t("privacyPage.files.body") }}</p>
      </section>
      <section class="space-y-2">
        <h2 class="text-lg font-semibold text-highlighted">{{ t("privacyPage.server.title") }}</h2>
        <p class="text-sm leading-relaxed text-muted">{{ t("privacyPage.server.body") }}</p>
      </section>
      <section class="space-y-2">
        <h2 class="text-lg font-semibold text-highlighted">{{ t("privacyPage.delete.title") }}</h2>
        <p class="text-sm leading-relaxed text-muted">{{ t("privacyPage.delete.body") }}</p>
      </section>
      <section class="space-y-2">
        <h2 class="text-lg font-semibold text-highlighted">{{ t("privacyPage.host.title") }}</h2>
        <p class="text-sm leading-relaxed text-muted">{{ t("privacyPage.host.body") }}</p>
      </section>
    </div>

    <p class="mt-10 text-xs text-muted">{{ t("privacyPage.updated") }}</p>
  </UContainer>
</template>
