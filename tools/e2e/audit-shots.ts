/**
 * UX audit screenshot pass (development only, not CI).
 * Captures every screen at desktop and mobile widths so the UX can be reviewed
 * visually. Run against a dev server:
 *   bun run dev --port 3030 &   then   bun run tools/e2e/audit-shots.ts
 */
import { chromium, type Page } from "playwright"
import { mkdirSync } from "node:fs"

const ROOT = process.env.AUDIT_BASE ?? "http://localhost:3030"
const OUT = "research/ux-audit"
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: "chrome" }).catch(() => chromium.launch())

async function shot(page: Page, name: string, fullPage = true) {
  await page.waitForTimeout(500)
  await page.addStyleTag({ content: "nuxt-devtools, #nuxt-devtools-container, [data-v-inspector] { display: none !important }" }).catch(() => {})
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage })
}

async function desktopPass() {
  const ctx = await browser.newContext({ locale: "he-IL", viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()

  await page.goto(`${ROOT}/`, { waitUntil: "networkidle" })
  await shot(page, "01-home-desktop")

  await page.goto(`${ROOT}/employer/`, { waitUntil: "networkidle" })
  await shot(page, "02-employer-empty")

  await page.fill('input[autocomplete="organization"]', 'חברת אקמה בע"מ')
  await page.fill('input[autocomplete="street-address"]', "רחוב הרצל 1, תל אביב")
  await page.fill('input[autocomplete="tel"]', "03-1234567")
  await page.fill('input[inputmode="numeric"]', "900000001")
  await page.click("button[type=submit]")
  await shot(page, "03-employer-result")

  const link = await page.inputValue("input[readonly]")

  await page.goto(`${ROOT}/form/`, { waitUntil: "networkidle" })
  await shot(page, "04-form-intro")

  await page.goto("about:blank")
  await page.goto(link, { waitUntil: "networkidle" })
  await page.getByText("הוזנו מראש").waitFor({ timeout: 15000 })
  await shot(page, "05-form-prefill")
  await page.getByRole("button", { name: "אישור והמשך" }).click()
  await shot(page, "06-step-employer")

  const next = async (name: string) => {
    await page.getByRole("button", { name: "המשך" }).click()
    await page.waitForTimeout(350)
    await shot(page, name)
  }

  await next("07-step-identity")
  await page.getByRole("radio", { name: "תעודת זהות" }).check()
  await page.fill("#f-employee\\.idNum", "123456782")
  await page.fill("#f-employee\\.firstName", "דנה")
  await page.fill("#f-employee\\.lastName", "כהן")
  await page.fill("#f-employee\\.birthDate", "1990-03-04")
  await next("08-step-contact")
  await page.fill("#f-employee\\.city", "תל אביב - יפו")
  await page.fill("#f-employee\\.street", "הרצל")
  await page.fill("#f-employee\\.houseNum", "12")
  await page.fill("#f-employee\\.mobile", "0501234567")
  await next("09-step-status")
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
  await next("10-step-children")
  await page.getByRole("button", { name: "הוספת ילד/ה" }).click()
  await page.fill('[id^="f-children.name"]', "נועה")
  await page.fill('[id^="f-children.idNum"]', "000000026")
  await page.fill('[id^="f-children.birthDate"]', "2016-05-10")
  await page.getByRole("checkbox", { name: "הילד/ה נמצא/ת בחזקתי" }).check()
  await next("11-step-income")
  await page.getByRole("checkbox", { name: "משכורת חודש" }).check()
  await page.fill("#f-income\\.startDate", "2026-01-01")
  await page.getByRole("radio", { name: "אין לי הכנסות אחרות" }).check()
  await next("12-step-credits")
  await page.getByRole("checkbox", { name: "7. בגין ילדיי שבחזקתי (מחלק ג׳)" }).check()
  await next("13-step-attach")
  await next("14-step-review")
  await next("15-step-sign")

  // error state: clear a required answer, then jump back
  await page.goto(`${ROOT}/print/`, { waitUntil: "networkidle" })
  await shot(page, "16-print")

  // mobile width
  const mctx = await browser.newContext({ locale: "he-IL", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const m = await mctx.newPage()
  await m.goto(`${ROOT}/`, { waitUntil: "networkidle" })
  await shot(m, "20-home-mobile")
  await m.goto(`${ROOT}/form/`, { waitUntil: "networkidle" })
  await shot(m, "21-form-intro-mobile")
  await m.goto("about:blank")
  await m.goto(link, { waitUntil: "networkidle" })
  await m.getByText("הוזנו מראש").waitFor({ timeout: 15000 })
  await shot(m, "22-form-prefill-mobile")
  await m.getByRole("button", { name: "אישור והמשך" }).click()
  await shot(m, "23-step-employer-mobile")
  await m.goto(`${ROOT}/employer/`, { waitUntil: "networkidle" })
  await shot(m, "24-employer-mobile")

  await ctx.close()
  await mctx.close()
}

await desktopPass()
await browser.close()
console.log("shots written to", OUT)
