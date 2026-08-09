const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync('core-runtime.js','utf8');
const mem=new Map();
function classList(){return{add(){},remove(){},contains(){return false}}}
const modal={classList:classList(),querySelector(){return null}};
const c={globalThis:null,window:null,
 TRIP_CONFIG:{participants:{defaultKey:'solo',order:['solo'],identities:{solo:{code:'ME',name:'Solo'}}}},
 STORAGE:{local:{get:(k,f)=>mem.has(k)?mem.get(k):f,set:(k,v)=>mem.set(k,v)}},STORAGE_CONFIG:{keys:{friend:'friend'}},
 document:{readyState:'loading',addEventListener(){},querySelectorAll(){return[]},querySelector(){return null},
   getElementById(id){return id==='mamaModal'?modal:null},documentElement:{removeAttribute(){},dataset:{}},body:{classList:classList()}},
 location:{hash:'',pathname:'/',search:''},history:{replaceState(){}},requestAnimationFrame:f=>f(),setTimeout:()=>0,
 addEventListener(){},CustomEvent:function(){}};c.window=c;c.globalThis=c;
vm.runInNewContext(code,c,{filename:'core-runtime.js'});
assert.deepEqual(Array.from(c.selectableFriendKeys()),['solo']);
assert.equal(c.hasSingleSelectableFriend(),true);
assert.equal(c.ensureFriendIdentity(),false);
assert.equal(mem.get('friend'),'solo');
console.log('STAGE 1 SOLO PARTY CONTRACT: PASS');