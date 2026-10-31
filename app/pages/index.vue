<script setup lang="ts">
import type { ButtonProps } from "@nuxt/ui"

const { t, locale, init } = useLocale()
const { path } = useAppPath()
const { summary, clearDraft } = useDraftSummary()
const toast = useToast()

onMounted(() => init())
useHead({ title: () => `${t("app.name")} — ${t("app.tagline")}` })

const links = computed<ButtonProps[]>(() => [
  {
    label: summary.value ? t("home.cta.continue") : t("home.cta.start"),
    to: summary.value ? path(`/form/?step=${summary.value.stepIndex}`) : path("/form/"),
    icon: "i-lucide-arrow-left",
    size: "lg",
  },
  {
    label: t("home.cta.employer"),
    to: path("/employer/"),
    color: "neutral",
    variant: "outline",
    size: "lg",
  },
])

const need = computed(() => [
  { icon: "i-lucide-user", title: t("home.need.id.title"), description: t("home.need.id.body") },
  { icon: "i-lucide-file-text", title: t("home.need.employer.title"), description: t("home.need.employer.body") },
  { icon: "i-lucide-user", title: t("home.need.family.title"), description: t("home.need.family.body") },
  { icon: "i-lucide-paperclip", title: t("home.need.docs.title"), description: t("home.need.docs.body") },
])

const points = computed(() => [
  { icon: "i-lucide-shield-check", title: t("home.point.local.title"), description: t("home.point.local.body") },
  { icon: "i-lucide-keyboard", title: t("home.point.fast.title"), description: t("home.point.fast.body") },
  { icon: "i-lucide-book-open", title: t("home.point.right.title"), description: t("home.point.right.body") },
])

const savedAt = computed(() => {
  const iso = summary.value?.savedAt
  if (!iso) return ""
  try {
    return new Intl.DateTimeFormat(locale.value === "he" ? "he-IL" : "en-GB", { dateStyle: "short" }).format(new Date(iso))
  } catch {
    return ""
  }
})

const resetOpen = ref(false)

async function resetDraft() {
  await clearDraft()
  resetOpen.value = false
  toast.add({ title: t("home.draft.cleared"), color: "success", icon: "i-lucide-trash-2" })
}
</script>

<template>
  <div>
    <UPageHero
      :title="t('home.h1')"
      :description="t('home.lead')"
      :links="links"
      :ui="{
        container: 'py-10 sm:py-16 lg:py-20 gap-8',
        title: 'text-3xl sm:text-5xl text-pretty tracking-tight font-bold text-highlighted',
        description: 'text-lg text-muted max-w-2xl',
        links: 'mt-2',
      }"
    >
      <template #headline>
        <UBadge color="success" variant="subtle" icon="i-lucide-lock" class="text-green-900">
          {{ t("privacy.badge") }}
        </UBadge>
      </template>
    </UPageHero>

    <ClientOnly>
      <div v-if="summary" class="mx-auto -mt-2 mb-8 w-full max-w-3xl px-4">
        <UPageCard
          variant="subtle"
          icon="i-lucide-refresh-cw"
          :title="t('home.draft.title')"
          :description="t('home.draft.body', { date: savedAt, step: summary.stepNumber, total: summary.total, title: t(summary.titleKey) })"
        >
          <template #footer>
            <div class="flex flex-wrap gap-2">
              <UButton :to="path(`/form/?step=${summary.stepIndex}`)" icon="i-lucide-arrow-left">
                {{ t("home.cta.continue") }}
              </UButton>
              <UButton variant="ghost" color="neutral" icon="i-lucide-trash-2" @click="resetOpen = true">
                {{ t("home.draft.reset") }}
              </UButton>
            </div>
          </template>
        </UPageCard>
      </div>
    </ClientOnly>

    <UPageSection
      :title="t('home.need.title')"
      :description="t('home.need.lead')"
      :ui="{ container: 'py-8 sm:py-10 lg:py-12', title: 'text-2xl sm:text-3xl' }"
    >
      <UPageGrid class="sm:grid-cols-2 lg:grid-cols-2">
        <UPageCard
          v-for="item in need"
          :key="item.title"
          :icon="item.icon"
          :title="item.title"
          :description="item.description"
          variant="subtle"
        />
      </UPageGrid>
    </UPageSection>

    <UPageSection
      :title="t('home.why.title')"
      :ui="{ container: 'py-8 sm:py-10 lg:py-12', title: 'text-2xl sm:text-3xl' }"
    >
      <UPageGrid>
        <UPageCard
          v-for="item in points"
          :key="item.title"
          :icon="item.icon"
          :title="item.title"
          :description="item.description"
        />
      </UPageGrid>
    </UPageSection>

    <UModal v-model:open="resetOpen" :title="t('home.draft.confirmTitle')" :description="t('home.draft.confirmBody')">
      <template #footer>
        <UButton variant="ghost" color="neutral" @click="resetOpen = false">{{ t("common.cancel") }}</UButton>
        <UButton color="error" icon="i-lucide-trash-2" @click="resetDraft">{{ t("home.draft.reset") }}</UButton>
      </template>
    </UModal>
  </div>
</template>
