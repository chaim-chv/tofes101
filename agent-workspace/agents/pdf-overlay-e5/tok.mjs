import bidiFactory from 'bidi-js'
const bidi=bidiFactory()
const MIRROR=new Map([['(',')'],[')','('],['[',']'],[']','['],['{','}'],['}','{'],['<','>'],['>','<'],['«','»'],['»','«'],['‹','›'],['›','‹']])
function rtlTokens(text,base='rtl'){
 const {levels}=bidi.getEmbeddingLevels(text,base)
 const runs=[]; let start=0
 for(let i=1;i<=text.length;i++){ if(i===text.length||(levels[i]&1)!==(levels[start]&1)){runs.push({text:text.slice(start,i),rtl:(levels[start]&1)===1}); start=i} }
 const pieces=[]
 for(const run of runs){ if(!run.rtl){pieces.push(run.text);continue}
  for(const part of run.text.split(/(\s+)/)){ if(!part)continue; pieces.push([...part].map(c=>MIRROR.get(c)??c).join('')) } }
 return pieces
}
for(const s of ['שלום עולם','12345','שלום עולם 123','סכום (12,345) ש״ח','דוד כהן — Hello 2026','']) console.log(JSON.stringify(s),'=>',JSON.stringify(rtlTokens(s)))
