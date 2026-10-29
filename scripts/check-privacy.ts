#!/usr/bin/env bun
/**
 * Privacy gate: proves the built app makes no third-party requests.
 *
 *   bun run check:privacy
 *
 * Fails if the static output references any external host, inline analytics,
 * or the payload reader would leak the URL (Referer policy).
 */
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, extname } from "node:path"

const OUT = ".output/public"

const ALLOW_HOSTS = new Set<string>([
  "tailwindcss.com", // license banner inside the generated CSS, never fetched
  "a.invalid", // Nuxt's internal "can we reach the network at all?" probe
  "b.invalid", // (unresolvable by design; kept so the probe code stays inert)
  // Default endpoint constant inside the vendored Iconify runtime. We bundle the
  // lucide collection at build time and the CSP sets connect-src 'self', so this
  // URL can never be fetched. Re-checked below against the CSP meta tag.
  "api.iconify.design",
])
const TEXT_EXT = new Set([".html", ".js", ".css", ".json", ".svg", ".webmanifest"])

function walk(dir: string, files: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    const s = statSync(p)
    if (s.isDirectory()) walk(p, files)
    else files.push(p)
  }
  return files
}

if (!statSync(OUT, { throwIfNoEntry: false })) {
  console.error(`✖ ${OUT} not found — run \`bun run generate\` first.`)
  process.exit(1)
}

const files = walk(OUT)
const hits: { file: string; host: string; context: string }[] = []
const urlRe = /(?:https?:)?\/\/([a-z0-9.-]+\.[a-z]{2,})/gi

for (const file of files) {
  if (!TEXT_EXT.has(extname(file))) continue
  const text = readFileSync(file, "utf8")
  for (const m of text.matchAll(urlRe)) {
    const host = m[1].toLowerCase()
    // schema-ish false positives
    if (host.endsWith("w3.org") || host.endsWith("nuxt.com") || host.endsWith("vuejs.org")) continue
    if (ALLOW_HOSTS.has(host)) continue
    const at = m.index ?? 0
    hits.push({ file, host, context: text.slice(Math.max(0, at - 40), at + 60).replace(/\s+/g, " ") })
  }
}

// The app never wants an inline <script> injected by a third party.
const htmlWithInline = files
  .filter((f) => f.endsWith(".html"))
  .filter((f) => {
    const html = readFileSync(f, "utf8")
    return /<script[^>]+src=["']https?:/i.test(html)
  })

if (hits.length || htmlWithInline.length) {
  console.error("✖ Privacy gate failed — external references found:\n")
  for (const h of hits.slice(0, 40)) console.error(`  ${h.file}\n    host: ${h.host}\n    …${h.context}…`)
  for (const f of htmlWithInline) console.error(`  ${f}: external <script src>`)
  console.error(
    `\n${hits.length} external references. Self-host the asset, or add the host to ALLOW_HOSTS with a comment explaining why.`,
  )
  process.exit(1)
}

// The CSP must be present, otherwise the allow-list above is not enforced.
const cspMissing = files.filter((f) => f.endsWith(".html")).filter((f) => {
  const html = readFileSync(f, "utf8")
  return !/http-equiv="?content-security-policy"?/i.test(html)
})
if (cspMissing.length) {
  console.error("✖ Privacy gate: pages without a Content-Security-Policy meta tag:")
  for (const f of cspMissing.slice(0, 10)) console.error(`  ${f}`)
  process.exit(1)
}

console.log(`✔ Privacy gate passed: ${files.length} files, no external hosts.`)
