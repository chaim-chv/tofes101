<script setup lang="ts">
import { encodeEmployerLink, fingerprint as hashPayload } from "~~/shared/employer-link"
import { deductionFileNumber, israeliPhone } from "~/form/validators"
import { emptyState } from "~/form/values"

/**
 * The employer prefill-link builder (v1 replacement for the reference's
 * server-side template + email flow). See ADR-0005.
 *
 * Everything here runs locally; the produced link carries only the employer
 * block, in the URL fragment.
 */
const { t, locale, init } = useLocale()
const { path, absolute } = useAppPath()
const toast = useToast()

onMounted(() => init())
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

const validationState = emptyState(2026)
const phoneIssues = computed(() => israeliPhone()(form.phone, validationState))
const deductionIssues = computed(() => deductionFileNumber()(form.deductionFile, validationState))
const phoneError = computed(() => {
  const issue = phoneIssues.value[0]
  return issue ? t(issue.messageKey, issue.params) : ""
})
const deductionError = computed(() => {
  const issue = deductionIssues.value[0]
  return issue ? t(issue.messageKey, issue.params) : ""
})

const canBuild = computed(
  () =>
    form.name.trim().length > 1 &&
    phoneIssues.value.length === 0 &&
    deductionIssues.value.length === 0,
)

function onPhoneInput(value: string | number) {
  form.phone = String(value).replace(/[^\d+\s-]/g, "")
}

function onDeductionInput(value: string | number) {
  form.deductionFile = String(value).replace(/\D/g, "").slice(0, 9)
}

watch(
  () => form.phone,
  (value) => {
    const next = value.replace(/[^\d+\s-]/g, "")
    if (next !== value) form.phone = next
  },
)
watch(
  () => form.deductionFile,
  (value) => {
    const next = value.replace(/\D/g, "").slice(0, 9)
    if (next !== value) form.deductionFile = next
  },
)

async function build() {
  if (!canBuild.value) return
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
  link.value = `${absolute("/form/")}#e=${payload}`
  fingerprintCode.value = await hashPayload(payload)
  copied.value = false
}

const message = computed(() =>
  t("employer.result.messageBody", { link: link.value }),
)

async function copy() {
  if (!link.value) return
  try {
    await navigator.clipboard.writeText(link.value)
    copied.value = true
    toast.add({ title: t("employer.result.copied"), color: "success", icon: "i-lucide-check-circle-2" })
  } catch {
    /* clipboard blocked: the field is selectable, the user can copy manually */
  }
}

