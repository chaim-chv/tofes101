import { schema } from "~/form/schema"
import { visibleSteps } from "~/form/engine"
import { createDraftStore } from "~/storage/draft"
import type { MessageKey } from "~/locales"

export type DraftSummary = {
  /** 0-based index in the visible step list, for `?step=`. */
  stepIndex: number
  stepNumber: number
  total: number
  titleKey: MessageKey
  savedAt: string
}

/**
 * Reads the local draft for the landing page only. Deliberately not part of the
 * form store: the home page must not mount or hydrate the whole wizard.
 */
export function useDraftSummary() {
  const summary = ref<DraftSummary | null>(null)
  const ready = ref(false)

  async function refresh() {
    if (!import.meta.client) return
    try {
      const state = await createDraftStore().load()
      if (!state) {
        summary.value = null
        return
      }
      const visible = visibleSteps(schema, state)
      const stepIndex = Math.max(0, Math.min(state.meta.step, visible.length - 1))
      const step = visible[stepIndex]
      if (!step) {
        summary.value = null
        return
      }
      summary.value = {
        stepIndex,
        stepNumber: stepIndex + 1,
        total: visible.length,
        titleKey: step.titleKey as MessageKey,
        savedAt: state.meta.updatedAt,
      }
    } catch (e) {
      console.warn("[draft] summary failed", e)
      summary.value = null
    } finally {
      ready.value = true
    }
  }

  async function clearDraft() {
    const store = createDraftStore()
    await store.clear()
    try {
      const { createAttachmentStore } = await import("~/storage/files")
      await createAttachmentStore().clear()
    } catch (e) {
      console.warn("[draft] attachment clear failed", e)
    }
    summary.value = null
  }

  onMounted(refresh)

  return { summary, ready, refresh, clearDraft }
}
