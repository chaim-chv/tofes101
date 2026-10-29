import { describe, expect, test } from "bun:test"
import {
  decodeEmployerLink,
  encodeEmployerLink,
  fingerprint,
  sanitize,
  MAX_DECODED_BYTES,
} from "../shared/employer-link"

describe("employer prefill link", () => {
  test("round-trips the employer block", async () => {
    const encoded = await encodeEmployerLink({
      i: "acme",
      l: "he",
      x: 2026,
      e: {
        n: "חברת אקמה בע\"מ",
        a: "רחוב הרצל 1, תל אביב",
        p: "03-1234567",
        d: "912345678",
      },
      lock: ["n", "a", "p", "d"],
    })

    expect(encoded.startsWith("v1.")).toBe(true)

    const result = await decodeEmployerLink(`#e=${encoded}`)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.payload.e.n).toBe("חברת אקמה בע\"מ")
    expect(result.payload.e.d).toBe("912345678")
    expect(result.payload.lock).toEqual(["n", "a", "p", "d"])
    expect(result.payload.x).toBe(2026)
  })

  test("survives URL-safe characters only", async () => {
    const encoded = await encodeEmployerLink({ e: { n: "בדיקה ~ עם/תווים+מוזרים" } })
    expect(encoded).toMatch(/^v1\.[A-Za-z0-9_-]+$/)
    const decoded = await decodeEmployerLink(encoded)
    expect(decoded.ok).toBe(true)
  })

  test("rejects garbage without throwing", async () => {
    for (const bad of ["", "#e=", "v1.notbase64!!", "v2.abc", "v1." + "A".repeat(400)]) {
      const r = await decodeEmployerLink(bad)
      expect(r.ok).toBe(false)
    }
  })

  test("never accepts a query-string style payload with a missing prefix", async () => {
    const r = await decodeEmployerLink("abc123")
    expect(r.ok).toBe(false)
  })

  test("drops unknown keys and prototype pollution attempts", () => {
    const r = sanitize(
      JSON.parse(
        '{"v":1,"k":"emp","e":{"n":"x","evil":"y"},"__proto__":{"polluted":true},"lock":["n","evil"]}',
      ),
    )
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(Object.keys(r.payload.e)).toEqual(["n"])
    expect(r.payload.lock).toEqual(["n"])
    expect(({} as any).polluted).toBeUndefined()
  })

  test("clamps over-long values", () => {
    const r = sanitize({ v: 1, k: "emp", e: { n: "א".repeat(500) } })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.payload.e.n!.length).toBe(200)
  })

  test("rejects an unsupported version explicitly", async () => {
    const r = await decodeEmployerLink("v9.abc")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe("version")
  })

  test("fingerprint is short, stable and hex", async () => {
    const a = await fingerprint("v1.abc")
    const b = await fingerprint("v1.abc")
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{6}$/)
    expect(await fingerprint("v1.abd")).not.toBe(a)
  })

  test("decoded payload stays far below the size cap", async () => {
    const encoded = await encodeEmployerLink({
      e: { n: "א".repeat(200), a: "ב".repeat(300), p: "0".repeat(40), d: "9".repeat(20) },
    })
    // base64 inflates ~4/3; decoded is what we cap
    expect(encoded.length).toBeLessThan(MAX_DECODED_BYTES)
  })
})
