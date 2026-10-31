<script setup lang="ts">
const { t, toggle, init } = useLocale()
const { path } = useAppPath()

onMounted(() => init())
useHead({ title: () => `${t('app.name')} — ${t('app.tagline')}` })

const steps = [
  { icon: "i-lucide-shield-check", title: "home.point.local.title", body: "home.point.local.body" },
  { icon: "i-lucide-keyboard", title: "home.point.fast.title", body: "home.point.fast.body" },
  { icon: "i-lucide-book-open", title: "home.point.right.title", body: "home.point.right.body" },
] as const
</script>

<template>
  <div class="min-h-dvh bg-elevated/30">
    <header class="border-b border-default bg-default">
      <UContainer class="flex items-center justify-between gap-4 py-3">
        <NuxtLink :to="path('/')" class="flex items-center gap-2 font-semibold text-highlighted">
          <UIcon name="i-lucide-file-text" class="size-5 text-primary" />
          {{ t("app.name") }}
        </NuxtLink>
        <nav class="flex items-center gap-1" :aria-label="t('nav.main')">
          <UButton :to="path('/form/')" variant="ghost" color="neutral" size="sm">
            {{ t("nav.form") }}
          </UButton>
          <UButton :to="path('/employer/')" variant="ghost" color="neutral" size="sm">
            {{ t("nav.employer") }}
          </UButton>
          <UButton variant="ghost" color="neutral" size="sm" icon="i-lucide-languages" @click="toggle()">
            {{ t("nav.language") }}
          </UButton>
        </nav>
      </UContainer>
    </header>

    <main>
      <UContainer class="py-14 sm:py-20">
        <div class="max-w-2xl">
          <UBadge color="success" variant="subtle" icon="i-lucide-lock" class="text-green-900">
            {{ t("privacy.badge") }}
          </UBadge>
          <h1 class="mt-5 text-3xl font-bold tracking-tight text-highlighted sm:text-4xl">
            {{ t("home.h1") }}
          </h1>
          <p class="mt-4 text-lg text-muted">
            {{ t("home.lead") }}
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <UButton :to="path('/form/')" size="lg" icon="i-lucide-arrow-left">
              {{ t("home.cta.start") }}
            </UButton>
            <UButton :to="path('/employer/')" size="lg" variant="outline" color="neutral" icon="i-lucide-link">
              {{ t("home.cta.employer") }}
            </UButton>
          </div>
          <p class="mt-6 text-sm text-muted">
            {{ t("privacy.line") }}
          </p>
        </div>

        <ul class="mt-16 grid gap-4 sm:grid-cols-3">
          <li v-for="s in steps" :key="s.title">
            <UCard class="h-full">
              <UIcon :name="s.icon" class="size-6 text-primary" />
              <h2 class="mt-3 font-semibold text-highlighted">{{ t(s.title) }}</h2>
              <p class="mt-1 text-sm text-muted">{{ t(s.body) }}</p>
            </UCard>
          </li>
        </ul>
      </UContainer>
    </main>

    <footer class="border-t border-default py-6 text-center text-xs text-muted">
      <UContainer>
        <p>{{ t("app.footer") }}</p>
      </UContainer>
    </footer>
  </div>
</template>
