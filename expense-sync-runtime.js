/* expense-sync-runtime.js — Stage 10A Supabase Expenses Sync
   Local-first, multi-device expense sync with soft-delete tombstones.
   Requires SUPABASE_STAGE_10A_EXPENSES_SETUP.sql and Anonymous Sign-Ins enabled. */
(function(root){
  'use strict';

  const config=root.SYNC_CONFIG||{};
  const storage=root.STORAGE?.local;
  const EVENTS=Object.freeze({status:'travelengine:expensesyncstatus',changed:'travelengine:expensesyncchanged'});
  const SESSION_KEY='travel_engine_supabase_anon_session_v1';
  const TOMBSTONE_KEY='travel_engine_expense_tombstones_v1';
  const META_KEY='travel_engine_expense_sync_meta_v1';
  const table=config.tables?.expenses||'trip_expenses';
  const state={status:'idle',message:'Saved on this device',lastSyncAt:null,error:null,timer:null,inFlight:null};

  function uuid(){
    if(root.crypto?.randomUUID) return root.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16);});
  }
  function readJSON(key,fallback){
    try{return storage?.readJSON?storage.readJSON(key,fallback):JSON.parse(localStorage.getItem(key)||'null')??fallback;}
    catch(e){return fallback;}
  }
  function writeJSON(key,value){
    try{if(storage?.writeJSON)storage.writeJSON(key,value);else localStorage.setItem(key,JSON.stringify(value));}catch(e){}
  }
  function iso(value){
    const d=new Date(value||0);return Number.isNaN(d.getTime())?new Date(0).toISOString():d.toISOString();
  }
  function normalizeRecord(record){
    const next=Object.assign({},record||{});
    next.id=String(next.id||uuid());
    next.createdAt=iso(next.createdAt||new Date().toISOString());
    next.updatedAt=iso(next.updatedAt||next.editedAt||next.createdAt);
    return next;
  }
  function readLocal(){
    const key=root.STORAGE_CONFIG?.keys?.expenses||'expenses';
    const list=readJSON(key,[]);
    const normalized=(Array.isArray(list)?list:[]).map(normalizeRecord);
    if(JSON.stringify(list)!==JSON.stringify(normalized)) writeJSON(key,normalized);
    return normalized;
  }
  function writeLocal(list){
    const key=root.STORAGE_CONFIG?.keys?.expenses||'expenses';
    writeJSON(key,(Array.isArray(list)?list:[]).map(normalizeRecord));
  }
  function readTombstones(){return (readJSON(TOMBSTONE_KEY,[])||[]).filter(x=>x?.id).map(x=>Object.assign({},x,{updatedAt:iso(x.updatedAt||x.deletedAt),deletedAt:iso(x.deletedAt||x.updatedAt)}));}
  function writeTombstones(list){
    const cutoff=Date.now()-1000*60*60*24*90;
    writeJSON(TOMBSTONE_KEY,(list||[]).filter(x=>new Date(x.deletedAt||0).getTime()>cutoff));
  }
  function markDeleted(record){
    if(!record) return;
    const now=new Date().toISOString();
    const tomb=Object.assign({},normalizeRecord(record),{updatedAt:now,deletedAt:now});
    const map=new Map(readTombstones().map(x=>[x.id,x]));map.set(tomb.id,tomb);writeTombstones([...map.values()]);
  }
  function emit(status,message,error){
    state.status=status;state.message=message;state.error=error||null;
    root.document?.dispatchEvent(new CustomEvent(EVENTS.status,{detail:snapshot()}));
  }
  function snapshot(){return Object.freeze({status:state.status,message:state.message,lastSyncAt:state.lastSyncAt,error:state.error});}
  function configured(){return !!(config.enabled&&config.url&&config.anonKey&&config.tripId);}
  function sessionValid(s){return !!(s?.access_token&&s?.refresh_token&&Number(s.expires_at||0)*1000>Date.now()+60000);}
  async function authRequest(path,body){
    const res=await fetch(config.url.replace(/\/$/,'')+path,{method:'POST',headers:{apikey:config.anonKey,Authorization:`Bearer ${config.anonKey}`,'Content-Type':'application/json'},body:JSON.stringify(body||{})});
    const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data?.msg||data?.message||`Auth ${res.status}`);return data;
  }
  async function getSession(){
    let session=readJSON(SESSION_KEY,null);
    if(sessionValid(session)) return session;
    if(session?.refresh_token){
      try{session=await authRequest('/auth/v1/token?grant_type=refresh_token',{refresh_token:session.refresh_token});writeJSON(SESSION_KEY,session);return session;}catch(e){}
    }
    const authData=await authRequest('/auth/v1/signup',{data:{}});
    session=authData?.session||authData;
    if(!session?.access_token) throw new Error(authData?.error_description||authData?.msg||authData?.message||'Anonymous session was not returned');
    writeJSON(SESSION_KEY,session);return session;
  }
  async function api(path,options={}){
    const session=await getSession();
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),config.requestTimeoutMs||8000);
    try{
      const res=await fetch(config.url.replace(/\/$/,'')+'/rest/v1/'+path,Object.assign({},options,{signal:controller.signal,headers:Object.assign({apikey:config.anonKey,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},options.headers||{})}));
      if(!res.ok){const text=await res.text();throw new Error(text||`Expenses sync ${res.status}`);}
      if(res.status===204)return null;return res.json().catch(()=>null);
    }finally{clearTimeout(timer);}
  }
  function toRemote(record,deleted=false){
    const r=normalizeRecord(record);
    return {id:r.id,trip_id:config.tripId,payload:r,actor_family:(typeof root.getFriend==='function'?root.getFriend():null)||'lee',created_at:r.createdAt,updated_at:r.updatedAt,deleted_at:deleted?(r.deletedAt||r.updatedAt):null};
  }
  function fromRemote(row){
    const payload=normalizeRecord(Object.assign({},row.payload||{},{id:row.id,createdAt:row.created_at,updatedAt:row.updated_at}));
    if(row.deleted_at)payload.deletedAt=row.deleted_at;return payload;
  }
  async function pull(){
    const query=`${encodeURIComponent(table)}?trip_id=eq.${encodeURIComponent(config.tripId)}&select=id,payload,created_at,updated_at,deleted_at,actor_family&order=updated_at.asc`;
    return (await api(query))||[];
  }
  async function push(records){
    if(!records.length)return;
    const path=`${encodeURIComponent(table)}?on_conflict=id`;
    await api(path,{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(records)});
  }
  async function syncNow(){
    if(!configured()||!navigator.onLine){emit('offline','Saved offline — will sync later');return snapshot();}
    if(state.inFlight)return state.inFlight;
    state.inFlight=(async()=>{
      emit('syncing','Syncing expenses…');
      try{
        const remoteRows=await pull();
        const localActive=readLocal();const localDeleted=readTombstones();
        const localMap=new Map([...localActive,...localDeleted].map(x=>[x.id,x]));
        const remoteMap=new Map(remoteRows.map(row=>[row.id,fromRemote(row)]));
        const ids=new Set([...localMap.keys(),...remoteMap.keys()]);
        const finalActive=[];const finalDeleted=[];const toPush=[];
        ids.forEach(id=>{
          const l=localMap.get(id),r=remoteMap.get(id);
          let winner;
          if(!l)winner=r;else if(!r){winner=l;toPush.push(toRemote(l,!!l.deletedAt));}
          else{
            const lt=new Date(l.updatedAt||0).getTime(),rt=new Date(r.updatedAt||0).getTime();
            winner=lt>rt?l:r;
            if(lt>rt)toPush.push(toRemote(l,!!l.deletedAt));
          }
          if(winner?.deletedAt)finalDeleted.push(winner);else if(winner)finalActive.push(winner);
        });
        await push(toPush);
        finalActive.sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
        writeLocal(finalActive);writeTombstones(finalDeleted);
        state.lastSyncAt=new Date().toISOString();writeJSON(META_KEY,{lastSyncAt:state.lastSyncAt});
        emit('synced','Synced across families');
        root.document?.dispatchEvent(new CustomEvent(EVENTS.changed,{detail:{count:finalActive.length}}));
        return snapshot();
      }catch(error){
        const msg=/Anonymous sign-ins|anonymous/i.test(String(error?.message))?'Enable Anonymous Sign-Ins in Supabase':(navigator.onLine?'Sync unavailable — saved on this device':'Saved offline — will sync later');
        emit('error',msg,error?.message||String(error));return snapshot();
      }finally{state.inFlight=null;}
    })();
    return state.inFlight;
  }
  function queueSync(delay=350){clearTimeout(state.timer);state.timer=setTimeout(syncNow,delay);}
  function initialise(){
    readLocal();
    root.addEventListener?.('online',()=>queueSync(50));
    root.document?.addEventListener('visibilitychange',()=>{if(root.document.visibilityState==='visible')queueSync(100);});
    root.setInterval?.(()=>{if(root.document?.visibilityState==='visible')syncNow();},30000);
  }

  root.EXPENSE_SYNC=Object.freeze({EVENTS,getState:snapshot,normalizeRecord,readLocal,writeLocal,markDeleted,syncNow,queueSync,isConfigured:configured});
  initialise();
})(globalThis);
