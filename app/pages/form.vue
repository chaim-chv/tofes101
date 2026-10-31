<script setup lang="ts">
/**
 * The single form route. Steps are state, mirrored to `?step=N` (ADR-0007), so
 * offline reloads, deep links and the browser's back button all behave.
 */
import type { EmployerPrefill } from "~~/shared/employer-link"
import { decodeEmployerLink } from "~~/shared/employer-link"
import type { MessageKey } from "~/locales"
import type { FieldDef, Signature } from "~/form/types"
import { answersFingerprint, rowKey } from "~/form/values"
import { hiddenCount } from "~/form/engine"

const { t, locale, init: initLocale, localeName, setGender } = useLocale()
const { path, absolute } = useAppPath()
const form = useFormStore()
const toast = useToast()
if (import.meta.dev && import.meta.client) (window as any).__form = form

useHead({
  title: () => `${t("nav.form")} — ${t("app.name")}`,
})

/* ------------------------------------------------------------------ prefill */

const prefill = ref<EmployerPrefill | null>(null)
const prefillDismissed = ref(false)
const prefillError = ref(false)
const lockedIds = ref<Set<string>>(new Set())

const EMPLOYER_FIELD_BY_KEY: Record<string, string> = {
  n: "employer.name",
  a: "employer.address",
  p: "employer.phone",
  d: "employer.deductionFile",
}

/** Existing answers that the link would replace. */
const prefillConflicts = computed(() => {
  if (!prefill.value) return [] as string[]
  const out: string[] = []
  for (const [key, value] of Object.entries(prefill.value.e ?? {})) {
    const id = EMPLOYER_FIELD_BY_KEY[key]
    const current = id ? form.state.value.values[id] : undefined
    if (id && typeof current === "string" && current.trim() && current !== value) out.push(id)
  }
  return out
})

// Keep every gendered message in sync with the employee's answer.
watch(
  () => form.state.value.values["employee.sex"],
  (sex) => setGender(sex === "female" ? "f" : sex === "male" ? "m" : null),
  { immediate: true },
)

// Signing date is the signing date: set it when a signature exists, and never
// leave it empty (a signature without a date is not a signature).
watch(
  () => form.state.value.values["sign.signature"],
  (signature) => {
    if (!signature) return
    if (form.state.value.values["sign.date"]) return
    const now = new Date()
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    form.setValue("sign.date", iso)
  },
)

const importInput = ref<HTMLInputElement | null>(null)
const importResult = ref<{ ok: boolean; reason?: string } | null>(null)
const importMessage = computed(() => {
  const r = importResult.value
  if (!r) return null
  if (r.ok) return t("import.ok")
  const map: Record<string, string> = {
    parse: "import.parse",
    foreign: "import.foreign",
    newer: "import.newer",
    shape: "import.shape",
    unavailable: "import.parse",
  }
  return t((map[r.reason ?? "shape"] ?? "import.shape") as any)
})

function pickBackup() {
  importInput.value?.click()
}

async function onBackupChosen(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ""
  if (!file) return
  if (form.dirty.value && !confirm(t("import.confirm"))) return
  importResult.value = await form.importDraft(file)
  if (importResult.value.ok) {
    showErrors.value = false
    touched.clear()
    // The imported draft knows nothing about the employer link that was open.
    lockedIds.value = new Set()
  }
}

