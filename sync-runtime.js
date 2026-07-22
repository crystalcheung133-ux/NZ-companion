/* sync-runtime.js — Stage 9A-2 read-only published snapshot hydration.
   Reads Supabase, caches the newest valid publication and hydrates static trip datasets.
   It never uploads itinerary, Admin drafts, Expenses or Moments. */
(function(root){
  'use strict';

  const EVENTS=Object.freeze({
    stateChange:'travelengine:sync-state-change',
    snapshot:'travelengine:sync-snapshot',
    hydrated:'travelengine:sync-hydrated',
    error:'travelengine:sync-error'
  });
  const state={
    status:'initialising', configured:false,
    online:root.navigator ? root.navigator.onLine!==false : true,
    source:'local', lastSyncedAt:null, remoteVersion:null,
    activeVersion:null, hydrated:false, error:null
  };
  let activeSnapshot=null;
  let autoReadStarted=false;

  function emit(name,detail){
    if(!root.document || typeof root.CustomEvent!=='function') return;
    root.document.dispatchEvent(new root.CustomEvent(name,{detail:detail||{}}));
  }
  function snapshot(){
    return Object.freeze({
      status:state.status,configured:state.configured,online:state.online,
      source:state.source,lastSyncedAt:state.lastSyncedAt,
      remoteVersion:state.remoteVersion,activeVersion:state.activeVersion,
      hydrated:state.hydrated,error:state.error
    });
  }
  function reflect(){
    const el=root.document&&root.document.documentElement;
    if(!el||!el.dataset)return;
    el.dataset.syncStatus=state.status;
    el.dataset.syncConfigured=state.configured?'true':'false';
    el.dataset.syncSource=state.source;
    el.dataset.syncVersion=state.activeVersion==null?'':String(state.activeVersion);
  }
  function publish(reason){reflect();emit(EVENTS.stateChange,{reason:reason||'state',state:snapshot()});}
  function setState(next,reason){
    Object.keys(next||{}).forEach(function(key){
      if(Object.prototype.hasOwnProperty.call(state,key))state[key]=next[key];
    });
    publish(reason);return snapshot();
  }
  function config(){return root.SYNC_CONFIG||null;}
  function store(){return root.STORAGE&&root.STORAGE.local?root.STORAGE.local:null;}
  function configured(){
    const cfg=config();return !!(cfg&&typeof cfg.hasCredentials==='function'&&cfg.hasCredentials());
  }
  function readCachedSnapshot(){
    const cfg=config(),storage=store();
    if(!cfg||!storage)return null;
    const cached=storage.readJSON(cfg.cacheKey,null);
    return validateWrapper(cached)?cached:null;
  }
  function validateWrapper(wrapper){
    const cfg=config();
    return !!(cfg&&wrapper&&wrapper.tripId===cfg.tripId&&
      Number(wrapper.schemaVersion)===Number(cfg.schemaVersion)&&
      wrapper.payload&&typeof wrapper.payload==='object');
  }
  function normaliseRow(row){
    if(!row||typeof row!=='object')return null;
    const wrapper={
      tripId:String(row.trip_id||''),schemaVersion:Number(row.schema_version),
      version:Number(row.version),publishedAt:row.published_at||null,
      savedAt:new Date().toISOString(),payload:row.payload
    };
    return validateWrapper(wrapper)&&Number.isFinite(wrapper.version)?wrapper:null;
  }
  function writeCache(wrapper){
    const cfg=config(),storage=store();
    if(!cfg||!storage||!validateWrapper(wrapper))return false;
    const savedAt=new Date().toISOString();
    const saved=Object.assign({},wrapper,{savedAt:savedAt});
    const ok=storage.writeJSON(cfg.cacheKey,saved);
    if(ok)storage.writeJSON(cfg.metadataKey,{
      lastSyncedAt:savedAt,remoteVersion:saved.version,publishedAt:saved.publishedAt||null
    });
    return ok;
  }
  function endpoint(){
    const cfg=config();
    return cfg.url.replace(/\/$/,'')+'/rest/v1/'+encodeURIComponent(cfg.tables.publications)
      +'?trip_id=eq.'+encodeURIComponent(cfg.tripId)
      +'&schema_version=eq.'+encodeURIComponent(cfg.schemaVersion)
      +'&select=trip_id,schema_version,version,published_at,payload'
      +'&order=version.desc&limit=1';
  }
  function fetchWithTimeout(url,options,timeoutMs){
    const controller=typeof AbortController==='function'?new AbortController():null;
    const timer=controller?root.setTimeout(function(){controller.abort();},timeoutMs):null;
    const opts=Object.assign({},options||{},controller?{signal:controller.signal}:{});
    return root.fetch(url,opts).finally(function(){if(timer)root.clearTimeout(timer);});
  }
  function payloadData(wrapper){
    const payload=wrapper&&wrapper.payload;
    if(!payload||typeof payload!=='object')return null;
    return payload.data&&typeof payload.data==='object'?payload.data:payload;
  }
  function replaceObject(target,next){
    if(!target||typeof target!=='object'||Array.isArray(target)||!next||typeof next!=='object'||Array.isArray(next))return false;
    Object.keys(target).forEach(function(key){delete target[key];});
    Object.keys(next).forEach(function(key){target[key]=next[key];});
    return true;
  }
  function replaceArray(target,next){
    if(!Array.isArray(target)||!Array.isArray(next))return false;
    target.splice.apply(target,[0,target.length].concat(next));return true;
  }
  function select(data,names){
    for(let i=0;i<names.length;i+=1){
      if(Object.prototype.hasOwnProperty.call(data,names[i]))return data[names[i]];
    }
    return undefined;
  }
  function collectionSize(value){
    if(Array.isArray(value))return value.length;
    if(value&&typeof value==='object')return Object.keys(value).length;
    return 0;
  }
  function validateHydrationData(data,targets){
    const critical=[
      ['PLACES',['places','PLACES']],
      ['GUIDE_ORDER',['guideOrder','GUIDE_ORDER']],
      ['TRIP_DATA',['tripData','TRIP_DATA']],
      ['TRIP_ORDER',['tripOrder','TRIP_ORDER']],
      ['ITINERARY_DATA',['itineraryData','itinerary','ITINERARY_DATA']]
    ];
    const missing=[];
    critical.forEach(function(entry){
      const local=targets&&targets[entry[0]],remote=select(data,entry[1]);
      if(collectionSize(local)>0&&collectionSize(remote)===0)missing.push(entry[0]);
    });
    return {ok:missing.length===0,missing:missing};
  }
  /* RC15: a cached/fetched publication is only trustworthy if it was built
     FROM the master-itinerary revision currently shipped on this device. A
     publication produced before this deploy's data.js changed carries the
     old masterRevision (or none, if published before RC15) and must never be
     allowed to silently overwrite a newer local master — that was the root
     cause of stale itinerary titles surviving a master-file fix. This is a
     content-derived check (see itinerary-authority.js), not a build-version
     or one-time-clear check, so it stays correct across every future deploy. */
  function isCompatiblePublication(wrapper){
    const authority=root.ITINERARY_AUTHORITY;
    if(!authority||typeof authority.isCompatibleSnapshotPayload!=='function')return true;
    const payload=wrapper&&wrapper.payload;
    return authority.isCompatibleSnapshotPayload(payload);
  }
  function discardIncompatibleSnapshot(){
    const cfg=config(),storage=store();
    if(cfg&&storage){storage.remove(cfg.cacheKey);storage.remove(cfg.metadataKey);}
    activeSnapshot=null;
  }
  function hydrateStaticData(targets){
    const wrapper=activeSnapshot||readCachedSnapshot();
    if(!wrapper)return {ok:false,reason:'no-snapshot',applied:[]};
    if(!isCompatiblePublication(wrapper)){
      discardIncompatibleSnapshot();
      setState({hydrated:false,source:'local',activeVersion:null,error:null},'master-revision-mismatch');
      return {ok:false,reason:'master-revision-mismatch',applied:[]};
    }
    const data=payloadData(wrapper);
    if(!data)return {ok:false,reason:'invalid-payload',applied:[]};
    const integrity=validateHydrationData(data,targets);
    if(!integrity.ok){
      const entry={message:'Published snapshot is incomplete: '+integrity.missing.join(', '),time:new Date().toISOString()};
      setState({hydrated:false,error:entry},'hydrate-rejected');
      emit(EVENTS.error,{error:entry,state:snapshot()});
      return {ok:false,reason:'incomplete-payload',missing:integrity.missing,applied:[]};
    }
    const map=[
      ['PLACES',['places','PLACES']],['CATEGORIES',['categories','CATEGORIES']],
      ['GUIDE_ORDER',['guideOrder','GUIDE_ORDER']],['DAY_LINKS',['dayLinks','DAY_LINKS']],
      ['FRIENDS',['friends','FRIENDS']],['BOOKINGS_DATA',['bookingsData','bookings','BOOKINGS_DATA']],
      ['TRIP_DATA',['tripData','TRIP_DATA']],['TRIP_ORDER',['tripOrder','TRIP_ORDER']],
      ['ITINERARY_DATA',['itineraryData','itinerary','ITINERARY_DATA']]
    ];
    const applied=[];
    map.forEach(function(entry){
      const target=targets&&targets[entry[0]],next=select(data,entry[1]);
      if(next===undefined)return;
      const changed=Array.isArray(target)?replaceArray(target,next):replaceObject(target,next);
      if(changed)applied.push(entry[0]);
    });
    activeSnapshot=wrapper;
    setState({source:state.source==='supabase'?'supabase':'cache',activeVersion:wrapper.version,
      hydrated:applied.length>0,error:null},'hydrate');
    emit(EVENTS.hydrated,{version:wrapper.version,applied:applied.slice(),state:snapshot()});
    return {ok:true,version:wrapper.version,applied:applied};
  }
  function maybeReloadForNewVersion(wrapper){
    if(!wrapper||!root.sessionStorage||!root.location)return false;
    const cfg=config(),version=String(wrapper.version);
    const marker=root.sessionStorage.getItem(cfg.reloadMarkerKey);
    if(marker===version)return false;
    root.sessionStorage.setItem(cfg.reloadMarkerKey,version);
    root.location.reload();return true;
  }
  async function fetchLatestPublished(options){
    const opts=options||{};
    state.online=root.navigator?root.navigator.onLine!==false:true;
    state.configured=configured();
    if(!state.configured){
      const cached=readCachedSnapshot();
      activeSnapshot=cached;
      setState({status:'local-only',source:cached?'cache':'local',activeVersion:cached?cached.version:null,error:null},'not-configured');
      return {ok:true,source:cached?'cache':'local',snapshot:cached,reason:'not-configured'};
    }
    if(!state.online){
      const cached=readCachedSnapshot();activeSnapshot=cached;
      setState({status:'offline',source:cached?'cache':'local',activeVersion:cached?cached.version:null,error:null},'offline');
      return {ok:!!cached,source:cached?'cache':'local',snapshot:cached,reason:'offline'};
    }
    setState({status:'syncing',error:null},'fetch-start');
    const cfg=config();
    try{
      const response=await fetchWithTimeout(endpoint(),{
        method:'GET',headers:{apikey:cfg.anonKey,Authorization:'Bearer '+cfg.anonKey,Accept:'application/json'},cache:'no-store'
      },cfg.requestTimeoutMs);
      if(!response.ok)throw new Error('Supabase read failed ('+response.status+')');
      const rows=await response.json();
      const wrapper=normaliseRow(Array.isArray(rows)&&rows.length?rows[0]:null);
      if(!wrapper){
        const cached=readCachedSnapshot();activeSnapshot=cached;
        setState({status:'ready',source:cached?'cache':'local',remoteVersion:null,
          activeVersion:cached?cached.version:null,error:null},'no-publication');
        return {ok:true,source:cached?'cache':'local',snapshot:cached,reason:'no-publication'};
      }
      const previous=readCachedSnapshot();
      writeCache(wrapper);activeSnapshot=wrapper;
      setState({status:'synced',source:'supabase',lastSyncedAt:new Date().toISOString(),
        remoteVersion:wrapper.version,activeVersion:wrapper.version,error:null},'fetch-success');
      emit(EVENTS.snapshot,{snapshot:wrapper,state:snapshot()});
      const changed=!previous||Number(previous.version)!==Number(wrapper.version);
      if(changed&&opts.reloadOnChange!==false)maybeReloadForNewVersion(wrapper);
      return {ok:true,source:'supabase',snapshot:wrapper,changed:changed};
    }catch(error){
      const cached=readCachedSnapshot();activeSnapshot=cached;
      const entry={message:error&&error.message?String(error.message):String(error),time:new Date().toISOString()};
      setState({status:cached?'cached':'error',source:cached?'cache':'local',activeVersion:cached?cached.version:null,error:entry},'fetch-error');
      emit(EVENTS.error,{error:entry,state:snapshot()});
      if(opts.throwOnError)throw error;
      return {ok:!!cached,source:cached?'cache':'local',snapshot:cached,error:entry};
    }
  }
  function statusLabel(){
    const labels={initialising:'Initialising',syncing:'Checking cloud',synced:'Synced',cached:'Cached',offline:'Offline',ready:'Local data',error:'Sync unavailable','local-only':'Local only'};
    const base=labels[state.status]||state.status;
    return state.activeVersion==null?base:base+' · v'+state.activeVersion;
  }
  function bindConnection(){
    if(typeof root.addEventListener!=='function')return;
    root.addEventListener('online',function(){state.online=true;publish('online');fetchLatestPublished();});
    root.addEventListener('offline',function(){state.online=false;setState({status:'offline'},'offline');});
  }
  function startAutoRead(){
    const cfg=config();
    if(autoReadStarted||!cfg||cfg.autoRead!==true)return;
    autoReadStarted=true;fetchLatestPublished();
  }
  function initialise(){
    state.configured=configured();
    const cached=readCachedSnapshot();activeSnapshot=cached;
    const meta=config()&&store()?store().readJSON(config().metadataKey,null):null;
    if(meta){state.lastSyncedAt=meta.lastSyncedAt||null;state.remoteVersion=meta.remoteVersion||null;}
    setState({status:state.configured?(state.online?'ready':'offline'):'local-only',
      source:cached?'cache':'local',activeVersion:cached?cached.version:null,error:null},'initialise');
    return snapshot();
  }

  bindConnection();
  const API=Object.freeze({events:EVENTS,getState:snapshot,isConfigured:configured,
    readCachedSnapshot,fetchLatestPublished,hydrateStaticData,statusLabel,startAutoRead,initialise});
  root.TRIP_SYNC=API;
  initialise();
  if(root.document){
    if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',startAutoRead,{once:true});
    else root.setTimeout(startAutoRead,0);
  }
})(globalThis);
