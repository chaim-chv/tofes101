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
// A configurable port lets two agents run the suite in parallel without one
// killing the other's server/host process on 4173.
const PORT = Number(process.env.E2E_PORT ?? 4173)
const ROOT = `http://localhost:${PORT}${BASE}`
const OUT = "research/spikes/screens"
mkdirSync(OUT, { recursive: true })

const server = startStaticServer(PORT)
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
  // blob:/data: are in-memory previews and downloads, not network traffic.
  if (url.startsWith("blob:") || url.startsWith("data:")) return
  // The browser's own PDF viewer is an extension loading local resources
  // (triggered by the PDF attachment preview) — not app traffic either.
  if (/^(chrome|chrome-extension|devtools|edge|moz-extension|safari-web-extension):/.test(url)) return
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

/** Fill a Nuxt UI date field through its visible day/month/year segments. */
async function fillDate(fieldId: string, iso: string) {
  const [year, month, day] = iso.split("-")
  const group = page.locator(`[data-field-id="${fieldId}"]`)
  for (const [name, value] of [
    ["יום", day],
    ["חודש", month],
    ["שנה", year],
  ] as const) {
    const segment = group.getByRole("spinbutton", { name })
    await segment.click()
    await segment.pressSequentially(value)
    await page.waitForTimeout(80)
  }
}

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
await page.fill('input[inputmode="numeric"]', "900000001")
await page.click("button[type=submit]")
const link = await page.inputValue("input[readonly]")
if (!link.includes("#e=v1.")) throw new Error("employer link not generated")

/* ------------------------------------------------------------------ prefill */

await page.goto(link, { waitUntil: "networkidle" })
await page.getByRole("button", { name: "אישור והמשך" }).click()
await page.waitForTimeout(300)
const employerName = page.locator('input[autocomplete="organization"]')
if ((await employerName.getAttribute("readonly")) === null)
  throw new Error("prefilled employer name should be read-only")
if (!(await page.getByText("נעול על ידי המעסיק").first().isVisible()))
  throw new Error("prefilled field should explain that it is locked")

await a11y("employer")
await next() // employer step -> identity

/* ----------------------------------------------------------------- identity */

await page.getByRole("radio", { name: "תעודת זהות" }).click()
await page.fill("#f-employee\\.idNum", "123456782")
await page.fill("#f-employee\\.firstName", "דנה")
await page.fill("#f-employee\\.lastName", "כהן")
await fillDate("employee.birthDate", "1990-03-04")
await a11y("identity")
await next()

/* ------------------------------------------------------------------ contact */

await page.fill("#f-employee\\.city", "תל אביב - יפו")
await page.fill("#f-employee\\.street", "הרצל")
await page.fill("#f-employee\\.houseNum", "12")
await page.fill("#f-employee\\.mobile", "0501234567")
await next()

/* ------------------------------------------------------------------- status */

await page.getByRole("radio", { name: "נקבה" }).click()
await page.getByRole("radio", { name: "נשוי/אה" }).click()
await page.locator('#f-employee\\.ilResident').getByRole("radio", { name: "כן" }).click()
await page.locator('#f-employee\\.kibbutzMember').getByRole("radio", { name: "לא" }).click()
await page.locator('#f-employee\\.healthFundMember').getByRole("radio", { name: "כן" }).click()
await page.locator('#f-employee\\.healthFundName').getByRole("radio", { name: "כללית" }).click()
await page.fill("#f-spouse\\.firstName", "יוסי")
await page.fill("#f-spouse\\.lastName", "כהן")
await page.fill("#f-spouse\\.idNum", "000000018")
await fillDate("spouse.birthDate", "1988-07-01")
await page.getByRole("radio", { name: "יש לבן/בת הזוג הכנסה" }).click()
await page.getByRole("checkbox", { name: "עבודה / קצבה / עסק" }).click()
await a11y("status")
await next()

/* ----------------------------------------------------------------- children */

await page.getByRole("button", { name: "הוספת ילד/ה" }).click()
await page.fill('[id^="f-children.name"]', "נועה")
await page.fill('[id^="f-children.idNum"]', "000000026")
await fillDate("children.birthDate", "2016-05-10")
await page.getByRole("checkbox", { name: "הילד/ה נמצא/ת בחזקתי" }).click()
await next()

