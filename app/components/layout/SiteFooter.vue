<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui"

const { t } = useLocale()
const { path } = useAppPath()

const items = computed<NavigationMenuItem[]>(() => [
  { label: t("nav.accessibility"), to: path("/accessibility/") },
  { label: t("nav.privacy"), to: path("/privacy/") },
])
</script>

<template>
  <UFooter>
    <template #left>
      <p class="text-sm text-muted">{{ t("app.footer") }}</p>
    </template>

    <UNavigationMenu :items="items" variant="link" />

    <template #right>
      <p class="text-xs text-muted">{{ t("app.year") }}</p>
    </template>
  </UFooter>
</template>
