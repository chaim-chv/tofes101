/**
 * Umami opt-out flag.
 *
 * Umami checks `localStorage["umami.disabled"]` before every page-view send, so
 * writing it takes effect immediately — no reload, no extra library. This is the
 * one deliberate localStorage write outside the draft layer: the key holds a
 * boolean, not user data. See ADR-0008.
 */
const KEY = "umami.disabled"

export function useAnalyticsOptOut() {
  /** true = page-view counting is on. Optimistic on the server; synced on mount. */
  const enabled = ref(true)

  function set(next: boolean) {
    enabled.value = next
    if (!import.meta.client) return
    try {
      if (next) localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, "1")
    } catch {
      /* storage unavailable (private mode): the tracker keeps its default */
    }
  }

  /** Called once on mount: reflect a choice made in an earlier visit. */
  function init() {
    if (!import.meta.client) return
    try {
      enabled.value = localStorage.getItem(KEY) !== "1"
    } catch {
      /* keep the optimistic default */
    }
  }

  return { enabled, init, set }
}
