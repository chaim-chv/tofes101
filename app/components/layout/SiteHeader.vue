<script setup lang="ts">
/**
 * The one site header. `wizard` is the compact variant used inside the form:
 * no nav (no accidental exit), but save state and draft actions stay available.
 */
import type { NavigationMenuItem } from "@nuxt/ui"

const props = defineProps<{ wizard?: boolean }>()

const { t, locale, toggle } = useLocale()
const { path } = useAppPath()
const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: t("nav.form"),
    to: path("/form/"),
    active: route.path.includes("/form"),
  },
  {
    label: t("nav.employer"),
    to: path("/employer/"),
    active: route.path.includes("/employer"),
  },
])
</script>

<template>
  <UHeader :toggle="props.wizard ? false : undefined" :title="t('app.name')" :to="path('/')">
    <template #title>
      <UIcon name="i-lucide-file-text" class="size-5 text-primary" />
      <span>{{ t("app.name") }}</span>
    </template>

    <UNavigationMenu v-if="!props.wizard" :items="items" />

    <template #right>
      <SaveStatus v-if="props.wizard" class="me-1" />
      <UTooltip :text="t('nav.language')">
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
      </UTooltip>
      <DraftMenu v-if="props.wizard" />
    </template>

    <template v-if="!props.wizard" #content>
      <UNavigationMenu :items="items" orientation="vertical" />
    </template>
  </UHeader>
</template>
