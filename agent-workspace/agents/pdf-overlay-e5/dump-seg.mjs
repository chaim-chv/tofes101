import { getDocument, OPS } from '/Users/chv/develop/tofes101/research/spikes/pdf/node_modules/pdfjs-dist/legacy/build/pdf.mjs'
import fs from 'node:fs'
const data = new Uint8Array(fs.readFileSync('/Users/chv/develop/tofes101/public/assets/tofes-101-official.pdf'))
const doc = await getDocument({ data, useSystemFonts: false }).promise
function mul(m,n){return [m[0]*n[0]+m[1]*n[2],m[0]*n[1]+m[1]*n[3],m[2]*n[0]+m[3]*n[2],m[2]*n[1]+m[3]*n[3],m[4]*n[0]+m[5]*n[2]+n[4],m[4]*n[1]+m[5]*n[3]+n[5]]}
function apply(m,x,y){return [m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5]]}
const pnum=1
const page = await doc.getPage(pnum)
const vp = page.getViewport({scale:1})
const ol = await page.getOperatorList()
let ctm=[1,0,0,1,0,0]; const stack=[]; const segs=[]
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
      else if(op===2){j+=6} else if(op===3||op===4){j+=4} else if(op===5){} else break
    }
    if(pts.length===4 && pts[0][0]===pts[3][0] && pts[0][1]===pts[3][1]) {
      for(let k=0;k<3;k++) segs.push([pts[k],pts[k+1]])
    } else if(pts.length===2) segs.push([pts[0],pts[1]])
    else if(pts.length>2){ for(let k=0;k<pts.length-1;k++) segs.push([pts[k],pts[k+1]]) }
  }
}
const vert=segs.filter(([a,b])=>Math.abs(a[0]-b[0])<0.6 && Math.abs(a[1]-b[1])>5)
const horz=segs.filter(([a,b])=>Math.abs(a[1]-b[1])<0.6 && Math.abs(a[0]-b[0])>5)
function inRange(y,a,b){return y>=a&&y<=b}
console.log('VERT in employer row 154-186:')
console.log([...new Set(vert.filter(([a])=>inRange((a[1]),150,190)).map(([a])=>Math.round(a[0]*10)/10))].sort((a,b)=>a-b))
console.log('HORZ around employer row:')
console.log([...new Set(horz.filter(([a])=>a[0]>25&&a[0]<545).filter(([a])=>inRange(a[1],140,210)).map(([a])=>Math.round(a[1]*10)/10))].sort((a,b)=>a-b))
console.log('VERT identity 210-330:')
console.log([...new Set(vert.filter(([a])=>inRange(a[1],205,335)).map(([a])=>Math.round(a[0]*10)/10))].sort((a,b)=>a-b))
console.log('HORZ identity 205-335:')
console.log([...new Set(horz.filter(([a])=>a[0]>26&&a[0]<545).filter(([a])=>inRange(a[1],205,335)).map(([a])=>Math.round(a[1]*10)/10))].sort((a,b)=>a-b))
