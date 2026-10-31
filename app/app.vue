<script setup lang="ts">
// Root shell. `UApp` provides toasts, tooltips, overlays and the locale/dir
// plumbing used by Nuxt UI's own components (date pickers, file upload, …).
import { he as uiHe, en as uiEn } from "@nuxt/ui/locale"

const { locale } = useLocale()
const { asset } = useAppPath()

const uiLocale = computed(() => (locale.value === "he" ? uiHe : uiEn))

const fontUrl = asset("/fonts/Heebo-Variable.ttf")

useHead({
  link: [
    { rel: "icon", type: "image/svg+xml", href: asset("/favicon.svg") },
    // Self-hosted, same-origin: no Google Fonts, no runtime network request.
    { rel: "preload", as: "font", type: "font/ttf", href: fontUrl, crossorigin: "anonymous" },
  ],
  style: [
    {
      innerHTML: `@font-face{font-family:Heebo;src:url('${fontUrl}') format('truetype');font-weight:100 900;font-style:normal;font-display:swap}`,
    },
  ],
  htmlAttrs: {
    lang: () => (locale.value === "he" ? "he" : "en"),
    dir: () => (locale.value === "he" ? "rtl" : "ltr"),
  },
})
</script>

<template>
  <UApp :locale="uiLocale">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
