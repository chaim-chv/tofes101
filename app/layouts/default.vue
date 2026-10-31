<script setup lang="ts">
const { t } = useLocale()
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-elevated/30">
    <a
      href="#main"
      class="sr-only z-[100] rounded-md bg-default px-3 py-2 text-sm font-medium text-highlighted shadow focus:not-sr-only focus:absolute focus:start-3 focus:top-3"
    >
      {{ t("common.skipToContent") }}
    </a>
    <SiteHeader />
    <main id="main" class="flex-1">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
