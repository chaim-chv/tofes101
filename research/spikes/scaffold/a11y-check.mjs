import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const b = await chromium.launch({ channel: 'chrome' })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } })
const p = await ctx.newPage()
await p.goto(process.argv[2] || 'http://localhost:3013/', { waitUntil: 'networkidle' })
const r = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
console.log(JSON.stringify({
  violations: r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n=>({target:n.target, summary:n.failureSummary})).slice(0,4), help: v.help })),
  passes: r.passes.length,
  incomplete: r.incomplete.map(v => v.id)
}, null, 2))
await b.close()
