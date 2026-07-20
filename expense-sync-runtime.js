/* expense-sync-runtime.js — Stage 10A Supabase Expenses Sync
   Local-first, multi-device expense sync with soft-delete tombstones.
   Requires SUPABASE_STAGE_10A_EXPENSES_SETUP.sql and Anonymous Sign-Ins enabled. */
(function(root){
  'use strict';

  const config=root.SYNC_CONFIG||{};
  const storage=root.STORAGE?.local;
  const EVENTS=Object.freeze({status:'travelengine:expensesyncstatus',changed:'travelengine:expensesyncchanged'});
  const TOMBSTONE_KEY='travel_engine_expense_tombstones_v1';
  const META_KEY='travel_engine_expense_sync_meta_v1';
  const table=config.tables?.expenses||'trip_expenses';
  const state={status:'idle',message:'Saved on this device',lastSyncAt:null,error:null,timer:null,inFlight:null,paused:false};

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
  function configured(){return !!(config.enabled&&config.url&&config.anonKey&&config.tripId&&root.SUPABASE?.isConfigured?.());}
  const LOG='[Supabase]';
  async function ensureSession(){
    if(!root.SUPABASE?.getSession)throw new Error('Shared Supabase client runtime unavailable');
    return root.SUPABASE.getSession();
  }
  function client(){
    if(!root.SUPABASE?.getClient)throw new Error('Shared Supabase client runtime unavailable');
    return root.SUPABASE.getClient();
  }
  function withTimeout(builder){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),config.requestTimeoutMs||8000);
    return builder.abortSignal(controller.signal).then(
      result=>{clearTimeout(timer);return result;},
      error=>{clearTimeout(timer);throw error;}
    );
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
    await ensureSession();
    const {data,error}=await withTimeout(
      client().from(table).select('id,payload,created_at,updated_at,deleted_at,actor_family').eq('trip_id',config.tripId).order('updated_at',{ascending:true})
    );
    if(error){
      console.error(LOG,'Supabase select failed',error.message,error);
      throw new Error(error.message||'Expenses sync select failed');
    }
    console.log(LOG,'Expenses pulled',(data||[]).length);
    return data||[];
  }
  async function push(records){
    if(!records.length)return;
    await ensureSession();
    const {error}=await withTimeout(
      client().from(table).upsert(records,{onConflict:'id'})
    );
    if(error){
      const rls=/row-level security|permission denied|policy/i.test(error.message||'');
      console.error(LOG,rls?'RLS rejected':'Supabase insert failed',error.message,error);
      throw new Error(error.message||'Expenses sync upsert failed');
    }
    console.log(LOG,'Expense uploaded',records.map(r=>r.id).join(', '));
  }
  async function syncNow(){
    if(state.paused){emit('paused','Sync paused for trip reset');return snapshot();}
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
        console.error(LOG,'Expenses sync failed',error?.message||error);
        emit('error',msg,error?.message||String(error));return snapshot();
      }finally{state.inFlight=null;}
    })();
    return state.inFlight;
  }
  function queueSync(delay=350){if(state.paused)return;clearTimeout(state.timer);state.timer=setTimeout(syncNow,delay);}
  function pause(){state.paused=true;clearTimeout(state.timer);state.timer=null;emit('paused','Sync paused for trip reset');}
  async function resetTrip(){
    pause();
    if(state.inFlight){try{await state.inFlight;}catch(e){}}
    if(!configured()||!navigator.onLine)throw new Error('An internet connection is required to reset cloud expenses.');
    await ensureSession();
    const {data:beforeRows,error:beforeError}=await withTimeout(
      client().from(table).select('id').eq('trip_id',config.tripId)
    );
    if(beforeError)throw new Error(beforeError.message||'Unable to verify cloud expenses before reset');
    const {data:deletedRows,error}=await withTimeout(
      client().from(table).delete().eq('trip_id',config.tripId).select('id')
    );
    if(error)throw new Error(error.message||'Cloud expense reset failed');
    const {data:remainingRows,error:verifyError}=await withTimeout(
      client().from(table).select('id').eq('trip_id',config.tripId).limit(1)
    );
    if(verifyError)throw new Error(verifyError.message||'Unable to verify cloud expense reset');
    if((remainingRows||[]).length){
      throw new Error(`Cloud expenses were not deleted. Supabase DELETE policy has not been applied (found ${(beforeRows||[]).length}, deleted ${(deletedRows||[]).length}). Run SUPABASE_STAGE_10AB_SYNC_SETUP.sql, then try Reset again.`);
    }
    writeLocal([]);writeTombstones([]);
    try{storage?.remove?storage.remove(META_KEY):localStorage.removeItem(META_KEY);}catch(e){}
    state.lastSyncAt=null;state.error=null;emit('paused','Expenses reset complete');
  }
  function initialise(){
    readLocal();
    root.addEventListener?.('online',()=>queueSync(50));
    root.document?.addEventListener('visibilitychange',()=>{if(root.document.visibilityState==='visible')queueSync(100);});
    root.setInterval?.(()=>{if(root.document?.visibilityState==='visible')syncNow();},30000);
  }

  root.EXPENSE_SYNC=Object.freeze({EVENTS,getState:snapshot,normalizeRecord,readLocal,writeLocal,markDeleted,syncNow,queueSync,pause,resetTrip,isConfigured:configured});
  initialise();
})(globalThis);
