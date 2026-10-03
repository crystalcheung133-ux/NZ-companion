const fs=require('fs'),vm=require('vm'),assert=require('assert');
const root=__dirname+'/..';
const authoritySrc=fs.readFileSync(root+'/itinerary-authority.js','utf8');
const dayHtml=fs.readFileSync(root+'/day.html','utf8');
const syncSrc=fs.readFileSync(root+'/sync-runtime.js','utf8');
const integrity=require(root+'/engine-integrity.js');
const legacy={id:'custom-1-5a93efbf-d788-4351-9c4f-dd8300a60601',type:'custom',dayId:'day1',placeId:null,bookingId:null,title:'Custom activity'};

// Authority/local override path.
const mem={};
const actx={console,globalThis:null,MASTER_ITINERARY_REVISION:'rev1',ITINERARY_DATA:{1:{items:[]}},STORAGE_CONFIG:{keys:{itineraryOverrides:'ov',adminDraft:'draft'}},STORAGE:{local:{readJSON:(k,d)=>k in mem?JSON.parse(mem[k]):d,writeJSON:(k,v)=>{mem[k]=JSON.stringify(v);return true},get:()=>null,set:()=>{},remove:()=>{}}}};actx.globalThis=actx;
vm.createContext(actx);vm.runInContext(authoritySrc,actx);
const fixed=actx.ITINERARY_AUTHORITY.normalizeItems([legacy])[0];
assert.strictEqual(fixed.nonPlace,true,'legacy custom item must migrate to explicit nonPlace');
assert.strictEqual(legacy.nonPlace,undefined,'migration must not mutate input');
assert.strictEqual(actx.ITINERARY_AUTHORITY.resolveDayItems('1',[legacy])[0].nonPlace,true,'master/publication fallback must normalize before consumers');

// Exact field path: cached publication hydrates BEFORE itinerary-authority.js exists.
const cacheKey='cache', metaKey='meta';
const publication={tripId:'nz',schemaVersion:1,version:7,payload:{masterRevision:'rev1',data:{
  places:{p:{id:'p'}},guideOrder:['p'],tripData:{x:{}},tripOrder:['x'],
  itineraryData:{1:{items:[legacy]}}
}}};
const smem={[cacheKey]:JSON.parse(JSON.stringify(publication))};
const sctx={console,globalThis:null,MASTER_ITINERARY_REVISION:'rev1',navigator:{onLine:true},
  SYNC_CONFIG:{tripId:'nz',schemaVersion:1,cacheKey,metadataKey:metaKey,autoRead:false,hasCredentials:()=>false},
  STORAGE:{local:{readJSON:(k,d)=>k in smem?JSON.parse(JSON.stringify(smem[k])):d,writeJSON:(k,v)=>{smem[k]=JSON.parse(JSON.stringify(v));return true},remove:k=>delete smem[k]}},
  addEventListener:()=>{},setTimeout:()=>{}};sctx.globalThis=sctx;
vm.createContext(sctx);vm.runInContext(syncSrc,sctx);
assert.strictEqual(sctx.ITINERARY_AUTHORITY,undefined,'test must reproduce pre-authority hydration order');
const targets={PLACES:{local:{}},CATEGORIES:{},GUIDE_ORDER:['local'],DAY_LINKS:{},FRIENDS:{},BOOKINGS_DATA:{},TRIP_DATA:{local:{}},TRIP_ORDER:['local'],ITINERARY_DATA:{1:{items:[]}}};
const hydrated=sctx.TRIP_SYNC.hydrateStaticData(targets);
assert.strictEqual(hydrated.ok,true,'cached publication should hydrate');
const hydratedItem=targets.ITINERARY_DATA['1'].items[0];
assert.strictEqual(hydratedItem.id,legacy.id,'field custom item must survive hydration');
assert.strictEqual(hydratedItem.nonPlace,true,'pre-authority publication hydration must classify legacy custom item');
const candidate={PLACES:targets.PLACES,CATEGORIES:targets.CATEGORIES,GUIDE_ORDER:targets.GUIDE_ORDER,DAY_LINKS:targets.DAY_LINKS,BOOKINGS_DATA:targets.BOOKINGS_DATA,TRIP_DATA:targets.TRIP_DATA,TRIP_ORDER:targets.TRIP_ORDER,ITINERARY_DATA:targets.ITINERARY_DATA};
const result=integrity.validateTripData(candidate,{});
assert(!result.issues.some(x=>x.code==='REL_TIMELINE_CLASSIFICATION_AMBIGUOUS'||x.code==='NONPLACE_CLASSIFICATION_MISSING'),'hydrated field custom item must not trigger E2/E5');

assert(/type:'custom'.*nonPlace:true/.test(dayHtml.replace(/\s+/g,' ')),'new Add activity must create explicit nonPlace custom item');
console.log('ROOTFIX2 cached-publication custom itinerary classification PASS');