async function readPrefill(rawHash: string) {
  const hash = String(rawHash ?? "").replace(/^#/, "")
  if (!hash.startsWith("e=")) return
  const result = await decodeEmployerLink(hash.slice(2))
  if (!result.ok) {
    prefillError.value = true
    prefill.value = null
    return
  }
  prefillError.value = false
  prefill.value = result.payload
  // The payload is only applied when accepted — a link must never silently
  // overwrite answers the user already typed.
}

let lastHash = ""

function onHashChange() {
  if (!import.meta.client) return
  if (location.hash === lastHash) return
  lastHash = location.hash
  void readPrefill(location.hash)
}

onMounted(async () => {
  initLocale()
  await form.hydrate()
  await form.flush()

  // The router may strip the fragment during hydration; the inline script in
  // nuxt.config captured it first. Same-route hash changes are handled below.
  const initial = String((window as any).__INITIAL_HASH ?? location.hash ?? "")
  lastHash = location.hash
  await readPrefill(initial)
})

function acceptPrefill() {
  if (!prefill.value) return
  const values: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(prefill.value.e ?? {})) {
    const id = EMPLOYER_FIELD_BY_KEY[key]
    if (id) values[id] = value
  }
  // A link with a real employer name means "unknown" no longer applies; leaving
  // it set would keep the prefilled address/phone hidden.
  if (prefill.value.e?.n) values["employer.unknown"] = false
  form.applyPrefill(values)
  lockedIds.value = new Set(
    (prefill.value.lock ?? []).map((k) => EMPLOYER_FIELD_BY_KEY[k]).filter((v): v is string => !!v),
  )
  prefill.value = null
  prefillError.value = false
  // Land the user on the employer step they just accepted.
  form.goToId("employer", { force: true })
  afterNavigate()
}

