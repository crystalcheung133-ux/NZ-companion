/* moment-sync-runtime.js — Stage 10B Supabase Moments Sync
   Local-first multi-device sync for moment text/rating/moods/context plus photo storage.
   Photos are uploaded to the trip-moments Storage bucket when online; offline photos wait in IndexedDB. */
(function(root){
  'use strict';
  const config=root.SYNC_CONFIG||{};
  const storage=root.STORAGE?.local;
  const table=config.tables?.moments||'trip_moments';
  const bucket=config.storage?.momentsBucket||'trip-moments';
  const EVENTS=Object.freeze({status:'travelengine:momentsyncstatus',changed:'travelengine:momentsyncchanged'});
  const TOMBSTONE_KEY='travel_engine_moment_tombstones_v1';
  const META_KEY='travel_engine_moment_sync_meta_v1';
  const DB_NAME='travel_engine_moment_photos_v1';
  const STORE='pending_photos';
  const state={status:'idle',message:'Saved on this device',lastSyncAt:null,error:null,timer:null,inFlight:null};

  function uuid(){return root.crypto?.randomUUID?root.crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16);});}
  function readJSON(key,fallback){try{return storage?.readJSON?storage.readJSON(key,fallback):(JSON.parse(localStorage.getItem(key)||'null')??fallback);}catch(e){return fallback;}}
  function writeJSON(key,value){try{storage?.writeJSON?storage.writeJSON(key,value):localStorage.setItem(key,JSON.stringify(value));}catch(e){}}
  function iso(value){const d=new Date(value||0);return Number.isNaN(d.getTime())?new Date(0).toISOString():d.toISOString();}
  function normalizeRecord(record){const next=Object.assign({},record||{});next.id=String(next.id||uuid());next.createdAt=iso(next.createdAt||new Date().toISOString());next.updatedAt=iso(next.updatedAt||next.editedAt||next.createdAt);return next;}
  function key(){return root.STORAGE_CONFIG?.keys?.momentsList||'moments_list';}
  function readLocal(){const list=readJSON(key(),[]);const normalized=(Array.isArray(list)?list:[]).map(normalizeRecord);if(JSON.stringify(list)!==JSON.stringify(normalized))writeJSON(key(),normalized);return normalized;}
  function writeLocal(list){writeJSON(key(),(Array.isArray(list)?list:[]).map(normalizeRecord));}
  function readTombstones(){return (readJSON(TOMBSTONE_KEY,[])||[]).filter(x=>x?.id).map(x=>Object.assign({},x,{updatedAt:iso(x.updatedAt||x.deletedAt),deletedAt:iso(x.deletedAt||x.updatedAt)}));}
  function writeTombstones(list){const cutoff=Date.now()-1000*60*60*24*90;writeJSON(TOMBSTONE_KEY,(list||[]).filter(x=>new Date(x.deletedAt||0).getTime()>cutoff));}
  function markDeleted(record){if(!record)return;const now=new Date().toISOString();const tomb=Object.assign({},normalizeRecord(record),{updatedAt:now,deletedAt:now});const map=new Map(readTombstones().map(x=>[x.id,x]));map.set(tomb.id,tomb);writeTombstones([...map.values()]);deletePendingPhoto(tomb.id);}
  function snapshot(){return Object.freeze({status:state.status,message:state.message,lastSyncAt:state.lastSyncAt,error:state.error});}
  function emit(status,message,error){state.status=status;state.message=message;state.error=error||null;root.document?.dispatchEvent(new CustomEvent(EVENTS.status,{detail:snapshot()}));}
  function configured(){return !!(config.enabled&&config.url&&config.anonKey&&config.tripId);}
  async function getSession(){
    if(!root.SUPABASE_AUTH?.getSession)throw new Error('Shared Supabase Auth runtime unavailable');
    return root.SUPABASE_AUTH.getSession();
  }
  async function rest(path,options={}){const session=await getSession();const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),config.requestTimeoutMs||8000);try{const res=await fetch(config.url.replace(/\/$/,'')+'/rest/v1/'+path,Object.assign({},options,{signal:controller.signal,headers:Object.assign({apikey:config.anonKey,Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},options.headers||{})}));if(!res.ok)throw new Error(await res.text()||`Moments sync ${res.status}`);if(res.status===204)return null;return res.json().catch(()=>null);}finally{clearTimeout(timer);}}
  function toRemote(record,deleted=false){const r=normalizeRecord(record);return{id:r.id,trip_id:config.tripId,payload:r,actor_family:(typeof root.getFriend==='function'?root.getFriend():null)||'lee',created_at:r.createdAt,updated_at:r.updatedAt,deleted_at:deleted?(r.deletedAt||r.updatedAt):null};}
  function fromRemote(row){const payload=normalizeRecord(Object.assign({},row.payload||{},{id:row.id,createdAt:row.created_at,updatedAt:row.updated_at}));if(row.deleted_at)payload.deletedAt=row.deleted_at;return payload;}
  async function pull(){const q=`${encodeURIComponent(table)}?trip_id=eq.${encodeURIComponent(config.tripId)}&select=id,payload,created_at,updated_at,deleted_at,actor_family&order=updated_at.asc`;return(await rest(q))||[];}
  async function push(records){if(!records.length)return;await rest(`${encodeURIComponent(table)}?on_conflict=id`,{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify(records)});}

  function openDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  async function storePendingPhoto(id,blob){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({id,blob,type:blob.type||'image/jpeg',updatedAt:new Date().toISOString()});tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
  async function getPendingPhotos(){const db=await openDb();return new Promise((resolve,reject)=>{const req=db.transaction(STORE,'readonly').objectStore(STORE).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);});}
  async function deletePendingPhoto(id){try{const db=await openDb();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}catch(e){}}
  function extension(type){return type==='image/webp'?'webp':type==='image/png'?'png':'jpg';}
  async function uploadPhoto(id,blob){const session=await getSession();const path=`${config.tripId}/${id}.${extension(blob.type)}`;const url=config.url.replace(/\/$/,'')+`/storage/v1/object/${encodeURIComponent(bucket)}/${path.split('/').map(encodeURIComponent).join('/')}`;const res=await fetch(url,{method:'POST',headers:{apikey:config.anonKey,Authorization:`Bearer ${session.access_token}`,'Content-Type':blob.type||'image/jpeg','x-upsert':'true'},body:blob});if(!res.ok)throw new Error(await res.text()||`Photo upload ${res.status}`);return{photoPath:path,photoUrl:config.url.replace(/\/$/,'')+`/storage/v1/object/public/${encodeURIComponent(bucket)}/${path.split('/').map(encodeURIComponent).join('/')}`};}
  async function stagePhoto(id,blob){if(!blob)return null;await storePendingPhoto(id,blob);if(!navigator.onLine)return{photoPending:true};try{const result=await uploadPhoto(id,blob);await deletePendingPhoto(id);return Object.assign({photoPending:false},result);}catch(e){return{photoPending:true};}}
  async function flushPhotos(){const pending=await getPendingPhotos();if(!pending.length)return false;let changed=false;const list=readLocal();for(const p of pending){try{const result=await uploadPhoto(p.id,p.blob);const idx=list.findIndex(x=>x.id===p.id);if(idx>=0){list[idx]=Object.assign({},list[idx],result,{photoPending:false,updatedAt:new Date().toISOString(),editedAt:new Date().toISOString()});changed=true;}await deletePendingPhoto(p.id);}catch(e){}}if(changed)writeLocal(list);return changed;}

  async function syncNow(){if(!configured()||!navigator.onLine){emit('offline','Saved offline — will sync later');return snapshot();}if(state.inFlight)return state.inFlight;state.inFlight=(async()=>{emit('syncing','Syncing moments…');try{await flushPhotos();const remoteRows=await pull();const localActive=readLocal(),localDeleted=readTombstones();const localMap=new Map([...localActive,...localDeleted].map(x=>[x.id,x]));const remoteMap=new Map(remoteRows.map(r=>[r.id,fromRemote(r)]));const ids=new Set([...localMap.keys(),...remoteMap.keys()]);const active=[],deleted=[],toPush=[];ids.forEach(id=>{const l=localMap.get(id),r=remoteMap.get(id);let winner;if(!l)winner=r;else if(!r){winner=l;toPush.push(toRemote(l,!!l.deletedAt));}else{const lt=new Date(l.updatedAt||0).getTime(),rt=new Date(r.updatedAt||0).getTime();winner=lt>rt?l:r;if(lt>rt)toPush.push(toRemote(l,!!l.deletedAt));}if(winner?.deletedAt)deleted.push(winner);else if(winner)active.push(winner);});await push(toPush);active.sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));writeLocal(active);writeTombstones(deleted);state.lastSyncAt=new Date().toISOString();writeJSON(META_KEY,{lastSyncAt:state.lastSyncAt});emit('synced','Synced across families');root.document?.dispatchEvent(new CustomEvent(EVENTS.changed,{detail:{count:active.length}}));return snapshot();}catch(error){emit('error',navigator.onLine?'Sync unavailable — saved on this device':'Saved offline — will sync later',error?.message||String(error));return snapshot();}finally{state.inFlight=null;}})();return state.inFlight;}
  function queueSync(delay=350){clearTimeout(state.timer);state.timer=setTimeout(syncNow,delay);}
  function initialise(){readLocal();root.addEventListener?.('online',()=>queueSync(50));root.document?.addEventListener('visibilitychange',()=>{if(root.document.visibilityState==='visible')queueSync(100);});root.setInterval?.(()=>{if(root.document?.visibilityState==='visible')syncNow();},30000);}
  root.MOMENT_SYNC=Object.freeze({EVENTS,getState:snapshot,normalizeRecord,readLocal,writeLocal,markDeleted,stagePhoto,syncNow,queueSync,isConfigured:configured});initialise();
})(globalThis);
