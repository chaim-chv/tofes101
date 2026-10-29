import fs from 'node:fs'
import { generate } from '@pdfme/generator'
import { text } from '@pdfme/schemas'
const b64=fs.readFileSync('../scaffold/app/assets/fonts/Heebo-Variable.ttf').toString('base64')
const template={ basePdf:{width:210,height:297,padding:[15,15,15,15]}, schemas:[[
  {name:'t1',type:'text',position:{x:15,y:15},width:120,height:20,fontSize:14,alignment:'right'},
  {name:'t2',type:'text',position:{x:15,y:40},width:120,height:20,fontSize:14,alignment:'right'}
]]}
const inputs=[{t1:'שלום עולם 123',t2:'דוד כהן — Hello 2026'}]
try {
  const pdf=await generate({template,inputs,plugins:{text},options:{font:{Heebo:{data:b64,fallback:true}}}})
  fs.writeFileSync('out/pdfme-hebrew.pdf',Buffer.from(pdf)); console.log('ok',pdf.byteLength)
} catch(e){ console.error('ERR',e.message) }
