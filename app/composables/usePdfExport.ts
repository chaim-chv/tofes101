/**
 * PDF download. The renderer is code-split: nothing here pulls pdf-lib into the
 * first load. The official blank form and the Hebrew font are same-origin static
 * assets, so the app stays offline-capable and never talks to a third party.
 */
import type { FormState } from "~/form/types"
import { createAttachmentStore } from "~/storage/files"

export function usePdfExport() {
  const { asset } = useAppPath()
  const { locale } = useLocale()

  const busy = ref(false)
  const error = ref<string | null>(null)

  async function download(state: FormState) {
    if (busy.value) return
    busy.value = true
    error.value = null
    try {
      const { renderPdf } = await import("~/pdf/overlay")
      // Attachments are optional; a failure to read them must never block the
      // form itself — the PDF is still valid without the extra pages.
      const attachments = await createAttachmentStore()
        .loadForPdf()
        .catch(() => [])
      const bytes = await renderPdf(state, {
        pdfUrl: asset("/assets/tofes-101-official.pdf"),
        fontUrl: asset("/fonts/Heebo-Variable.ttf"),
        attachments,
      })

      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = fileName(state, locale.value)
      anchor.click()
      // revoke on the next tick: Safari needs the URL alive during the click
      setTimeout(() => URL.revokeObjectURL(url), 4000)
    } catch (e) {
      console.warn("[pdf] render failed", e)
      error.value = e instanceof Error ? e.message : "unknown"
    } finally {
      busy.value = false
    }
  }

  return { busy, error, download }
}

function fileName(state: FormState, locale: string): string {
  const last = String(state.values["employee.lastName"] ?? "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 40)
  const who = last || (locale === "he" ? "טופס" : "form")
  return `tofes101-${state.meta.taxYear}-${who}.pdf`
}
