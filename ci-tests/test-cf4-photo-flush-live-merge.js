const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('moment-sync-runtime.js','utf8');
const m=src.match(/  async function flushPhotos\(\)\{[\s\S]*?\n  \}\n\n  function reconcileCommit/);
assert(m,'production flushPhotos missing');
const fn=m[0].replace(/\n\n  function reconcileCommit[\s\S]*$/,'');
let store=[{id:'ph',text:'orig',createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:01Z',contentUpdatedAt:'2026-01-01T00:00:01Z',photoPending:true}];
let deleted=false;
const ctx={console,LOG:'[test]',getPendingPhotos:async()=>[{id:'ph',blob:{}}],uploadPhoto:async()=>{
  // Genuine in-flight mutation: user edits ph and creates another Moment while upload awaits.
  store=[{...store[0],text:'edited-during-upload',contentUpdatedAt:'2026-01-01T00:00:03Z',updatedAt:'2026-01-01T00:00:03Z'},
         {id:'new',text:'new-during-upload',createdAt:'2026-01-01T00:00:02Z',updatedAt:'2026-01-01T00:00:02Z'}];
  return {photoUrl:'https://x/photo.jpg',photoPath:'p/ph.jpg'};
},readLocal:()=>JSON.parse(JSON.stringify(store)),writeLocal:v=>{store=JSON.parse(JSON.stringify(v));},deletePendingPhoto:async()=>{deleted=true;},photoErrorMessage:e=>String(e)};
vm.createContext(ctx);vm.runInContext(fn+';this.flushPhotos=flushPhotos;',ctx);
(async()=>{await ctx.flushPhotos();
 assert.equal(store.find(x=>x.id==='ph').text,'edited-during-upload','photo flush must preserve concurrent edit');
 assert(store.some(x=>x.id==='new'),'photo flush must preserve concurrent new Moment');
 assert.equal(store.find(x=>x.id==='ph').photoUrl,'https://x/photo.jpg','photo result must patch live record');
 assert(deleted,'pending photo should clear after local metadata commit');
 console.log('CF4 PHOTO FLUSH LIVE MERGE: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
