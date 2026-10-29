<script setup lang="ts">
/**
 * Entry point of the form. v1 skeleton: it proves the employer prefill path and
 * the step shell. The full 8-step flow lives in kb/flow/form-101-service.md.
 */
import { decodeEmployerLink, type EmployerPrefill } from "~~/shared/employer-link"

const { t } = useLocale()
useHead({ title: () => `${t("form.h1")} — ${t("app.name")}` })

const steps = [
  { key: "year", title: "שנת מס ופרטי מעסיק" },
  { key: "identity", title: "זהות" },
  { key: "address", title: "מגורים וקשר" },
  { key: "status", title: "מעמד" },
  { key: "children", title: "ילדים" },
  { key: "credits", title: "זיכויים והכנסות" },
  { key: "review", title: "סקירה" },
  { key: "sign", title: "הצהרה וחתימה" },
] as const

const step = ref(0)
const prefill = ref<EmployerPrefill | null>(null)
const prefillRaw = ref("")
const badPayload = ref(false)

const employer = reactive({ name: "", address: "", phone: "", deductionFile: "" })

onMounted(async () => {
  const locale = useLocale()
  locale.init()

  // The router may normalise the URL during hydration and drop the fragment, so
  // the snippet in nuxt.config captures it before the app boots.
  const raw = (window as any).__INITIAL_HASH ?? location.hash
  const hash = String(raw).replace(/^#/, "")
  if (!hash.startsWith("e=")) return
  prefillRaw.value = hash.slice(2)
  const result = await decodeEmployerLink(prefillRaw.value)
  if (!result.ok) {
    badPayload.value = true
    return
  }
  prefill.value = result.payload
  employer.name = result.payload.e.n ?? ""
  employer.address = result.payload.e.a ?? ""
  employer.phone = result.payload.e.p ?? ""
  employer.deductionFile = result.payload.e.d ?? ""
})

const locked = computed(() => new Set(prefill.value?.lock ?? []))
const employerName = computed(() => prefill.value?.e.n ?? "")
const accepted = ref(false)

function accept() {
  accepted.value = true
}
function dismiss() {
  prefill.value = null
  employer.name = ""
  employer.address = ""
  employer.phone = ""
  employer.deductionFile = ""
  history.replaceState(null, "", location.pathname)
}
</script>

<template>
  <div class="min-h-dvh bg-elevated/30">
    <UContainer class="max-w-3xl py-8 sm:py-12">
      <div class="flex items-center justify-between gap-4">
        <UButton to="/" variant="link" color="neutral" icon="i-lucide-arrow-right" size="sm">
          {{ t("nav.home") }}
        </UButton>
        <span class="text-sm text-muted">שלב {{ step + 1 }} מתוך {{ steps.length }}</span>
      </div>

      <nav aria-label="שלבי הטופס" class="mt-4">
        <ol class="flex flex-wrap gap-1.5">
          <li
            v-for="(s, i) in steps"
            :key="s.key"
            :aria-current="i === step ? 'step' : undefined"
          >
            <button
              type="button"
              class="rounded-full px-3 py-1 text-xs transition"
              :class="
                i === step
                  ? 'bg-primary text-inverted font-medium'
                  : i < step
                    ? 'bg-elevated text-highlighted'
                    : 'bg-default text-muted'
              "
              @click="step = i"
            >
              {{ s.title }}
            </button>
          </li>
        </ol>
      </nav>

      <h1 class="mt-8 text-2xl font-bold tracking-tight text-highlighted sm:text-3xl">
        {{ t("form.h1") }}
      </h1>

      <UAlert
        v-if="badPayload"
        class="mt-6"
        color="error"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        :description="t('form.badPayload')"
      />

      <UCard v-if="prefill && !accepted" class="mt-6">
        <h2 class="font-semibold text-highlighted">
          {{ t("form.prefill.title", { name: employerName }) }}
        </h2>
        <dl class="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div v-if="employer.address">
            <dt class="text-muted">{{ t("employer.field.address") }}</dt>
            <dd>{{ employer.address }}</dd>
          </div>
          <div v-if="employer.phone">
            <dt class="text-muted">{{ t("employer.field.phone") }}</dt>
            <dd dir="ltr">{{ employer.phone }}</dd>
          </div>
          <div v-if="employer.deductionFile">
            <dt class="text-muted">{{ t("employer.field.deductionFile") }}</dt>
            <dd dir="ltr">{{ employer.deductionFile }}</dd>
          </div>
        </dl>
        <div class="mt-5 flex flex-wrap gap-2">
          <UButton @click="accept">{{ t("form.prefill.accept") }}</UButton>
          <UButton variant="ghost" color="neutral" @click="dismiss">
            {{ t("form.prefill.dismiss") }}
          </UButton>
        </div>
      </UCard>

      <UCard class="mt-6">
        <h2 class="text-lg font-semibold text-highlighted">{{ steps[step]?.title }}</h2>

        <div v-if="step === 0" class="mt-5 grid gap-5 sm:grid-cols-2">
          <UFormField label="שנת המס" class="sm:col-span-2">
            <div class="flex items-center gap-2">
              <UBadge color="primary" variant="subtle" size="lg">2026</UBadge>
              <span class="text-sm text-muted">הטופס מעודכן לשנת 2026</span>
            </div>
          </UFormField>

          <UFormField label="שם המעסיק" required class="sm:col-span-2">
            <UInput
              v-model="employer.name"
              size="lg"
              :readonly="locked.has('n')"
              :disabled="locked.has('n')"
              :hint="locked.has('n') ? t('form.prefill.locked') : undefined"
              class="w-full"
              autocomplete="organization"
            />
          </UFormField>

          <UFormField label="כתובת" class="sm:col-span-2">
            <UInput v-model="employer.address" size="lg" :disabled="locked.has('a')" class="w-full" />
          </UFormField>

          <UFormField label="טלפון">
            <UInput v-model="employer.phone" size="lg" type="tel" dir="ltr" :disabled="locked.has('p')" class="w-full" />
          </UFormField>

          <UFormField label="מספר תיק ניכויים" hint="9 ספרות">
            <UInput
              v-model="employer.deductionFile"
              size="lg"
              inputmode="numeric"
              maxlength="9"
              dir="ltr"
              :disabled="locked.has('d')"
              class="w-full"
            />
          </UFormField>
        </div>

        <p v-else class="mt-4 text-sm text-muted">
          השלב הזה עדיין בבנייה. המפרט המלא שלו נמצא ב־<code>kb/flow/form-101-service.md</code>.
        </p>

        <div class="mt-8 flex items-center justify-between">
          <UButton variant="ghost" color="neutral" :disabled="step === 0" @click="step--">
            {{ t("common.back") }}
          </UButton>
          <UButton :disabled="step === steps.length - 1" @click="step++">
            {{ t("common.next") }}
          </UButton>
        </div>
      </UCard>
    </UContainer>
  </div>
</template>
