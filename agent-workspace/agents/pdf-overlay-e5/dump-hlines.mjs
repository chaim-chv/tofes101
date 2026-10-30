import { getDocument, OPS } from '/Users/chv/develop/tofes101/research/spikes/pdf/node_modules/pdfjs-dist/legacy/build/pdf.mjs'
import fs from 'node:fs'
const data = new Uint8Array(fs.readFileSync('/Users/chv/develop/tofes101/public/assets/tofes-101-official.pdf'))
const doc = await getDocument({ data, useSystemFonts: false }).promise
const page = await doc.getPage(2)
const vp = page.getViewport({scale:1}); const ol=await page.getOperatorList()
let ctm=[1,0,0,1,0,0]; const stack=[]; const segs=[]
function mul(m,n){return [m[0]*n[0]+m[1]*n[2],m[0]*n[1]+m[1]*n[3],m[2]*n[0]+m[3]*n[2],m[2]*n[1]+m[3]*n[3],m[4]*n[0]+m[5]*n[2]+n[4],m[4]*n[1]+m[5]*n[3]+n[5]]}
function apply(m,x,y){return [m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5]]}
for(let i=0;i<ol.fnArray.length;i++){
  const fn=ol.fnArray[i], args=ol.argsArray[i]
  if(fn===OPS.save) stack.push(ctm.slice()); else if(fn===OPS.restore) ctm=stack.pop()||[1,0,0,1,0,0]
  else if(fn===OPS.transform) ctm=mul(ctm,args)
  else if(fn===OPS.constructPath){ const buf=args[1][0]; let j=0; const pts=[]
    while(j<buf.length){ const op=buf[j++]
      if(op===0||op===1){const x=buf[j++],y=buf[j++]; const p=apply(ctm,x,y); pts.push([+p[0].toFixed(1),+(vp.height-p[1]).toFixed(1)])}
      else if(op===2)j+=6; else if(op===3||op===4)j+=4; else if(op===5){} else break }
    for(let k=0;k<pts.length-1;k++) segs.push([pts[k],pts[k+1]])
  }
}
const horz=segs.filter(([a,b])=>Math.abs(a[1]-b[1])<0.8 && Math.abs(a[0]-b[0])>4)
console.log('HORZ y 95-140:')
for(const [a,b] of horz.filter(([a])=>a[1]>95&&a[1]<140).sort((x,y)=>x[0][1]-y[0][1]||x[0][0]-y[0][0])) console.log(a[1], Math.min(a[0],b[0]), Math.max(a[0],b[0]))
console.log('HORZ y 130-150:')
for(const [a,b] of horz.filter(([a])=>a[1]>130&&a[1]<150).sort((x,y)=>x[0][1]-y[0][1]||x[0][0]-y[0][0])) console.log(a[1], Math.min(a[0],b[0]), Math.max(a[0],b[0]))
