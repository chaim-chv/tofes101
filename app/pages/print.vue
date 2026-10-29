<script setup lang="ts">
/**
 * Print / full-document view. This is the output path that always works: the
 * browser shapes the Hebrew correctly, the user gets a real A4 PDF through the
 * print dialog, and nothing is downloaded from the network.
 */
const { t, locale, init: initLocale } = useLocale()
const { path } = useAppPath()
const form = useFormStore()

useHead({ title: () => `${t("meta.reviewAll")} — ${t("app.name")}` })

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

async function exportBackup() {
  const blob = await form.exportDraft()
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "tofes101-draft.json"
  a.click()
  URL.revokeObjectURL(url)
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
    <div class="no-print mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-4">
      <UButton :to="path('/form/')" variant="ghost" color="neutral" icon="i-lucide-arrow-right">
        {{ t("common.back") }}
      </UButton>
      <div class="flex gap-2">
        <UButton variant="outline" color="neutral" icon="i-lucide-download" @click="exportBackup">
          {{ t("meta.exportJson") }}
        </UButton>
        <UButton icon="i-lucide-printer" @click="doPrint">{{ t("meta.reviewAll") }}</UButton>
      </div>
    </div>

    <article class="document mx-auto w-full max-w-3xl bg-white px-8 py-10 text-black shadow-sm print:shadow-none">
      <header class="mb-6 border-b border-neutral-300 pb-4 text-center">
        <h1 class="text-xl font-bold">טופס 101 — כרטיס עובד</h1>
        <p class="mt-1 text-xs text-neutral-600">
          ובקשה להקלה ולתיאום מס על ידי המעסיק · לפי תקנות מס הכנסה (ניכוי ממשכורת ומשכר עבודה), התשנ״ג-1993
        </p>
        <p class="mt-1 text-xs text-neutral-600">שנת מס {{ state.meta.taxYear }}</p>
      </header>

      <ReviewList :schema="form.schema" :state="state" readonly />

      <section class="mt-8 border-t border-neutral-300 pt-5">
        <h2 class="text-sm font-bold">הצהרה</h2>
        <p class="mt-2 text-[13px] leading-relaxed">{{ t("sign.declaration") }}</p>

        <div class="mt-6 flex items-end justify-between gap-8">
          <div class="min-w-[120px]">
            <p class="text-[11px] text-neutral-600">תאריך</p>
            <p class="mt-1 border-b border-neutral-400 pb-1 text-sm" dir="ltr">{{ dateText }}</p>
          </div>
          <div class="min-w-[220px] text-center">
            <div v-if="signatureSvg" class="mx-auto" v-html="signatureSvg" />
            <div v-else-if="signed?.typedName" class="mx-auto text-lg italic">{{ signed.typedName }}</div>
            <p class="mt-1 border-t border-neutral-400 pt-1 text-[11px] text-neutral-600">חתימת המבקש/ת</p>
          </div>
        </div>
      </section>

      <footer class="mt-8 border-t border-neutral-200 pt-3 text-[10px] text-neutral-500">
        הופק בטופס 101 · {{ locale === "he" ? "הנתונים לא נשלחו לשום מקום" : "Your data was never sent anywhere" }}
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
}
</style>
