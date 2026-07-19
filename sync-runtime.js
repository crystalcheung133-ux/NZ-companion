/* sync-runtime.js — Stage 9A-1 Supabase-aware read foundation.
   This module does not replace localStorage and performs no writes to trip data. */
(function(root){
  'use strict';

  const EVENTS=Object.freeze({
    stateChange:'travelengine:sync-state-change',
    snapshot:'travelengine:sync-snapshot',
    error:'travelengine:sync-error'
  });
  const state={
    status:'initialising',
    configured:false,
    online:root.navigator ? root.navigator.onLine!==false : true,
    source:'local',
    lastSyncedAt:null,
    remoteVersion:null,
    error:null
  };

  function emit(name,detail){
    if(!root.document || typeof root.CustomEvent!=='function') return;
    root.document.dispatchEvent(new root.CustomEvent(name,{detail:detail||{}}));
  }
  function snapshot(){
    return Object.freeze({
      status:state.status, configured:state.configured, online:state.online,
      source:state.source, lastSyncedAt:state.lastSyncedAt,
      remoteVersion:state.remoteVersion, error:state.error
    });
  }
  function reflect(){
    const el=root.document && root.document.documentElement;
    if(!el || !el.dataset) return;
    el.dataset.syncStatus=state.status;
    el.dataset.syncConfigured=state.configured?'true':'false';
    el.dataset.syncSource=state.source;
  }
  function publish(reason){
    reflect();
    emit(EVENTS.stateChange,{reason:reason||'state',state:snapshot()});
  }
  function setState(next,reason){
    Object.keys(next||{}).forEach(function(key){if(Object.prototype.hasOwnProperty.call(state,key)) state[key]=next[key];});
    publish(reason);
    return snapshot();
  }
  function config(){return root.SYNC_CONFIG||null;}
  function store(){return root.STORAGE && root.STORAGE.local ? root.STORAGE.local : null;}
  function configured(){
    const cfg=config();
    return !!(cfg && typeof cfg.hasCredentials==='function' && cfg.hasCredentials());
  }
  function readCachedSnapshot(){
    const cfg=config(), storage=store();
    if(!cfg || !storage) return null;
    return storage.readJSON(cfg.cacheKey,null);
  }
  function writeCache(payload){
    const cfg=config(), storage=store();
    if(!cfg || !storage) return false;
    const savedAt=new Date().toISOString();
    const wrapper={tripId:cfg.tripId,schemaVersion:cfg.schemaVersion,savedAt,payload};
    const ok=storage.writeJSON(cfg.cacheKey,wrapper);
    if(ok) storage.writeJSON(cfg.metadataKey,{lastSyncedAt:savedAt,remoteVersion:payload&&payload.version||null});
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
  async function fetchLatestPublished(options){
    const opts=options||{};
    state.online=root.navigator ? root.navigator.onLine!==false : true;
    state.configured=configured();
    if(!state.configured){
      setState({status:'local-only',source:'local',error:null},'not-configured');
      return {ok:true,source:'local',snapshot:readCachedSnapshot(),reason:'not-configured'};
    }
    if(!state.online){
      const cached=readCachedSnapshot();
      setState({status:'offline',source:cached?'cache':'local',error:null},'offline');
      return {ok:!!cached,source:cached?'cache':'local',snapshot:cached,reason:'offline'};
    }
    setState({status:'syncing',error:null},'fetch-start');
    const cfg=config();
    try{
      const response=await fetchWithTimeout(endpoint(),{
        method:'GET',
        headers:{apikey:cfg.anonKey,Authorization:'Bearer '+cfg.anonKey,Accept:'application/json'},
        cache:'no-store'
      },cfg.requestTimeoutMs);
      if(!response.ok) throw new Error('Supabase read failed ('+response.status+')');
      const rows=await response.json();
      const row=Array.isArray(rows)&&rows.length?rows[0]:null;
      if(!row){
        setState({status:'ready',source:'local',remoteVersion:null,error:null},'no-publication');
        return {ok:true,source:'local',snapshot:null,reason:'no-publication'};
      }
      const payload={tripId:row.trip_id,schemaVersion:row.schema_version,version:row.version,publishedAt:row.published_at,payload:row.payload};
      writeCache(payload);
      setState({status:'synced',source:'supabase',lastSyncedAt:new Date().toISOString(),remoteVersion:row.version,error:null},'fetch-success');
      emit(EVENTS.snapshot,{snapshot:payload,state:snapshot()});
      return {ok:true,source:'supabase',snapshot:payload};
    }catch(error){
      const cached=readCachedSnapshot();
      const entry={message:error&&error.message?String(error.message):String(error),time:new Date().toISOString()};
      setState({status:cached?'cached':'error',source:cached?'cache':'local',error:entry},'fetch-error');
      emit(EVENTS.error,{error:entry,state:snapshot()});
      if(opts.throwOnError) throw error;
      return {ok:!!cached,source:cached?'cache':'local',snapshot:cached,error:entry};
    }
  }
  function bindConnection(){
    if(typeof root.addEventListener!=='function') return;
    root.addEventListener('online',function(){state.online=true; publish('online');});
    root.addEventListener('offline',function(){state.online=false; setState({status:'offline'},'offline');});
  }
  function initialise(){
    state.configured=configured();
    const meta=config()&&store()?store().readJSON(config().metadataKey,null):null;
    if(meta){state.lastSyncedAt=meta.lastSyncedAt||null;state.remoteVersion=meta.remoteVersion||null;}
    setState({status:state.configured?(state.online?'ready':'offline'):'local-only',source:'local',error:null},'initialise');
    return snapshot();
  }

  bindConnection();
  const API=Object.freeze({events:EVENTS,getState:snapshot,isConfigured:configured,readCachedSnapshot,fetchLatestPublished,initialise});
  root.TRIP_SYNC=API;
  initialise();
})(globalThis);
