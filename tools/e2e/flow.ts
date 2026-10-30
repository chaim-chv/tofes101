/**
 * Full-flow e2e: employer builds a link → employee opens it, fills a canonical
 * profile, signs, reviews, prints. Also runs axe on every step.
 *
 *   bun run generate && bun run e2e
 *
 * Canonical profile #2 from docs/IMPLEMENTATION.md: married, working spouse,
 * two children — the shape that exercises the most conditionals at once.
 */
import { chromium, type Page } from "playwright"
import AxeBuilder from "@axe-core/playwright"
import { mkdirSync } from "node:fs"
import { startStaticServer } from "../serve"

const BASE = (process.env.BASE ?? "").replace(/\/$/, "")
const ROOT = `http://localhost:4173${BASE}`
const OUT = "research/spikes/screens"
mkdirSync(OUT, { recursive: true })

const server = startStaticServer(4173)
// Local dev has only the system Chrome; CI runners ship Chrome too, but fall
// back to Playwright's bundled Chromium when neither channel is available.
const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch())
const ctx = await browser.newContext({ locale: "he-IL", viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()

const problems: string[] = []
const external: string[] = []

page.on("pageerror", (e) => problems.push(`pageerror ${page.url()} :: ${e.message}`))
page.on("console", (m) => {
  if (m.type() === "error") problems.push(`console ${page.url()} :: ${m.text().slice(0, 200)}`)
})
page.on("request", (r) => {
  const url = r.url()
  // blob:/data: are in-memory previews and downloads, not network traffic
  if (url.startsWith("blob:") || url.startsWith("data:")) return
  const host = new URL(url).hostname
  if (!["localhost", "127.0.0.1"].includes(host)) external.push(url)
})

async function a11y(step: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
  for (const v of results.violations) {
    problems.push(`a11y[${step}] ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)
    if (process.env.E2E_DEBUG_A11Y) {
      for (const n of v.nodes) console.log("AXE", v.id, n.target.join(" "), "\n", n.html)
    }
  }
}

const t = (name: string) => page.getByRole("button", { name })

async function next() {
  await t("המשך").click()
  await page.waitForTimeout(200)
  const title = await page.locator("#step-title").innerText().catch(() => "?")
  const alert = await page.locator("[role=alert]").innerText().catch(() => "")
  console.log(`  → ${title} | alert=${JSON.stringify(alert.slice(0, 200))}`)
}

/* ---------------------------------------------------------------- employer */

await page.goto(`${ROOT}/employer/`, { waitUntil: "networkidle" })
await page.fill('input[autocomplete="organization"]', 'חברת אקמה בע"מ')
await page.fill('input[autocomplete="street-address"]', "רחוב הרצל 1, תל אביב")
await page.fill('input[autocomplete="tel"]', "03-1234567")
await page.fill('input[inputmode="numeric"]', "912345678")
await page.click("button[type=submit]")
const link = await page.inputValue("input[readonly]")
if (!link.includes("#e=v1.")) throw new Error("employer link not generated")

/* ------------------------------------------------------------------ prefill */

await page.goto(link, { waitUntil: "networkidle" })
await page.getByRole("button", { name: "אישור והמשך" }).click()
await page.waitForTimeout(300)
if (!(await page.locator('input[autocomplete="organization"]').isDisabled()))
  throw new Error("prefilled employer name should be locked")

await a11y("employer")
await next() // employer step -> identity

/* ----------------------------------------------------------------- identity */

await page.getByRole("radio", { name: "תעודת זהות" }).check()
await page.fill("#f-employee\\.idNum", "123456782")
await page.fill("#f-employee\\.firstName", "דנה")
await page.fill("#f-employee\\.lastName", "כהן")
await page.fill("#f-employee\\.birthDate", "1990-03-04")
await a11y("identity")
await next()

/* ------------------------------------------------------------------ contact */

await page.fill("#f-employee\\.city", "תל אביב - יפו")
await page.fill("#f-employee\\.street", "הרצל")
await page.fill("#f-employee\\.houseNum", "12")
await page.fill("#f-employee\\.mobile", "0501234567")
await next()

/* ------------------------------------------------------------------- status */

await page.getByRole("radio", { name: "נקבה" }).check()
await page.getByRole("radio", { name: "נשוי/אה" }).check()
await page.locator('input[name="employee.ilResident"][value="true"]').check()
await page.locator('input[name="employee.kibbutzMember"][value="false"]').check()
await page.locator('input[name="employee.healthFundMember"][value="true"]').check()
await page.locator('input[name="employee.healthFundName"][value="clalit"]').check()
await page.fill("#f-spouse\\.firstName", "יוסי")
await page.fill("#f-spouse\\.lastName", "כהן")
await page.fill("#f-spouse\\.idNum", "000000018")
await page.fill("#f-spouse\\.birthDate", "1988-07-01")
await page.getByRole("radio", { name: "יש לבן/בת הזוג הכנסה" }).check()
await page.getByRole("checkbox", { name: "עבודה / קצבה / עסק" }).check()
await a11y("status")
await next()

/* ----------------------------------------------------------------- children */

await page.getByRole("button", { name: "הוספת ילד/ה" }).click()
await page.fill("#f-children\\.name", "נועה")
await page.fill("#f-children\\.idNum", "000000026")
await page.fill("#f-children\\.birthDate", "2016-05-10")
await page.getByRole("checkbox", { name: "הילד/ה נמצא/ת בחזקתי" }).check()
await next()

/* ------------------------------------------------------------------- income */

await page.getByRole("checkbox", { name: "משכורת חודש" }).check()
await page.fill("#f-income\\.startDate", "2026-01-01")
await page.getByRole("radio", { name: "אין לי הכנסות אחרות" }).check()
await a11y("income")
await next()

/* ------------------------------------------------------------------ credits */

await page.getByRole("checkbox", { name: "7. בגין ילדיי שבחזקתי (מחלק ג׳)" }).check()
await a11y("credits")
await next()

/* ------------------------------------------------------------ attachments */

await page.waitForTimeout(200)
// 1x1 PNG is enough to prove the pipeline (upload -> preview -> extra PDF page)
const idPng = `research/spikes/screens/_upload-id.png`
await Bun.write(
  idPng,
  Uint8Array.from(
    atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="),
    (c) => c.charCodeAt(0),
  ),
)
await page.setInputFiles('input[type=file][aria-label="תעודת זהות — צד קדמי"]', idPng)
await page.waitForTimeout(600)
await a11y("attach")
await next()

/* ------------------------------------------------------------------- review */

const reviewText = await page.locator("main").innerText()
if (!reviewText.includes("דנה")) throw new Error("review missing the employee name")
if (!reviewText.includes("נועה")) throw new Error("review missing the child")
await a11y("review")
await page.screenshot({ path: `${OUT}/06-review.png`, fullPage: true })

await next() // review -> sign

/* --------------------------------------------------------------------- sign */

await page.getByRole("tab", { name: "הקלדת שם" }).click()
await page.fill("#typed-signature", "דנה כהן")
await page.getByRole("button", { name: "חתימה", exact: true }).click()
const today = new Date()
const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
await page.fill("#f-sign\\.date", iso)
await a11y("sign")

if (process.env.E2E_DEBUG_STYLES) {
  const styles = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement)
    const btns = Array.from(document.querySelectorAll("button")).map((b) => {
      const cs = getComputedStyle(b)
      return { text: (b.textContent || "").trim().slice(0, 24), bg: cs.backgroundColor, color: cs.color, size: cs.fontSize }
    })
    return { primary: root.getPropertyValue("--ui-primary").trim(), btns: btns.filter((b) => b.text) }
  })
  console.log("STYLES", JSON.stringify(styles, null, 1))
}
await page.screenshot({ path: `${OUT}/07-sign.png`, fullPage: true })

/* ---------------------------------------------------------------------- pdf */

const [download] = await Promise.all([
  page.waitForEvent("download", { timeout: 120_000 }),
  page.getByRole("button", { name: /הורדת PDF|Download the filled PDF/ }).click(),
])
const pdfPath = await download.path()
if (!pdfPath) throw new Error("PDF download produced no file")
const pdfBytes = await Bun.file(pdfPath).arrayBuffer()
const head = new TextDecoder().decode(new Uint8Array(pdfBytes.slice(0, 5)))
if (head !== "%PDF-") throw new Error(`downloaded file is not a PDF (head=${head})`)
if (pdfBytes.byteLength < 200_000) throw new Error(`PDF too small: ${pdfBytes.byteLength}`)

const { PDFDocument } = await import("pdf-lib")
const rendered = await PDFDocument.load(new Uint8Array(pdfBytes))
if (rendered.getPageCount() !== 3) throw new Error(`expected 3 pages (form + 1 attachment), got ${rendered.getPageCount()}`)
console.log(`  → pdf: ${download.suggestedFilename()} (${Math.round(pdfBytes.byteLength / 1024)} KB)`)
await Bun.write(`${OUT}/09-filled.pdf`, new Uint8Array(pdfBytes))

/* -------------------------------------------------------------------- print */

await page.waitForTimeout(700)
await page.goto(`${ROOT}/print/`, { waitUntil: "networkidle" })
await page.waitForTimeout(800)
const printed = await page.locator("article").innerText()
if (!printed.includes("הצהרה")) throw new Error("print view missing the declaration")
if (!printed.includes("דנה")) throw new Error("print view missing the employee")
await a11y("print")
await page.screenshot({ path: `${OUT}/08-print.png`, fullPage: true })

/* ------------------------------------------------------------------ reload */

await page.goto(`${ROOT}/form/?step=2`, { waitUntil: "networkidle" })
await page.waitForTimeout(500)
const resumed = await page.locator("#step-title").innerText().catch(() => "")
if (!resumed) problems.push("reload did not restore a step")

await browser.close()
server.stop(true)

if (external.length) {
  console.error("✖ external requests:", [...new Set(external)].slice(0, 10))
  process.exit(1)
}
if (problems.length) {
  console.error("✖ problems:\n" + problems.slice(0, 25).join("\n"))
  process.exit(1)
}
console.log(`✔ full flow passed — ${OUT}`)