function dismissPrefill() {
  prefill.value = null
  prefillError.value = false
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

function jump(id: string) {
  const result = form.goToId(id)
  if (result.ok) {
    afterNavigate()
    return
  }
  // A rail click must never be a dead click: show the blocking step's errors.
  showErrors.value = true
  nextTick(() => summary.value?.focus())
}

function afterNavigate() {
  // A new step starts clean: no red fields or old summary from the step left
  // behind (which may have failed a "continue" a moment ago).
  showErrors.value = false
  touched.clear()
  nextTick(() => {
    document.getElementById("step-title")?.focus()
    window.scrollTo({ top: 0, behavior: "smooth" })
  })
}

/** Mark the field the user actually blurred as touched, including repeat rows. */
function markTouched(fallbackId: string, event: FocusEvent) {
  const target = event.target as HTMLElement | null
  const owner = target?.closest?.("[data-field-id]") as HTMLElement | null
  touched.add(owner?.dataset.fieldId ?? fallbackId)
}

/* --------------------------------------------------------------- lifecycle */

function onVisibility() {
  if (document.visibilityState === "hidden") void form.flush()
}
onMounted(() => {
  document.addEventListener("visibilitychange", onVisibility)
  window.addEventListener("pagehide", onVisibility)
  window.addEventListener("hashchange", onHashChange)
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
  window.removeEventListener("hashchange", onHashChange)
  document.removeEventListener("focusout", onFocusOut)
})

const step = computed(() => form.currentStep.value)
const stepTitle = computed(() => (step.value ? t(step.value.titleKey) : ""))
const visibleStepCount = computed(() => form.steps.value.filter((s) => s.status !== "skipped").length)
const isLast = computed(() => form.currentStepIndex.value === visibleStepCount.value - 1)

/** The first step that is currently skipped, with its explanation (never silent). */
const skippedStep = computed(() => {
  const view = form.steps.value.find((s) => s.status === "skipped")
  if (!view) return null
  const schemaStep = form.schema.steps.find((s) => s.id === view.id)
  if (!schemaStep?.skipReasonKey) return null
  return { view, reasonKey: schemaStep.skipReasonKey }
})

const hiddenAnswers = computed(() => hiddenCount(form.state.value))
const hiddenNoticeDismissed = ref(false)

/** The official form has a fixed number of printed rows; warn before data is left out. */
const pdfRowWarning = computed(() => {
  const id = step.value?.id
  const rows = (value: unknown) => (Array.isArray(value) ? value.length : 0)
  if (id === "children") {
    const n = rows(form.state.value.values["children"])
    return n > 5 ? t("warn.childrenPdfRows", { max: 5, extra: n - 5 }) : null
  }
  if (id === "credits") {
    const n = rows(form.state.value.values["coord.employers"])
    return n > 3 ? t("warn.coordPdfRows", { max: 3, extra: n - 3 }) : null
  }
  return null
})

/* --------------------------------------------------------- signature integrity */

const currentAnswersHash = computed(() => answersFingerprint(form.state.value))
const signature = computed(() => form.state.value.values["sign.signature"] as Signature | undefined)
const signatureStale = computed(
  () => !!signature.value?.answersHash && signature.value.answersHash !== currentAnswersHash.value,
)
const staleError = ref(false)

function resign() {
  form.setValue("sign.signature", undefined)
  staleError.value = false
}
const labels = computed<Record<string, string>>(() => {
  const out: Record<string, string> = {}
  for (const f of form.schema.allFields) {
    if (f.labelKey) out[f.id] = t(f.labelKey)
    // Repeat rows report issues as "children.idNum"; the summary must show a
    // human label for them, not the raw field id.
    for (const sub of f.fields ?? []) {
      if (!sub.labelKey) continue
      const id = `${f.id}.${rowKey(sub.id)}`
      out[id] = f.labelKey ? `${t(f.labelKey)} — ${t(sub.labelKey)}` : t(sub.labelKey)
    }
  }
  return out
})

function isRequiredFor(field: FieldDef): boolean {
  return typeof field.required === "function"
    ? field.required(form.state.value)
    : field.required === true
}

function valueOf(id: string): unknown {
  return form.state.value.values[id]
}

function issuesOf(id: string) {
  // Errors are shown only after the field was touched or the user tried to move
  // on — never a wall of red on arrival (kb/ux/validation-and-errors.md).
  if (!showErrors.value && !touched.has(id)) return []
  const issues = form.fieldIssues(id)
  if (showErrors.value) return issues
  // On blur show format errors only: "required" waits for Continue. This is the
  // documented rule, and it also avoids a layout shift while the user tabs from
  // an empty field to the next control.
  return issues.filter((issue) => issue.code !== "required")
}

function isLocked(id: string) {
  return lockedIds.value.has(id)
}

function setValue(id: string, value: unknown) {
  form.setValue(id, value)
}

/* ------------------------------------------------------------------ export */

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
const pdf = usePdfExport()

async function downloadPdf() {
  if (signatureStale.value) {
    staleError.value = true
    nextTick(() => document.getElementById("f-sign.signature")?.focus())
    return
  }
  // The sign step has no "continue": downloading is the final action, so it is
  // where the signature/date requirement must be enforced and shown.
  if (form.currentErrors.value.length) {
    showErrors.value = true
    nextTick(() => summary.value?.focus())
    return
  }
  staleError.value = false
  const ok = await pdf.download(form.state.value)
  if (!ok) return
  form.markExported()
  toast.add({
    title: t("pdf.ready"),
    description: pdf.fileName.value ?? undefined,
    color: "success",
    icon: "i-lucide-check-circle-2",
  })
}

const deleteOpen = ref(false)
const deleting = ref(false)

async function deleteAll() {
  deleting.value = true
  try {
    await form.reset()
    lockedIds.value = new Set()
    deleteOpen.value = false
    toast.add({ title: t("delete.done"), color: "success", icon: "i-lucide-trash-2" })
    await navigateTo(path("/"))
  } finally {
    deleting.value = false
  }
}

async function reloadDraft() {
  const ok = await form.reloadFromStorage()
  toast.add({
    title: ok ? t("conflict.reloaded") : t("conflict.reloadFailed"),
    color: ok ? "success" : "error",
    icon: ok ? "i-lucide-refresh-cw" : "i-lucide-circle-alert",
  })
}

function changeIdKind() {
  form.goToId("identity", { force: true })
  afterNavigate()
}
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
        <UAlert
          v-if="prefillConflicts.length"
          class="mt-3"
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          :description="t('form.prefill.overwrite', { n: prefillConflicts.length })"
        />
        <div class="mt-4 flex flex-wrap gap-2">
          <UButton @click="acceptPrefill">
            {{ prefillConflicts.length ? t("form.prefill.replace") : t("form.prefill.accept") }}
          </UButton>
          <UButton variant="ghost" color="neutral" @click="dismissPrefill">{{ t("form.prefill.dismiss") }}</UButton>
        </div>
      </UCard>

      <UAlert
        v-if="prefillError"
        class="mb-4 [&_[data-slot=description]]:!text-highlighted [&_[data-slot=description]]:!opacity-100"
        color="warning"
        variant="subtle"
        icon="i-lucide-circle-alert"
        :description="t('form.badPayload')"
        :close="true"
        @update:open="prefillError = false"
      />

      <UAlert
        v-if="importMessage"
        class="mb-4 [&_[data-slot=description]]:!text-highlighted [&_[data-slot=description]]:!opacity-100"
        :color="importResult?.ok ? 'success' : 'error'"
        variant="subtle"
        :description="importMessage"
      />

      <!-- progress -->
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
        <StepProgress
          :steps="form.steps.value"
          :current-id="step?.id"
          :show-counts="showErrors"
          @select="jump"
        />
        <p class="text-xs text-muted" aria-live="polite">
          <span v-if="form.saving.value">{{ t("common.saving") }}</span>
          <span v-else-if="form.lastSavedAt.value">{{ t("common.saved") }}</span>
        </p>
      </div>

      <UCard v-if="form.conflict.value" class="mb-4 border-warning/40">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-sm font-medium text-highlighted">{{ t("conflict.title") }}</p>
            <p class="mt-1 text-sm text-muted">{{ t("conflict.body") }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <UButton size="sm" icon="i-lucide-refresh-cw" @click="reloadDraft">{{ t("conflict.reload") }}</UButton>
            <UButton size="sm" variant="ghost" color="neutral" @click="form.dismissConflict()">
              {{ t("conflict.dismiss") }}
            </UButton>
          </div>
        </div>
      </UCard>

      <UAlert
        v-if="skippedStep"
        class="mb-4 [&_[data-slot=description]]:!text-highlighted [&_[data-slot=description]]:!opacity-100"
        color="info"
        variant="subtle"
        icon="i-lucide-arrow-right"
      >
        <template #description>
          <span>{{ t(skippedStep.reasonKey as MessageKey) }}</span>
          <UButton
            v-if="skippedStep.view.id === 'children'"
            variant="link"
            size="xs"
            class="ms-2"
            @click="changeIdKind"
          >
            {{ t("form.skipped.change") }}
          </UButton>
        </template>
      </UAlert>

      <UAlert
        v-if="hiddenAnswers && !hiddenNoticeDismissed"
        class="mb-4 [&_[data-slot=description]]:!text-highlighted [&_[data-slot=description]]:!opacity-100"
        color="info"
        variant="subtle"
        icon="i-lucide-lock"
        :description="t('form.hidden.body', { n: hiddenAnswers })"
        :close="true"
        @update:open="hiddenNoticeDismissed = true"
      />

      <!-- step -->
      <section class="rounded-2xl border border-default bg-default p-5 sm:p-7">
        <p class="text-xs font-medium text-muted">
          {{ t("meta.stepOf", { n: form.currentStepIndex.value + 1, total: visibleStepCount }) }}
        </p>
        <h1 id="step-title" tabindex="-1" class="mt-1 text-2xl font-bold tracking-tight text-highlighted focus:outline-none">
          {{ stepTitle }}
        </h1>
        <p v-if="step?.introKey" class="mt-2 text-sm text-muted">{{ t(step.introKey) }}</p>

        <ErrorSummary
          ref="summary"
          :issues="showErrors ? form.currentIssues.value : []"
          :labels="labels"
          class="mt-5"
        />

        <UAlert
          v-if="pdfRowWarning"
          class="mt-5 [&_[data-slot=description]]:!text-highlighted [&_[data-slot=description]]:!opacity-100"
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          :description="pdfRowWarning"
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
              @focusout="markTouched(field.id, $event)"
            >
              <FormRepeat
                v-if="field.kind === 'repeat'"
                :field="field"
                :items="(form.state.value.values[field.id] as any) ?? []"
                :issues-by-field="issuesOf"
                :issues="issuesOf(field.id)"
                :required="isRequiredFor(field)"
                :disabled="isLocked(field.id)"
                @add="form.addRow(field)"
                @remove="(key) => form.removeRow(field.id, key)"
                @update="(key, sub, value) => form.setSubValue(field.id, key, sub, value)"
              />
              <FormSignature
                v-else-if="field.kind === 'signature'"
                :model-value="(form.state.value.values[field.id] as any)"
                :declaration-version="form.schema.declarationVersion"
                :answers-hash="currentAnswersHash"
                :issues="issuesOf(field.id)"
                :required="isRequiredFor(field)"
                :field-id="field.id"
                :help-key="field.helpKey"
                @update:model-value="(v) => setValue(field.id, v)"
              />
              <FormField
                v-else
                :field="field"
                :value="valueOf(field.id)"
                :issues="issuesOf(field.id)"
                :required="isRequiredFor(field)"
                :locked="isLocked(field.id)"
                :disabled="isLocked(field.id)"
                @update:value="(v) => setValue(field.id, v)"
              />
            </div>
          </template>
        </div>
        <DocumentUploads
          v-if="step?.id === 'attach'"
          :id-kind="(form.state.value.values['employee.idKind'] as 'idNum' | 'passport' | undefined)"
        />

        <DocumentChecklist v-if="step?.id === 'sign'" :state="form.state.value" />

        <div v-if="step?.id === 'sign'" class="mt-6 space-y-3">
          <UAlert
            v-if="signatureStale || staleError"
            color="warning"
            variant="subtle"
            icon="i-lucide-triangle-alert"
          >
            <template #description>
              <span>{{ t("sign.resign") }}</span>
              <UButton variant="link" size="xs" class="ms-2" @click="resign">{{ t("sign.resignAction") }}</UButton>
            </template>
          </UAlert>
          <p class="text-xs text-muted">{{ t("pdf.hint") }}</p>
          <UAlert
            v-if="pdf.error.value"
            class="[&_[data-slot=description]]:!text-highlighted [&_[data-slot=description]]:!opacity-100"
            color="error"
            variant="subtle"
            :description="t('pdf.error')"
          />
        </div>
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
          <UButton variant="outline" color="neutral" icon="i-lucide-upload" @click="pickBackup">
            {{ t("meta.importJson") }}
          </UButton>
          <input
            ref="importInput"
            type="file"
            accept="application/json,.json"
            class="sr-only"
            :aria-label="t('meta.importJson')"
            @change="onBackupChosen"
          />
          <UButton v-if="isLast" :loading="pdf.busy.value" icon="i-lucide-file-down" @click="downloadPdf">
            {{ pdf.busy.value ? t("pdf.generating") : t("pdf.download") }}
          </UButton>
          <UButton v-if="isLast" :to="printHref" variant="outline" color="neutral" icon="i-lucide-printer">
            {{ t("common.print") }}
          </UButton>
          <UButton v-if="!isLast" icon="i-lucide-arrow-left" @click="advance">
            {{ t("common.next") }}
          </UButton>
        </div>
      </div>

      <div class="mt-8 flex flex-col items-center gap-2">
        <p class="text-center text-xs text-muted">
          {{ t("privacy.line") }}
        </p>
        <UButton variant="link" color="error" size="xs" icon="i-lucide-trash-2" @click="deleteOpen = true">
          {{ t("meta.clearAll") }}
        </UButton>
      </div>
    </main>

    <UModal v-model:open="deleteOpen" :title="t('delete.title')" :description="t('delete.body')">
      <template #footer>
        <UButton variant="ghost" color="neutral" @click="deleteOpen = false">{{ t("common.cancel") }}</UButton>
        <UButton color="error" icon="i-lucide-trash-2" :loading="deleting" @click="deleteAll">
          {{ t("delete.confirm") }}
        </UButton>
      </template>
    </UModal>
  </div>
</template>
