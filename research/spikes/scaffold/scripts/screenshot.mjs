// Usage: node research/spikes/scaffold/scripts/screenshot.mjs http://localhost:3011 out.png
import { chromium } from 'playwright'

const url = process.argv[2] || 'http://localhost:3011/'
const out = process.argv[3] || 'screenshot.png'

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 })
const external = []
const failed = []
page.on('request', (r) => {
  const u = new URL(r.url())
  if (!['localhost', '127.0.0.1'].includes(u.hostname) && u.protocol !== 'data:') external.push(r.url())
})
page.on('requestfailed', (r) => failed.push([r.url(), r.failure()?.errorText]))
await page.goto(url, { waitUntil: 'networkidle' })
await page.screenshot({ path: out, fullPage: true })
console.log(JSON.stringify({
  title: await page.title(),
  htmlAttrs: await page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir })),
  fontsUsed: await page.evaluate(() => [...document.fonts].map(f => `${f.family} ${f.status}`)),
  external, failed
}, null, 2))
await browser.close()
