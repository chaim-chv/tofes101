/**
 * Employer prefill payload — see kb/decisions/adr-0005-employer-prefill-link.md
 *
 * The payload travels in the URL *fragment* (`#e=v1.<data>`), never in the
 * query string, so it is not sent to a host, a CDN log or a Referer header.
 *
 * Pure module: no Nuxt, no DOM. Runs in the browser and in `bun test`.
 */

export const PAYLOAD_VERSION = 1
export const PREFIX = `v${PAYLOAD_VERSION}.`
export const MAX_DECODED_BYTES = 8 * 1024

/** The only keys we accept. Everything else is dropped on decode. */
const EMPLOYER_KEYS = ["n", "a", "p", "d"] as const
export type EmployerKey = (typeof EMPLOYER_KEYS)[number]

export type EmployerPrefill = {
  v: 1
  k: "emp"
  i?: string
  l?: "he" | "en"
  e: Partial<Record<EmployerKey, string>>
  lock?: EmployerKey[]
  x?: number
}

export type DecodeResult =
  | { ok: true; payload: EmployerPrefill }
  | { ok: false; reason: "empty" | "prefix" | "inflate" | "json" | "shape" | "too-big" | "version" }

const LIMITS: Record<EmployerKey, number> = { n: 200, a: 300, p: 40, d: 20 }

/* ------------------------------------------------------------------ base64url */

function bytesToB64url(bytes: Uint8Array): string {
  let bin = ""
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/")
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : ""
  const bin = atob(b64 + pad)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

/* ------------------------------------------------------------ deflate-raw */

async function deflate(bytes: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream("deflate-raw")
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(cs)
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function inflate(bytes: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate-raw")
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(ds)
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

/* ---------------------------------------------------------------- encode */

export async function encodeEmployerLink(
  input: Omit<EmployerPrefill, "v" | "k"> & { v?: 1; k?: "emp" },
): Promise<string> {
  const payload: EmployerPrefill = {
    v: 1,
    k: "emp",
    ...(input.i ? { i: clean(input.i, 60) } : {}),
    ...(input.l ? { l: input.l } : {}),
    e: {},
    ...(input.x ? { x: input.x } : {}),
  }
  for (const key of EMPLOYER_KEYS) {
    const value = input.e?.[key]
    if (value && value.trim()) payload.e[key] = clean(value, LIMITS[key])
  }
  const lock = (input.lock ?? []).filter((k): k is EmployerKey => EMPLOYER_KEYS.includes(k))
  if (lock.length) payload.lock = lock

  const json = new TextEncoder().encode(JSON.stringify(payload))
  return PREFIX + bytesToB64url(await deflate(json))
}

/* ---------------------------------------------------------------- decode */

export async function decodeEmployerLink(raw: string): Promise<DecodeResult> {
  const value = (raw ?? "").trim().replace(/^#/, "").replace(/^e=/, "")
  if (!value) return { ok: false, reason: "empty" }
  if (!value.startsWith("v1.")) {
    return { ok: false, reason: value.startsWith("v") ? "version" : "prefix" }
  }

  let inflated: Uint8Array
  try {
    const bytes = b64urlToBytes(value.slice(PREFIX.length))
    if (bytes.byteLength > MAX_DECODED_BYTES) return { ok: false, reason: "too-big" }
    inflated = await inflate(bytes)
  } catch {
    return { ok: false, reason: "inflate" }
  }
  if (inflated.byteLength > MAX_DECODED_BYTES) return { ok: false, reason: "too-big" }

  let parsed: unknown
  try {
    parsed = JSON.parse(new TextDecoder().decode(inflated))
  } catch {
    return { ok: false, reason: "json" }
  }

  return sanitize(parsed)
}

/**
 * Fail closed: never throw, never trust the shape. Copies known keys only
 * (also prevents `__proto__`-style surprises), clamps lengths, validates lock
 * as a subset of present keys.
 */
export function sanitize(parsed: unknown): DecodeResult {
  if (!parsed || typeof parsed !== "object") return { ok: false, reason: "shape" }
  const p = parsed as Record<string, unknown>
  if (p.v !== 1) return { ok: false, reason: "version" }
  if (p.k !== "emp") return { ok: false, reason: "shape" }

  const e: Partial<Record<EmployerKey, string>> = {}
  const rawE = (p.e ?? {}) as Record<string, unknown>
  for (const key of EMPLOYER_KEYS) {
    const v = rawE[key]
    if (typeof v === "string" && v.trim()) e[key] = clean(v, LIMITS[key])
  }

  const lock = Array.isArray(p.lock)
    ? (p.lock.filter(
        (k): k is EmployerKey => typeof k === "string" && EMPLOYER_KEYS.includes(k as EmployerKey),
      ) as EmployerKey[])
    : []
  // a lock on a key that has no value is meaningless
  const effectiveLock = lock.filter((k) => e[k])

  const payload: EmployerPrefill = { v: 1, k: "emp", e }
  if (typeof p.i === "string" && p.i.trim()) payload.i = clean(p.i, 60)
  if (p.l === "he" || p.l === "en") payload.l = p.l
  if (typeof p.x === "number" && Number.isInteger(p.x) && p.x > 2000 && p.x < 2100) payload.x = p.x
  if (effectiveLock.length) payload.lock = effectiveLock

  return { ok: true, payload }
}

/* ---------------------------------------------------------------- utils */

/** Strip control chars, collapse whitespace, clamp length. */
function clean(value: string, max: number): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
}

/** Short, human-comparable fingerprint so both sides can confirm the payload. */
export async function fingerprint(rawPayload: string): Promise<string> {
  const data = new TextEncoder().encode(rawPayload)
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", data as BufferSource))
  return Array.from(digest.slice(0, 3))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}
