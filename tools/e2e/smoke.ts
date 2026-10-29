/**
 * End-to-end smoke test for the static build.
 *
 *   bun run build && bun run e2e
 *
 * Starts a tiny static server on .output/public, then drives Chrome:
 *  - home renders in RTL
 *  - employer builder produces a link
 *  - the link prefills the form and the accept card appears
 *  - no console errors, no external requests
 *
 * Screenshots land in research/spikes/screens/.
 */
import { chromium, type Page } from "playwright"
import { mkdirSync } from "node:fs"
import { startStaticServer } from "../serve"

const ROOT = "http://localhost:4173"
const OUT = "research/spikes/screens"
mkdirSync(OUT, { recursive: true })

const external: string[] = []
const errors: string[] = []

function watch(page: Page) {
  page.on("pageerror", (e) => errors.push(`${page.url()} :: ${e.message}`))
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`${page.url()} :: console :: ${m.text()}`)
  })
  page.on("request", (r) => {
    const u = new URL(r.url())
    if (!["localhost", "127.0.0.1"].includes(u.hostname)) external.push(r.url())
  })
}

const server = startStaticServer(4173)
const browser = await chromium.launch({ channel: "chrome" })
const ctx = await browser.newContext({ locale: "he-IL", viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()
watch(page)

await page.goto(`${ROOT}/`, { waitUntil: "networkidle" })
const dir = await page.evaluate(() => document.documentElement.dir)
if (dir !== "rtl") throw new Error(`expected dir=rtl, got ${dir}`)
await page.screenshot({ path: `${OUT}/01-home.png`, fullPage: true })

await page.goto(`${ROOT}/employer`, { waitUntil: "networkidle" })
await page.fill('input[autocomplete="organization"]', 'חברת אקמה בע"מ')
await page.fill('input[autocomplete="street-address"]', "רחוב הרצל 1, תל אביב")
await page.fill('input[autocomplete="tel"]', "03-1234567")
await page.fill('input[inputmode="numeric"]', "912345678")
await page.click("button[type=submit]")
const link = await page.inputValue("input[readonly]")
if (!link.includes("#e=v1.")) throw new Error(`unexpected employer link: ${link.slice(0, 60)}`)
await page.screenshot({ path: `${OUT}/02-employer.png`, fullPage: true })

await page.goto(link, { waitUntil: "networkidle" })
const prefill = page.getByText("הוזנו מראש")
if (!(await prefill.count())) throw new Error("prefill accept card did not render")
await page.screenshot({ path: `${OUT}/03-form-prefill.png`, fullPage: true })
await page.getByText("אישור והמשך").click()
const locked = await page.locator('input[autocomplete="organization"]').isDisabled()
if (!locked) throw new Error("employer name should be locked when the employer locked it")

await browser.close()
server.stop(true)

if (external.length) {
  console.error("✖ external requests:", external.slice(0, 10))
  process.exit(1)
}
if (errors.length) {
  console.error("✖ console/page errors:\n" + errors.slice(0, 20).join("\n"))
  process.exit(1)
}
console.log("✔ e2e smoke passed — screenshots in " + OUT)
