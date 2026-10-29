/**
 * Base path for links. In production the app lives under `/tofes101/` on GitHub
 * Pages; in dev it is `/`. One helper so no component hard-codes a URL.
 */
export function useAppPath() {
  const config = useRuntimeConfig()
  const base = (config.app.baseURL || "/").replace(/\/$/, "")

  /** Route path for `<NuxtLink to>` — Nuxt already prefixes `baseURL`, so do not. */
  function path(to: string): string {
    return to.startsWith("/") ? to : `/${to}`
  }

  /** Absolute URL (baseURL included) for the employer link, QR codes, downloads. */
  function absolute(to: string): string {
    const clean = path(to)
    const full = `${base}${clean}`
    if (!import.meta.client) return full
    return new URL(full, location.origin).toString()
  }

  /** For head assets (`<link href>`), which Nuxt does NOT auto-prefix. */
  function asset(to: string): string {
    return `${base}${path(to)}`
  }

  return { base, path, absolute, asset }
}
