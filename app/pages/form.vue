<script setup lang="ts">
/**
 * The single form route. Steps are state, mirrored to `?step=N` (ADR-0007), so
 * offline reloads, deep links and the browser's back button all behave.
 */
import type { EmployerPrefill } from "~~/shared/employer-link"
import { decodeEmployerLink } from "~~/shared/employer-link"
import type { MessageKey } from "~/locales"

const { t, locale, init: initLocale, localeName } = useLocale()
const { path, absolute } = useAppPath()
const form = useFormStore()
if (import.meta.dev && import.meta.client) (window as any).__form = form

useHead({
  title: () => `${t("nav.form")} — ${t("app.name")}`,
})

/* ------------------------------------------------------------------ prefill */

const prefill = ref<EmployerPrefill | null>(null)
const prefillDismissed = ref(false)
const lockedIds = ref<Set<string>>(new Set())

const EMPLOYER_FIELD_BY_KEY: Record<string, string> = {
  n: "employer.name",
  a: "employer.address",
  p: "employer.phone",
  d: "employer.deductionFile",
}

onMounted(async () => {
  initLocale()
  await form.hydrate()
  await form.flush()

  const hash = String((window as any).__INITIAL_HASH ?? location.hash ?? "").replace(/^#/, "")
  if (!hash.startsWith("e=")) return
  const result = await decodeEmployerLink(hash.slice(2))
  if (!result.ok) return
  prefill.value = result.payload
  // The payload is only applied when accepted — a link must never silently
  // overwrite answers the user already typed.
})

function acceptPrefill() {
  if (!prefill.value) return
  const values: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(prefill.value.e ?? {})) {
    const id = EMPLOYER_FIELD_BY_KEY[key]
    if (id) values[id] = value
  }
  form.applyPrefill(values)
  lockedIds.value = new Set(
    (prefill.value.lock ?? []).map((k) => EMPLOYER_FIELD_BY_KEY[k]).filter((v): v is string => !!v),
  )
  prefill.value = null
  // Land the user on the employer step they just accepted.
  form.goToId("employer", { force: true })
}

function dismissPrefill() {
  prefill.value = null
  prefillDismissed.value = true
  if (import.meta.client) history.replaceState(null, "", location.pathname + location.search)
}

/* --------------------------------------------------------------- navigation */

const summary = ref<HTMLElement | null>(null)
const showErrors = ref(false)
const touched = reactive(new Set<string>())

function advance() {
  const result = form.next()
  if (!result.ok) {
    showErrors.value = true
    nextTick(() => summary.value?.focus())
    return
  }
  showErrors.value = false
  touched.clear()
  afterNavigate()
}

function back() {
  form.back()
  afterNavigate()
}

function jump(index: number) {
  const result = form.goTo(index)
  if (result.ok) afterNavigate()
}

function afterNavigate() {
  nextTick(() => {
    document.getElementById("step-title")?.focus()
    window.scrollTo({ top: 0, behavior: "smooth" })
  })
}

/* --------------------------------------------------------------- lifecycle */

function onVisibility() {
  if (document.visibilityState === "hidden") void form.flush()
}
onMounted(() => {
  document.addEventListener("visibilitychange", onVisibility)
  window.addEventListener("pagehide", onVisibility)
  // Every field blur is a save point: cheap (≤1 ms) and removes the "I typed it
  // and closed the tab" data-loss window.
  document.addEventListener("focusout", onFocusOut)
})
function onFocusOut() {
  void form.flush()
}
onBeforeUnmount(() => {
  document.removeEventListener("visibilitychange", onVisibility)
  window.removeEventListener("pagehide", onVisibility)
  document.removeEventListener("focusout", onFocusOut)
})

const step = computed(() => form.currentStep.value)
const stepTitle = computed(() => (step.value ? t(step.value.titleKey) : ""))
const isLast = computed(() => form.currentStepIndex.value === form.steps.value.filter((s) => s.status !== "skipped").length - 1)
const skipNote = computed(() => (step.value ? form.skipReasonKey(step.value) : undefined))
const labels = computed<Record<string, string>>(() => {
  const out: Record<string, string> = {}
  for (const f of form.schema.allFields) if (f.labelKey) out[f.id] = t(f.labelKey)
  return out
})

function valueOf(id: string): unknown {
  return form.state.value.values[id]
}

function issuesOf(id: string) {
  // Errors are shown only after the field was touched or the user tried to move
  // on — never a wall of red on arrival (kb/ux/validation-and-errors.md).
  if (!showErrors.value && !touched.has(id)) return []
  return form.fieldIssues(id)
}

function isLocked(id: string) {
  return lockedIds.value.has(id)
}

function setValue(id: string, value: unknown) {
  form.setValue(id, value)
}

/* ------------------------------------------------------------------ export */

const exporting = ref(false)

