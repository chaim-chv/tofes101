<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui"

const { t } = useLocale()
const { path } = useAppPath()

// Public source repo. A plain footer link — the app itself makes no request to
// it, so the privacy gate stays green (github.com is allowlisted as a literal).
const SOURCE_URL = "https://github.com/chaim-chv/tofes101"

const items = computed<NavigationMenuItem[]>(() => [
  { label: t("nav.accessibility"), to: path("/accessibility/") },
  { label: t("nav.privacy"), to: path("/privacy/") },
  { label: t("nav.source"), to: SOURCE_URL, target: "_blank", rel: "noopener noreferrer" },
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
