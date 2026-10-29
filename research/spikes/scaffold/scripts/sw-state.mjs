import { chromium } from 'playwright'
const b = await chromium.launch({ channel: 'chrome' })
const ctx = await b.newContext()
const p = await ctx.newPage()
ctx.on('serviceworker', w => { console.log('SW', w.url()); w.on('close', () => console.log('SW closed')) })
p.on('console', m => console.log('CONSOLE', m.type(), m.text()))
p.on('pageerror', e => console.log('PAGEERR', String(e)))
await p.goto('http://localhost:3013/', { waitUntil: 'load' })
const out = await p.evaluate(async () => {
  const reg = await navigator.serviceWorker.register('/sw.js')
  const states = []
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500))
    states.push({ a: reg.active?.state, i: reg.installing?.state, w: reg.waiting?.state, n: (await navigator.serviceWorker.getRegistrations()).length })
    if (reg.active?.state === 'activated' || reg.installing?.state === 'redundant') break
  }
  return { scope: reg.scope, states }
})
console.log(JSON.stringify(out, null, 1))
await b.close()