async function copyMessage() {
  if (!link.value) return
  try {
    await navigator.clipboard.writeText(message.value)
    toast.add({ title: t("employer.result.messageCopied"), color: "success", icon: "i-lucide-check-circle-2" })
  } catch {
    toast.add({ title: t("employer.result.copyFailed"), color: "error", icon: "i-lucide-circle-alert" })
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

const how = computed(() => [
  { icon: "i-lucide-file-text", title: t("employer.how.1.title"), description: t("employer.how.1") },
  { icon: "i-lucide-lock", title: t("employer.how.2.title"), description: t("employer.how.2") },
  { icon: "i-lucide-file-down", title: t("employer.how.3.title"), description: t("employer.how.3") },
])
</script>

<template>
  <UContainer class="max-w-3xl py-8 sm:py-12">
    <UButton :to="path('/')" variant="link" color="neutral" icon="i-lucide-arrow-right" size="sm">
      {{ t("nav.home") }}
    </UButton>

    <UPageHeader
      class="mt-2"
      :title="t('employer.h1')"
      :description="t('employer.lead')"
      :ui="{ title: 'text-2xl sm:text-3xl', description: 'max-w-2xl' }"
    />

    <UAlert
      class="mt-6 [&_[data-slot=description]]:!text-highlighted [&_[data-slot=description]]:!opacity-100"
      color="warning"
      variant="subtle"
      icon="i-lucide-shield-alert"
      :description="t('employer.warning')"
    />

    <UCard v-if="!link" class="mt-6">
      <UForm :state="form" class="grid gap-5 sm:grid-cols-2" @submit="build">
        <UFormField :label="t('employer.field.name')" required class="sm:col-span-2">
          <UInput v-model="form.name" size="lg" autocomplete="organization" class="w-full" />
        </UFormField>
        <UFormField :label="t('employer.field.address')" class="sm:col-span-2">
          <UInput v-model="form.address" size="lg" autocomplete="street-address" class="w-full" />
        </UFormField>
        <UFormField :label="t('employer.field.phone')" :error="phoneError || undefined">
          <UInput
            :model-value="form.phone"
            size="lg"
            type="tel"
            inputmode="tel"
            pattern="[0-9+\-\s]*"
            autocomplete="tel"
            dir="ltr"
            class="w-full"
            @update:model-value="onPhoneInput"
          />
        </UFormField>
        <UFormField
          :label="t('employer.field.deductionFile')"
          :hint="t('employer.field.deductionHint')"
          :error="deductionError || undefined"
        >
          <UInput
            :model-value="form.deductionFile"
            size="lg"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="9"
            dir="ltr"
            class="w-full"
            @update:model-value="onDeductionInput"
          />
        </UFormField>

        <UCheckbox v-model="form.lock" :label="t('employer.field.lock')" class="sm:col-span-2" />

        <div class="sm:col-span-2">
          <UButton type="submit" size="lg" icon="i-lucide-link" :disabled="!canBuild">
            {{ t("employer.form.submit") }}
          </UButton>
          <p class="mt-2 text-xs text-muted">{{ t("employer.form.requiredHint") }}</p>
        </div>
      </UForm>
    </UCard>

    <UCard v-else class="mt-6">
      <h2 class="text-lg font-semibold text-highlighted">{{ t("employer.result.title") }}</h2>
      <p class="mt-1 text-sm text-muted">{{ t("employer.result.ready") }}</p>

      <div class="mt-4 flex flex-col gap-3 sm:flex-row">
        <UInput
          :model-value="link"
          readonly
          size="lg"
          class="w-full font-mono text-xs"
          dir="ltr"
          @focus="($event.target as HTMLInputElement).select()"
        />
        <UButton size="lg" :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'" @click="copy">
          {{ copied ? t("employer.result.copied") : t("employer.result.copy") }}
        </UButton>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <UButton :to="link" target="_blank" rel="noopener" variant="outline" color="neutral" icon="i-lucide-link">
          {{ t("employer.result.open") }}
        </UButton>
        <UButton variant="outline" color="neutral" icon="i-lucide-copy" @click="copyMessage">
          {{ t("employer.result.message") }}
        </UButton>
        <UButton variant="ghost" color="neutral"  @click="link = ''">
          {{ t("employer.result.edit") }}
        </UButton>
      </div>

      <p class="mt-4 text-xs text-muted">{{ t("employer.privacyNote") }}</p>

      <UCollapsible class="mt-4">
        <UButton variant="link" color="neutral" size="sm" >
          {{ t("employer.result.advanced") }}
        </UButton>
        <template #content>
          <div class="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-muted">
            <div class="flex items-center gap-2">
              <span>{{ t("employer.result.fingerprint") }}</span>
              <span class="font-mono text-highlighted" dir="ltr">{{ fingerprintCode }}</span>
            </div>
            <UButton variant="link" color="neutral" size="sm" icon="i-lucide-download" @click="download">
              {{ t("employer.result.download") }}
            </UButton>
          </div>
        </template>
      </UCollapsible>
    </UCard>

    <UPageSection
      :title="t('employer.how.title')"
      :features="how"
      :ui="{ container: 'py-8 sm:py-10 lg:py-12' }"
    />
  </UContainer>
</template>
