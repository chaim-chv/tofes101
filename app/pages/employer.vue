<script setup lang="ts">
import { encodeEmployerLink, fingerprint as hashPayload } from "~~/shared/employer-link"

/**
 * The employer prefill-link builder (v1 replacement for the reference's
 * server-side template + email flow). See ADR-0005.
 *
 * Everything here runs locally; the produced link carries only the employer
 * block, in the URL fragment.
 */
const { t, locale } = useLocale()
useHead({ title: () => `${t("employer.h1")} — ${t("app.name")}` })

const form = reactive({
  name: "",
  address: "",
  phone: "",
  deductionFile: "",
  lock: true,
})

const link = ref("")
const fingerprintCode = ref("")
const copied = ref(false)

const canBuild = computed(() => form.name.trim().length > 1)

async function build() {
  const payload = await encodeEmployerLink({
    i: slug(form.name),
    l: locale.value,
    x: 2026,
    e: {
      n: form.name,
      a: form.address,
      p: form.phone,
      d: form.deductionFile,
    },
    lock: form.lock ? ["n", "a", "p", "d"] : [],
  })
  const base = import.meta.client ? `${location.origin}/form/` : "/form/"
  link.value = `${base}#e=${payload}`
  fingerprintCode.value = await hashPayload(payload)
  copied.value = false
}

async function copy() {
  if (!link.value) return
  try {
    await navigator.clipboard.writeText(link.value)
    copied.value = true
  } catch {
    /* clipboard blocked: the field is selectable, the user can copy manually */
  }
}

function download() {
  if (!link.value) return
  const hash = link.value.split("#e=")[1] ?? ""
  const body = JSON.stringify({ employerLink: link.value, payload: hash, year: 2026 }, null, 2)
  const blob = new Blob([body], { type: "application/json" })
  const a = document.createElement("a")
  a.href = URL.createObjectURL(blob)
  a.download = `tofes101-employer-${slug(form.name) || "link"}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

function slug(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
}
</script>

<template>
  <div class="min-h-dvh bg-elevated/30">
    <UContainer class="max-w-3xl py-10 sm:py-16">
      <UButton to="/" variant="link" color="neutral" icon="i-lucide-arrow-right" size="sm">
        {{ t("nav.home") }}
      </UButton>

      <h1 class="mt-4 text-2xl font-bold tracking-tight text-highlighted sm:text-3xl">
        {{ t("employer.h1") }}
      </h1>
      <p class="mt-3 max-w-2xl text-muted">{{ t("employer.lead") }}</p>

      <UAlert
        class="mt-6"
        color="warning"
        variant="subtle"
        icon="i-lucide-shield-alert"
        :description="t('employer.warning')"
      />

      <UCard class="mt-8">
        <form class="grid gap-5 sm:grid-cols-2" @submit.prevent="build">
          <UFormField :label="t('employer.field.name')" required class="sm:col-span-2">
            <UInput v-model="form.name" size="lg" autocomplete="organization" class="w-full" />
          </UFormField>
          <UFormField :label="t('employer.field.address')" class="sm:col-span-2">
            <UInput v-model="form.address" size="lg" autocomplete="street-address" class="w-full" />
          </UFormField>
          <UFormField :label="t('employer.field.phone')">
            <UInput v-model="form.phone" size="lg" type="tel" inputmode="tel" autocomplete="tel" dir="ltr" class="w-full" />
          </UFormField>
          <UFormField :label="t('employer.field.deductionFile')" hint="9 ספרות">
            <UInput v-model="form.deductionFile" size="lg" inputmode="numeric" maxlength="9" dir="ltr" class="w-full" />
          </UFormField>

          <UCheckbox v-model="form.lock" :label="t('employer.field.lock')" class="sm:col-span-2" />

          <div class="sm:col-span-2">
            <UButton type="submit" size="lg" icon="i-lucide-link" :disabled="!canBuild">
              {{ t("employer.result.title") }}
            </UButton>
          </div>
        </form>
      </UCard>

      <UCard v-if="link" class="mt-6">
        <h2 class="font-semibold text-highlighted">{{ t("employer.result.title") }}</h2>
        <div class="mt-3 flex flex-col gap-3 sm:flex-row">
          <UInput :model-value="link" readonly size="lg" class="w-full font-mono text-xs" dir="ltr" @focus="($event.target as HTMLInputElement).select()" />
          <UButton size="lg" :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'" @click="copy">
            {{ copied ? t("employer.result.copied") : t("employer.result.copy") }}
          </UButton>
        </div>
        <dl class="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
          <div class="flex items-center gap-2">
            <dt>{{ t("employer.result.fingerprint") }}</dt>
            <dd class="font-mono text-highlighted" dir="ltr">{{ fingerprintCode }}</dd>
          </div>
          <div>
            <UButton variant="link" color="neutral" size="sm" icon="i-lucide-download" @click="download">
              {{ t("employer.result.download") }}
            </UButton>
          </div>
        </dl>
        <p class="mt-4 text-xs text-muted">
          הקישור נבנה במכשיר שלכם. אין לנו שרת, ואנחנו לא יודעים מי פתח אותו.
        </p>
      </UCard>

      <aside class="mt-10 rounded-lg border border-default bg-default p-4 text-sm text-muted">
        <h2 class="font-medium text-highlighted">איך זה עובד</h2>
        <ol class="mt-2 list-decimal space-y-1 ps-5">
          <li>אתם ממלאים את פרטי המעסיק ומקבלים קישור.</li>
          <li>העובד/ת פותח/ת את הקישור — הפרטים כבר בפנים, ואפשר לנעול אותם.</li>
          <li>העובד/ת מוריד/ה PDF ומוסר/ת לכם. שום דבר לא עובר דרכנו.</li>
        </ol>
      </aside>
    </UContainer>
  </div>
</template>
