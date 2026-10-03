const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('moments.js','utf8');
function extract(name,next){
 const start=src.indexOf(`  function ${name}`); assert(start>=0,`${name} missing`);
 const end=src.indexOf(`  function ${next}`,start); assert(end>start,`${next} boundary missing`);
 return src.slice(start,end).trim();
}
const code=extract('momentContentVersion','isMomentSaveSessionCurrent')+'\n'+extract('commitMomentEdit','currentMomentParty');
const ctx={};vm.createContext(ctx);vm.runInContext(code+';this.commitMomentEdit=commitMomentEdit;',ctx);
const old={id:'A',createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:01Z',contentUpdatedAt:'2026-01-01T00:00:01Z',text:'old',createdBy:'Lee'};
const delivered={id:'B',createdAt:'2026-01-01T00:00:02Z',updatedAt:'2026-01-01T00:00:02Z',text:'sync delivered'};
let r=ctx.commitMomentEdit([old,delivered],'A',old.contentUpdatedAt,{text:'edited',createdBy:'Lee'},'2026-01-01T00:00:03Z');
assert(r.ok);assert.equal(r.arr.length,2,'live sync-delivered record must survive save');assert.equal(r.arr.find(x=>x.id==='A').text,'edited');
r=ctx.commitMomentEdit([{...old,contentUpdatedAt:'2026-01-01T00:00:04Z',updatedAt:'2026-01-01T00:00:04Z'}],'A',old.contentUpdatedAt,{text:'stale'},'2026-01-01T00:00:05Z');
assert(!r.ok&&r.reason==='changed','newer content revision must block stale edit');
r=ctx.commitMomentEdit([{...old,updatedAt:'2026-01-01T00:00:04Z',photoUrl:'photo.jpg'}],'A',old.contentUpdatedAt,{text:'edited after photo'},'2026-01-01T00:00:05Z');
assert(r.ok,'photo-only updatedAt bump must not create false content conflict');
assert(src.includes('momentSavePendingSessions.has(momentEditorSession)'),'double-tap Save lock missing');
assert(src.includes('if(!isMomentSaveSessionCurrent(sessionAtStart,editingIdAtStart)) return;'),'late editor-session guard missing');
assert((src.match(/arr=readJson\(STORAGE_CONFIG\.keys\.momentsList,\[\]\)/g)||[]).length>=2,'save must re-read live collection after awaits');
console.log('CF3 MOMENT SAVE BEHAVIOUR: PASS');
