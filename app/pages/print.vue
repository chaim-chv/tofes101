<script setup lang="ts">
import he from "~/locales/he"

/**
 * Print / full-document view. This is the output path that always works: the
 * browser shapes the Hebrew correctly, the user gets a real A4 document through
 * the print dialog, and nothing is downloaded from the network.
 *
 * The document itself is always the official Hebrew wording, even when the UI
 * is in English: an English label on a Hebrew tax form is a correctness bug.
 */
definePageMeta({ layout: false })

const { t, init: initLocale, gender } = useLocale()
const { path } = useAppPath()
const form = useFormStore()
const pdf = usePdfExport()

useHead({ title: () => `${t("common.print")} — ${t("app.name")}` })

onMounted(async () => {
  initLocale()
  await form.hydrate()
})

const state = computed(() => form.state.value)
const signed = computed(() => {
  const sig = state.value.values["sign.signature"] as
    | { kind: "drawn" | "typed"; typedName?: string; signedAt: string }
    | undefined
  return sig
})

const signatureSvg = computed(() => {
  const sig = state.value.values["sign.signature"] as { kind: string; strokes?: number[][][] } | undefined
  if (!sig || sig.kind !== "drawn" || !sig.strokes?.length) return null
  const w = 220
  const h = 80
  const paths = sig.strokes
    .map((stroke) =>
      stroke
        .map(([x, y], i) => `${i === 0 ? "M" : "L"}${((x ?? 0) * w).toFixed(1)},${((y ?? 0) * h).toFixed(1)}`)
        .join(" "),
    )
    .join(" ")
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><path d="${paths}" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
})

const declaration = computed(() => {
  const entry = he["sign.declaration"]
  return gender.value === "f" ? entry.f : entry.m
})

const docTaxYear = he["doc101.taxYear"].replace("{year}", String(state.value.meta.taxYear))

async function download() {
  const ok = await pdf.download(state.value)
  if (ok) form.markExported()
}

function doPrint() {
  window.print()
}

const dateText = computed(() => {
  const d = state.value.values["sign.date"]
  if (typeof d !== "string") return ""
  const [, m, day] = d.split("-")
  return `${day}/${m}/${d.slice(0, 4)}`
})
</script>

<template>
  <div class="min-h-dvh bg-elevated/40">
    <div class="no-print mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4">
      <UButton :to="path('/form/')" variant="ghost" color="neutral" icon="i-lucide-arrow-right">
        {{ t("common.back") }}
      </UButton>
      <div class="flex flex-wrap gap-2">
        <UButton :loading="pdf.busy.value" icon="i-lucide-file-down" @click="download">
          {{ pdf.busy.value ? t("pdf.generating") : t("pdf.download") }}
        </UButton>
        <UButton variant="outline" color="neutral" icon="i-lucide-printer" @click="doPrint">
          {{ t("common.print") }}
        </UButton>
      </div>
    </div>

    <UAlert
      v-if="pdf.error.value"
      class="no-print mx-auto mb-4 w-full max-w-3xl [&_[data-slot=description]]:!text-highlighted [&_[data-slot=description]]:!opacity-100"
      color="error"
      variant="subtle"
      :description="t('pdf.error')"
    />

    <article dir="rtl" lang="he" class="document mx-auto w-full max-w-3xl break-words bg-white px-4 py-8 text-black shadow-sm sm:px-8 sm:py-10 print:shadow-none">
      <header class="mb-6 border-b border-neutral-300 pb-4 text-center">
        <h1 class="text-xl font-bold">{{ he["doc101.title"] }}</h1>
        <p class="mt-1 text-xs text-neutral-600">{{ he["doc101.subtitle"] }}</p>
        <p class="mt-1 text-xs text-neutral-600">{{ docTaxYear }}</p>
      </header>

      <ReviewList :schema="form.schema" :state="state" readonly />

      <DocumentsSection :state="state" readonly class="mt-8" />

      <section class="mt-8 border-t border-neutral-300 pt-5">
        <h2 class="text-sm font-bold">{{ he["doc101.declarationTitle"] }}</h2>
        <p class="mt-2 text-[13px] leading-relaxed">{{ declaration }}</p>

        <div class="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div class="min-w-0 sm:min-w-[120px]">
            <p class="text-[11px] text-neutral-600">{{ he["doc101.date"] }}</p>
            <p class="mt-1 border-b border-neutral-400 pb-1 text-sm" dir="ltr">{{ dateText }}</p>
          </div>
          <div class="w-full text-center sm:w-auto sm:min-w-[220px]">
            <div v-if="signatureSvg" class="mx-auto" v-html="signatureSvg" />
            <div v-else-if="signed?.typedName" class="mx-auto text-lg italic">{{ signed.typedName }}</div>
            <p class="mt-1 border-t border-neutral-400 pt-1 text-[11px] text-neutral-600">
              {{ he["doc101.signature"] }}
            </p>
          </div>
        </div>
      </section>

      <footer class="mt-8 border-t border-neutral-200 pt-3 text-[10px] text-neutral-500">
        {{ he["doc101.generated"] }}
      </footer>
    </article>
  </div>
</template>

<style scoped>
@media print {
  .document {
    max-width: none;
    padding: 0;
  }

  .document section,
  .document header,
  .document footer {
    break-inside: avoid;
  }
}
</style>