async function exportBackup() {
  const blob = await form.exportDraft()
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `tofes101-draft-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const printHref = computed(() => path("/print/"))
</script>

<template>
  <div class="min-h-dvh bg-elevated/30">
    <AppHeader compact />

    <main class="mx-auto w-full max-w-3xl px-4 pb-24 pt-5">
      <!-- prefill offer -->
      <UCard v-if="prefill && !prefillDismissed" class="mb-5 border-primary/40">
        <h2 class="text-base font-semibold text-highlighted">
          {{ t("form.prefill.title", { name: prefill.e.n ?? "" }) }}
        </h2>
        <dl class="mt-3 grid gap-1 text-sm sm:grid-cols-2">
          <div v-if="prefill.e.a"><dt class="text-muted">{{ t("employer.field.address") }}</dt><dd>{{ prefill.e.a }}</dd></div>
          <div v-if="prefill.e.p"><dt class="text-muted">{{ t("employer.field.phone") }}</dt><dd dir="ltr">{{ prefill.e.p }}</dd></div>
          <div v-if="prefill.e.d"><dt class="text-muted">{{ t("employer.field.deductionFile") }}</dt><dd dir="ltr">{{ prefill.e.d }}</dd></div>
        </dl>
        <div class="mt-4 flex flex-wrap gap-2">
          <UButton @click="acceptPrefill">{{ t("form.prefill.accept") }}</UButton>
          <UButton variant="ghost" color="neutral" @click="dismissPrefill">{{ t("form.prefill.dismiss") }}</UButton>
        </div>
      </UCard>

      <!-- progress -->
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <StepProgress
          :steps="form.steps.value"
          :current="form.currentStepIndex.value"
          :show-counts="showErrors"
          @select="jump"
        />
        <p class="text-xs text-muted">
          <span v-if="form.saving.value">{{ t("common.saving") }}</span>
          <span v-else-if="form.dirty.value && form.lastSavedAt.value">{{ t("common.saved") }}</span>
        </p>
      </div>

      <UAlert
        v-if="form.conflict.value"
        class="mb-4 [&_[data-slot=description]]:!text-highlighted [&_[data-slot=description]]:!opacity-100"
        color="warning"
        variant="subtle"
        icon="i-lucide-refresh-cw"
        :description="t('common.hideAnswers')"
      />

      <!-- step -->
      <section class="rounded-2xl border border-default bg-default p-5 sm:p-7">
        <p class="text-xs font-medium text-muted">
          {{ t("meta.stepOf", { n: form.currentStepIndex.value + 1, total: form.steps.value.filter((s) => s.status !== 'skipped').length }) }}
        </p>
        <h1 id="step-title" tabindex="-1" class="mt-1 text-2xl font-bold tracking-tight text-highlighted focus:outline-none">
          {{ stepTitle }}
        </h1>
        <p v-if="step?.introKey" class="mt-2 text-sm text-muted">{{ t(step.introKey) }}</p>

        <UAlert v-if="skipNote" class="mt-4" color="info" variant="subtle" :description="t(skipNote as MessageKey)" />

        <ErrorSummary
          ref="summary"
          :issues="showErrors ? form.currentIssues.value : []"
          :labels="labels"
          class="mt-5"
        />

        <!-- review step -->
        <div v-if="step?.id === 'review'" class="mt-5">
          <ReviewList :schema="form.schema" :state="form.state.value" @edit="(id: string) => form.goToId(id, { force: true })" />
        </div>

        <!-- fields -->
        <div v-else class="mt-5 grid grid-cols-12 gap-x-4 gap-y-5">
          <template v-for="field in step ? form.visibleFields(step) : []" :key="field.id">
            <div
              :class="field.span === 6 ? 'col-span-12 sm:col-span-6' : field.span === 4 ? 'col-span-12 sm:col-span-4' : field.span === 3 ? 'col-span-6 sm:col-span-3' : 'col-span-12'"
              @focusout="touched.add(field.id)"
            >
              <FormRepeat
                v-if="field.kind === 'repeat'"
                :field="field"
                :items="(form.state.value.values[field.id] as any) ?? []"
                :issues-by-field="issuesOf"
                :disabled="isLocked(field.id)"
                @add="form.addRow(field)"
                @remove="(key) => form.removeRow(field.id, key)"
                @update="(key, sub, value) => form.setSubValue(field.id, key, sub, value)"
              />
              <FormSignature
                v-else-if="field.kind === 'signature'"
                :model-value="(form.state.value.values[field.id] as any)"
                :declaration-version="form.schema.declarationVersion"
                @update:model-value="(v) => setValue(field.id, v)"
              />
              <FormField
                v-else
                :field="field"
                :value="valueOf(field.id)"
                :issues="issuesOf(field.id)"
                :disabled="isLocked(field.id)"
                @update:value="(v) => setValue(field.id, v)"
              />
            </div>
          </template>
        </div>
        <DocumentChecklist v-if="step?.id === 'sign'" :state="form.state.value" />
      </section>

      <!-- actions -->
      <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
        <UButton variant="ghost" color="neutral" icon="i-lucide-arrow-right" :disabled="form.currentStepIndex.value === 0" @click="back">
          {{ t("common.back") }}
        </UButton>

        <div class="flex flex-wrap items-center gap-2">
          <UButton variant="outline" color="neutral" icon="i-lucide-download" @click="exportBackup">
            {{ t("meta.exportJson") }}
          </UButton>
          <UButton v-if="isLast" :to="printHref" icon="i-lucide-printer">
            {{ t("meta.reviewAll") }}
          </UButton>
          <UButton v-else icon="i-lucide-arrow-left" @click="advance">
            {{ t("common.next") }}
          </UButton>
        </div>
      </div>

      <p class="mt-8 text-center text-xs text-muted">
        {{ t("privacy.line") }}
      </p>
    </main>
  </div>
</template>
