import fs from 'node:fs'
const p1=JSON.parse(fs.readFileSync('agent-workspace/agents/pdf-overlay-e5/page1.json','utf8'))
const label=p1.filter(i=>i.text.includes('עבודה/קצבה/עסק') && i.y>=720 && i.y<=730)
console.log('labels',label)
const glyphs=p1.filter(i=>i.text.trim()==='q')
console.log('glyphs',glyphs)
const c=label[0]; const cx=c.x+c.w/2, cy=c.y
for(const g of glyphs) console.log(g, Math.hypot(g.x+g.w/2-cx, g.y-cy))
