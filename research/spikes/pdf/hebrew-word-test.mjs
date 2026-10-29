import fs from 'node:fs'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { drawRtl } from './lib/rtl-tokens.mjs'
const fb=fs.readFileSync('../scaffold/app/assets/fonts/Heebo-Variable.ttf')
const doc=await PDFDocument.create(); doc.registerFontkit(fontkit)
const f=await doc.embedFont(fb,{subset:true})
const p=doc.addPage([300,120])
drawRtl(p,f,'כהן',{xRight:260,y:40,size:40,color:rgb(0,0,0)})
fs.writeFileSync('out/word.pdf',await doc.save())
