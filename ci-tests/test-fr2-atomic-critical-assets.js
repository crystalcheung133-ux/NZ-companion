const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('sw.js','utf8');
const a=src.indexOf('async function cachedAsset');
const b=src.indexOf('\nasync function networkFirst',a);
assert(a>=0&&b>a,'FR2 critical-asset wiring missing');
const code=src.slice(a,b);
const store=new Map();
const key=r=>new URL(typeof r==='string'?r:r.url,'https://trip.test/').pathname.split('/').pop();
const caches={
  match:async r=>store.get(key(r))||null,
  open:async()=>({put:async(r,v)=>store.set(key(r),v)})
};
let fetchCount=0,nextFetch=null;
const ctx={URL,Response,Request,caches,CACHE_NAME:'test',fetch:async()=>{fetchCount++; if(nextFetch instanceof Error)throw nextFetch; return nextFetch;}};
vm.createContext(ctx);vm.runInContext(code+';this.cachedAsset=cachedAsset;this.validCriticalAssetResponse=validCriticalAssetResponse;this.criticalAssetResponse=criticalAssetResponse;',ctx);
function resp(body,status,type){return new Response(body,{status,headers:{'content-type':type}})}
(async()=>{
  // A coherent precached release must win even if the network is broken/hostile.
  store.set('trip-runtime.js',resp('window.TRIP_OK=1;',200,'application/javascript'));
  nextFetch=resp('<!doctype html><h1>portal</h1>',200,'text/html'); fetchCount=0;
  let r=await ctx.criticalAssetResponse(new Request('https://trip.test/trip-runtime.js?v=release'));
  assert.equal(await r.text(),'window.TRIP_OK=1;'); assert.equal(fetchCount,0,'precache must prevent per-page network mixing');

  // Missing cache + healthy JS may recover from network and be cached.
  store.delete('script.js'); nextFetch=resp('window.DAYS_OK=1;',200,'application/javascript'); fetchCount=0;
  r=await ctx.criticalAssetResponse(new Request('https://trip.test/script.js?v=release'));
  assert.equal(await r.text(),'window.DAYS_OK=1;'); assert.equal(fetchCount,1); assert(store.has('script.js'));

  // 404, 500 and HTML masquerading as JS must never be executed.
  for(const bad of [resp('no',404,'application/javascript'),resp('oops',500,'application/javascript'),resp('<html>login</html>',200,'text/html')]){
    store.delete('moments.js'); nextFetch=bad;
    r=await ctx.criticalAssetResponse(new Request('https://trip.test/moments.js'));
    assert.equal(r.status,503); assert((r.headers.get('content-type')||'').includes('javascript'));
  }

  // CSS receives the same atomic/fallback treatment.
  store.set('styles.css',resp('body{}',200,'text/css')); nextFetch=new Error('offline'); fetchCount=0;
  r=await ctx.criticalAssetResponse(new Request('https://trip.test/styles.css?v=x'));
  assert.equal(await r.text(),'body{}'); assert.equal(fetchCount,0);
  console.log('FR2 ATOMIC CRITICAL ASSETS: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
