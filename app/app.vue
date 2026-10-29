<script setup lang="ts">
// Root shell. `UApp` provides toasts, tooltips, overlays and the locale/dir
// plumbing used by Nuxt UI's own components (date pickers, file upload, …).
import { he as uiHe, en as uiEn } from "@nuxt/ui/locale"

const { locale } = useLocale()
const { asset } = useAppPath()

const uiLocale = computed(() => (locale.value === "he" ? uiHe : uiEn))

useHead({
  link: [{ rel: "icon", type: "image/svg+xml", href: asset("/favicon.svg") }],
  htmlAttrs: {
    lang: () => (locale.value === "he" ? "he" : "en"),
    dir: () => (locale.value === "he" ? "rtl" : "ltr"),
  },
})
</script>

<template>
  <UApp :locale="uiLocale">
    <NuxtPage />
  </UApp>
</template>