/* ------------------------------------------------------------------- income */

await page.getByRole("checkbox", { name: "משכורת חודש" }).click()
await fillDate("income.startDate", "2026-01-01")
await page.getByRole("radio", { name: "אין לי הכנסות אחרות" }).click()
await a11y("income")
await next()

/* ------------------------------------------------------------------ credits */

await page.getByRole("checkbox", { name: "7. בגין ילדיי שבחזקתי (מחלק ג׳)" }).click()
// A credit whose proof the app cannot carry: the documents block must mark it
// "hand to employer", not pretend it is attached.
await page.getByRole("button", { name: /עוד סעיפים/ }).click()
await page.getByRole("checkbox", { name: "15. סיום תואר אקדמי, התמחות או לימודי מקצוע" }).click()
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
await page.locator('input[type=file]').first().setInputFiles(idPng)
await page.waitForTimeout(600)

// The realistic second document: front, back and ספח scanned into ONE PDF.
// All three pages must reach the downloaded PDF, not just the first.
const { PDFDocument } = await import("pdf-lib")
const scan = await PDFDocument.create()
for (let i = 0; i < 3; i++) {
  const sheet = scan.addPage([400, 600])
  sheet.drawText(`annex page ${i + 1}`, { x: 24, y: 24, size: 12 })
}
const annexPdf = ".data/e2e-upload-annex.pdf"
mkdirSync(".data", { recursive: true })
await Bun.write(annexPdf, await scan.save())
await page.locator('input[type=file]').nth(1).setInputFiles(annexPdf)
await page.waitForTimeout(600)
await a11y("attach")
await next()

/* ------------------------------------------------------- finish (review+sign) */

// Both scans must be visible (and previewable) on the signing screen, not only
// in the PDF download — and the multi-page PDF must report all its pages.
await page.getByText("_upload-id.png").first().waitFor({ timeout: 5000 })
await page.getByText("e2e-upload-annex.pdf").first().waitFor({ timeout: 5000 })
await page.getByText("כל 3 העמודים ייכללו ב-PDF").first().waitFor({ timeout: 5000 })
if (!(await page.getByText("מצורף", { exact: true }).first().isVisible()))
  throw new Error("the attached ID should be reported as attached")
await page.getByText("למסור למעסיק").first().waitFor({ timeout: 5000 })
if (!(await page.getByText("מצורפים: 1 מתוך 2").isVisible()))
  throw new Error("documents summary should count the attached ID and the hand-over proof")
// The documents block must sit before the declaration/signature, not after it.
const docsBeforeSignature = await page.evaluate(() => {
  const docs = document.querySelector("#docs-title")
  const signature = document.querySelector("#f-sign\\.signature")
  if (!docs || !signature) return false
  return (docs.compareDocumentPosition(signature) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
})
if (!docsBeforeSignature) throw new Error("documents section should come before the signature")
const reviewText = await page.locator("main").innerText()
if (!reviewText.includes("דנה")) throw new Error("finish missing the employee name")
if (!reviewText.includes("נועה")) throw new Error("finish missing the child")
await a11y("finish")
await page.screenshot({ path: `${OUT}/06-review.png`, fullPage: true })

/* --------------------------------------------------------------------- sign */

await page.getByRole("tab", { name: "הקלדת שם" }).click()
await page.fill("#typed-signature", "דנה כהן")
await page.getByRole("button", { name: "חתימה", exact: true }).click()
// The form fills the signing date as soon as a signature exists; typing into
// the date segments on top of it would clear the field.
await page.waitForTimeout(600)
await a11y("finish-signed")

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

const rendered = await PDFDocument.load(new Uint8Array(pdfBytes))
if (rendered.getPageCount() !== 6)
  throw new Error(`expected 6 pages (2 form + 1 image + 3 PDF pages), got ${rendered.getPageCount()}`)
console.log(`  → pdf: ${download.suggestedFilename()} (${Math.round(pdfBytes.byteLength / 1024)} KB)`)
await page.waitForTimeout(500)
if (!(await page.getByText("הקובץ מוכן").isVisible().catch(() => false)))
  throw new Error("completion panel did not appear after the download")
await a11y("complete")
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
