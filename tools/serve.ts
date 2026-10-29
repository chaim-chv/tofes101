/**
 * Static file server for local verification of the generated site.
 *
 *   bun run serve            # http://localhost:4173
 *
 * Mirrors what a plain static host does: `/x` resolves to `x.html` or
 * `x/index.html`, no redirects with trailing slashes, HTML5-ish fallback.
 */
import { join, normalize, extname } from "node:path"
import { existsSync, statSync } from "node:fs"

const ROOT = ".output/public"
const PORT = Number(process.env.PORT ?? 4173)

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
}

export function resolveStatic(pathname: string): string | null {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, "")
  const candidates = [
    join(ROOT, clean),
    join(ROOT, clean, "index.html"),
    join(ROOT, `${clean}.html`),
    join(ROOT, "index.html"),
  ]
  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isFile()) return c
  }
  return null
}

export function startStaticServer(port = PORT) {
  return Bun.serve({
    port,
    fetch(req) {
      const url = new URL(req.url)
      const file = resolveStatic(url.pathname)
      if (!file) return new Response("Not found", { status: 404 })
      return new Response(Bun.file(file), {
        headers: {
          "content-type": MIME[extname(file)] ?? "application/octet-stream",
          "cache-control": "no-store",
        },
      })
    },
  })
}

if (import.meta.main) {
  const server = startStaticServer()
  console.log(`serving ${ROOT} on http://localhost:${server.port}`)
}
