import { getDocument, OPS } from '/Users/chv/develop/tofes101/research/spikes/pdf/node_modules/pdfjs-dist/legacy/build/pdf.mjs'
import fs from 'node:fs'
const data = new Uint8Array(fs.readFileSync('/Users/chv/develop/tofes101/public/assets/tofes-101-official.pdf'))
const doc = await getDocument({ data, useSystemFonts: false }).promise
function mul(m,n){return [m[0]*n[0]+m[1]*n[2],m[0]*n[1]+m[1]*n[3],m[2]*n[0]+m[3]*n[2],m[2]*n[1]+m[3]*n[3],m[4]*n[0]+m[5]*n[2]+n[4],m[4]*n[1]+m[5]*n[3]+n[5]]}
function apply(m,x,y){return [m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5]]}
for (const pnum of [1,2]) {
  const page = await doc.getPage(pnum)
  const vp = page.getViewport({scale:1})
  const ol = await page.getOperatorList()
  let ctm=[1,0,0,1,0,0]
  const stack=[]
  const paths=[]
  for(let i=0;i<ol.fnArray.length;i++){
    const fn=ol.fnArray[i], args=ol.argsArray[i]
    if(fn===OPS.save) stack.push(ctm.slice())
    else if(fn===OPS.restore) ctm=stack.pop()||[1,0,0,1,0,0]
    else if(fn===OPS.transform) ctm=mul(ctm,args)
    else if(fn===OPS.constructPath){
      const buf=args[1][0]; let j=0; const pts=[]
      while(j<buf.length){
        const op=buf[j++]
        if(op===0||op===1){const x=buf[j++],y=buf[j++]; const p=apply(ctm,x,y); pts.push([+p[0].toFixed(1),+(vp.height-p[1]).toFixed(1)])}
        else if(op===2){j+=6}
        else if(op===3||op===4){j+=4}
        else if(op===5){}
        else { break }
      }
      if(pts.length) paths.push(pts)
    }
  }
  // detect axis-aligned rect paths (4 distinct corners)
  const rects=[]
  for(const pts of paths){
    const xs=[...new Set(pts.map(p=>p[0]))], ys=[...new Set(pts.map(p=>p[1]))]
    if(xs.length===2&&ys.length===2){
      const x1=Math.min(...xs),x2=Math.max(...xs),y1=Math.min(...ys),y2=Math.max(...ys)
      if(x2-x1>8&&y2-y1>6) rects.push({x1,x2,y1,y2})
    }
  }
  fs.writeFileSync(`agent-workspace/agents/pdf-overlay-e5/page${pnum}-rects.json`, JSON.stringify(rects,null,0))
  console.log('page',pnum,'paths',paths.length,'rects',rects.length)
  if(pnum===1) for(const r of rects.sort((a,b)=>a.y1-b.y1)) console.log(JSON.stringify(r))
}
