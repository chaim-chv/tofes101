<script setup lang="ts">
import { he } from '@nuxt/ui/locale'
</script>

<template>
  <UApp :locale="he">
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </UApp>
</template>
