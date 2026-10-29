import { chromium } from 'playwright'
const b = await chromium.launch({ channel: 'chrome' })
const p = await (await b.newContext()).newPage()
p.on('console', m => console.log('CONSOLE', m.type(), m.text()))
p.on('pageerror', e => console.log('PAGEERR', String(e)))
await p.goto('http://localhost:3013/', { waitUntil: 'networkidle' })
const r = await p.evaluate(async () => {
  try { const reg = await navigator.serviceWorker.register('/sw.js'); return { ok: true, scope: reg.scope, state: reg.active?.state ?? reg.installing?.state } }
  catch (e) { return { ok: false, err: String(e) } }
})
console.log('manual register', JSON.stringify(r))
await p.waitForTimeout(3000)
console.log('regs', await p.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length))
await b.close()
