const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('moment-sync-runtime.js','utf8');
const m=src.match(/  async function hasRemoteNewer\(id,baseUpdatedAt\)\{[\s\S]*?\n  \}/);
assert(m,'production hasRemoteNewer missing');
let row={id:'x',updated_at:'2026-01-01T00:00:05Z',deleted_at:'2026-01-01T00:00:05Z',payload:{id:'x',updatedAt:'2026-01-01T00:00:05Z',contentUpdatedAt:'2026-01-01T00:00:01Z',deletedAt:'2026-01-01T00:00:05Z'}};
const ctx={configured:()=>true,navigator:{onLine:true},pull:async()=>[row],fromRemote:r=>r.payload};
vm.createContext(ctx);vm.runInContext(m[0].trim()+';this.hasRemoteNewer=hasRemoteNewer;',ctx);
(async()=>{
 assert.equal(await ctx.hasRemoteNewer('x','2026-01-01T00:00:01Z'),true,'newer remote deletion must block stale edit');
 row.payload={...row.payload,deletedAt:null,updatedAt:'2026-01-01T00:00:05Z',contentUpdatedAt:'2026-01-01T00:00:01Z'};
 assert.equal(await ctx.hasRemoteNewer('x','2026-01-01T00:00:01Z'),false,'photo-only updatedAt bump must not cause content conflict');
 console.log('CF4 REMOTE DELETE CONFLICT: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
