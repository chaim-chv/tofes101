// Offline verification: load once, wait for service worker, go offline, reload.
import { chromium } from 'playwright'

const url = process.argv[2] || 'http://localhost:3013/'
const browser = await chromium.launch({ channel: 'chrome' })
const ctx = await browser.newContext()
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto(url, { waitUntil: 'networkidle' })

const sw = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.ready
  return { scope: reg.scope, active: !!reg.active, controlled: !!navigator.serviceWorker.controller }
})

await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 }).catch(() => {})
await ctx.setOffline(true)
let reloadOk = false
try {
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 })
  reloadOk = (await page.locator('h1').innerText()).includes('טופס 101')
} catch (e) {
  errors.push('reload: ' + e.message)
}
await ctx.setOffline(false)
console.log(JSON.stringify({ sw, reloadOk, controlledAfter: await page.evaluate(() => !!navigator.serviceWorker.controller), errors }, null, 2))
await browser.close()
