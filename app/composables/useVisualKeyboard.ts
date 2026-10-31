/**
 * Hides sticky bars while the on-screen keyboard is open. The bar otherwise
 * covers the focused field on iOS/Android (WCAG 2.4.11).
 */
export function useVisualKeyboard() {
  if (!import.meta.client) return

  onMounted(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const update = () => {
      const keyboard = window.innerHeight - viewport.height > 150
      document.documentElement.toggleAttribute("data-keyboard", keyboard)
    }
    viewport.addEventListener("resize", update)
    update()
    onBeforeUnmount(() => {
      viewport.removeEventListener("resize", update)
      document.documentElement.removeAttribute("data-keyboard")
    })
  })
}
