import { chromium } from 'playwright'
const b = await chromium.launch({ channel: 'chrome' })
const ctx = await b.newContext()
const p = await ctx.newPage()
const msgs = []
p.on('console', m => { if (m.type() === 'error') msgs.push(m.text()) })
p.on('pageerror', e => msgs.push('PAGEERR ' + String(e)))
await p.goto('http://localhost:3013/', { waitUntil: 'networkidle' })
await p.fill('input[placeholder="ישראל"]', 'דוד')
await p.click('button[type="submit"]').catch(() => {})
await p.waitForTimeout(800)
console.log(JSON.stringify({ errors: msgs, value: await p.inputValue('input[placeholder="ישראל"]'), title: await p.title() }, null, 2))
await b.close()
