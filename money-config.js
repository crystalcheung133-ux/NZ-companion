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
  const state={status:'idle',message:'Saved on this device',lastSyncAt:null,error:null,timer:null,inFlight:null,paused:false};

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
  const LOG='[Supabase]';
  function configured(){return !!(config.enabled&&config.url&&config.anonKey&&config.tripId&&root.SUPABASE?.isConfigured?.());}
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
  function toRemote(record,deleted=false){const r=normalizeRecord(record);return{id:r.id,trip_id:config.tripId,payload:r,actor_family:(typeof root.getFriend==='function'?root.getFriend():null)||'lee',created_at:r.createdAt,updated_at:r.updatedAt,deleted_at:deleted?(r.deletedAt||r.updatedAt):null,generation:root.TRIP_GENERATION?.getLocal?.()||1};}
  function fromRemote(row){const payload=normalizeRecord(Object.assign({},row.payload||{},{id:row.id,createdAt:row.created_at,updatedAt:row.updated_at}));if(row.deleted_at)payload.deletedAt=row.deleted_at;return payload;}
  async function pull(){
    await ensureSession();
    const{data,error}=await withTimeout(
      client().from(table).select('id,payload,created_at,updated_at,deleted_at,actor_family').eq('trip_id',config.tripId).order('updated_at',{ascending:true})
    );
    if(error){console.error(LOG,'Supabase select failed',error.message,error);throw new Error(error.message||'Moments sync select failed');}
    console.log(LOG,'Moments pulled',(data||[]).length);
    return data||[];
  }
  async function push(records){
    if(!records.length)return;
    await ensureSession();
    const{error}=await withTimeout(client().from(table).upsert(records,{onConflict:'id'}));
    if(error){
      const rls=/row-level security|permission denied|policy/i.test(error.message||'');
      console.error(LOG,rls?'RLS rejected':'Supabase insert failed',error.message,error);
      throw new Error(error.message||'Moments sync upsert failed');
    }
    console.log(LOG,'Moment uploaded',records.map(r=>r.id).join(', '));
  }

  function openDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'id'});};req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>db.close();resolve(db);};req.onerror=()=>reject(req.error);});}
  function runDbTransaction(mode,operation){return openDb().then(db=>new Promise((resolve,reject)=>{let result;let settled=false;const finish=(ok,value)=>{if(settled)return;settled=true;try{db.close();}catch(e){}ok?resolve(value):reject(value);};let tx;try{tx=db.transaction(STORE,mode);result=operation(tx.objectStore(STORE));}catch(error){finish(false,error);return;}tx.oncomplete=()=>finish(true,result?.result);tx.onerror=()=>finish(false,tx.error||result?.error||new Error('Pending photo database transaction failed'));tx.onabort=()=>finish(false,tx.error||new Error('Pending photo database transaction aborted'));}));}
  async function storePendingPhoto(id,blob){await runDbTransaction('readwrite',store=>store.put({id,blob,type:blob.type||'image/jpeg',updatedAt:new Date().toISOString()}));}
  async function getPendingPhotos(){const rows=await runDbTransaction('readonly',store=>store.getAll());return rows||[];}
  async function deletePendingPhoto(id){try{await runDbTransaction('readwrite',store=>store.delete(id));}catch(e){}}
  function extension(type){return type==='image/png'?'png':'jpg';}
  function photoErrorMessage(error){
    return error?.message||error?.error_description||error?.details||String(error||'Photo upload failed');
  }
  async function uploadPhoto(id,blob){
    if(!(blob instanceof Blob)||!blob.size)throw new Error('Moment photo blob is empty or invalid');
    const session=await ensureSession();
    const contentType=blob.type==='image/png'?'image/png':'image/jpeg';
    const path=`${config.tripId}/${id}.${extension(contentType)}`;
    console.log(LOG,'Moment photo upload started',{id,path,type:contentType,size:blob.size,userId:session?.user?.id||null});
    const{error}=await client().storage.from(bucket).upload(path,blob,{upsert:true,contentType,cacheControl:'3600'});
    if(error){
      console.error(LOG,'Storage upload failed',{id,path,type:contentType,size:blob.size,statusCode:error.statusCode||error.status||null,message:photoErrorMessage(error),error});
      throw new Error(photoErrorMessage(error));
    }
    const{data:publicUrlData}=client().storage.from(bucket).getPublicUrl(path);
    const photoUrl=publicUrlData?.publicUrl||null;
    if(!photoUrl)throw new Error('Supabase returned no public photo URL');
    console.log(LOG,'Moment photo uploaded',{id,path,photoUrl});
    return{photoPath:path,photoUrl};
  }
  async function stagePhoto(id,blob){
    if(!blob)return null;
    await storePendingPhoto(id,blob);
    console.log(LOG,'Moment photo queued',{id,type:blob.type||null,size:blob.size||0,online:navigator.onLine});
    if(!navigator.onLine)return{photoPending:true,photoSyncError:null};
    try{
      const result=await uploadPhoto(id,blob);
      await deletePendingPhoto(id);
      return Object.assign({photoPending:false,photoSyncError:null},result);
    }catch(error){
      const message=photoErrorMessage(error);
      console.error(LOG,'Moment photo remains pending',{id,message,error});
      return{photoPending:true,photoSyncError:message};
    }
  }
  async function flushPhotos(){
    const pending=await getPendingPhotos();
    if(!pending.length)return false;
    console.log(LOG,'Retrying pending moment photos',pending.length);
    let changed=false;
    const list=readLocal();
    for(const p of pending){
      try{
        const result=await uploadPhoto(p.id,p.blob);
        const idx=list.findIndex(x=>x.id===p.id);
        if(idx>=0){
          list[idx]=Object.assign({},list[idx],result,{photoPending:false,photoSyncError:null,updatedAt:new Date().toISOString(),editedAt:new Date().toISOString()});
          changed=true;
        }
        await deletePendingPhoto(p.id);
      }catch(error){
        const message=photoErrorMessage(error);
        const idx=list.findIndex(x=>x.id===p.id);
        if(idx>=0&&list[idx].photoSyncError!==message){
          list[idx]=Object.assign({},list[idx],{photoPending:true,photoSyncError:message});
          changed=true;
        }
        console.error(LOG,'Pending moment photo retry failed',{id:p.id,message,error});
      }
    }
    if(changed)writeLocal(list);
    return changed;
  }

  async function syncNow(){if(state.paused){emit('paused','Sync paused for trip reset');return snapshot();}if(!configured()||!navigator.onLine){emit('offline','Saved offline — will sync later');return snapshot();}if(state.inFlight)return state.inFlight;state.inFlight=(async()=>{emit('syncing','Syncing moments…');try{
    const generationCheck=await root.TRIP_GENERATION?.ensureCurrentGeneration?.();
    if(generationCheck?.stale){
      // Trip was reset since this device last synced. Local moments/photos
      // for this device have already been wiped by TRIP_GENERATION — pull
      // whatever the (now-clean) cloud has and stop. Do NOT flush pending
      // photos or push anything: it's all pre-reset state.
      const remoteRows=await pull();
      const finalActive=remoteRows.map(fromRemote).filter(r=>!r.deletedAt);
      finalActive.sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
      writeLocal(finalActive);writeTombstones([]);
      state.lastSyncAt=new Date().toISOString();writeJSON(META_KEY,{lastSyncAt:state.lastSyncAt});
      emit('synced','Synced across families');
      root.document?.dispatchEvent(new CustomEvent(EVENTS.changed,{detail:{count:finalActive.length}}));
      return snapshot();
    }
    await flushPhotos();const remoteRows=await pull();const localActive=readLocal(),localDeleted=readTombstones();const localMap=new Map([...localActive,...localDeleted].map(x=>[x.id,x]));const remoteMap=new Map(remoteRows.map(r=>[r.id,fromRemote(r)]));const ids=new Set([...localMap.keys(),...remoteMap.keys()]);const active=[],deleted=[],toPush=[];ids.forEach(id=>{const l=localMap.get(id),r=remoteMap.get(id);let winner;if(!l)winner=r;else if(!r){winner=l;toPush.push(toRemote(l,!!l.deletedAt));}else{const lt=new Date(l.updatedAt||0).getTime(),rt=new Date(r.updatedAt||0).getTime();winner=lt>rt?l:r;if(lt>rt)toPush.push(toRemote(l,!!l.deletedAt));}if(winner?.deletedAt)deleted.push(winner);else if(winner)active.push(winner);});await push(toPush);active.sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));writeLocal(active);writeTombstones(deleted);state.lastSyncAt=new Date().toISOString();writeJSON(META_KEY,{lastSyncAt:state.lastSyncAt});emit('synced','Synced across families');root.document?.dispatchEvent(new CustomEvent(EVENTS.changed,{detail:{count:active.length}}));return snapshot();}catch(error){console.error(LOG,'Moments sync failed',error?.message||error);emit('error',navigator.onLine?'Sync unavailable — saved on this device':'Saved offline — will sync later',error?.message||String(error));return snapshot();}finally{state.inFlight=null;}})();return state.inFlight;}
  function queueSync(delay=350){if(state.paused)return;clearTimeout(state.timer);state.timer=setTimeout(syncNow,delay);}
  function pause(){state.paused=true;clearTimeout(state.timer);state.timer=null;emit('paused','Sync paused for trip reset');}
  async function clearPendingPhotos(){
    if(!('indexedDB' in root))return;
    await new Promise((resolve,reject)=>{const request=indexedDB.deleteDatabase(DB_NAME);request.onsuccess=()=>resolve();request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('Pending photo database is still in use'));});
  }
  /* Deletes every photo under this trip's folder in the Storage bucket and
     verifies the folder is empty afterwards. This module is the only place
     that knows the bucket name and the trip-folder path convention, so it
     stays the single owner of this logic — reset-runtime.js calls this
     rather than re-implementing bucket/path handling itself. Cloud ROW
     deletion (trip_moments) is NOT done here — that happens once, inside
     the reset_trip() database RPC, called by reset-runtime.js. */
  async function resetCloudPhotos(){
    if(!configured()||!navigator.onLine)throw new Error('An internet connection is required to reset cloud photos.');
    await ensureSession();
    const {data:files,error:listError}=await client().storage.from(bucket).list(config.tripId,{limit:1000});
    if(listError)throw new Error(listError.message||'Unable to list cloud moment photos');
    const paths=(files||[]).filter(file=>file?.name).map(file=>`${config.tripId}/${file.name}`);
    if(!paths.length)return{removed:0};
    const {data:removedFiles,error:removeError}=await client().storage.from(bucket).remove(paths);
    if(removeError)throw new Error(removeError.message||'Cloud photo reset failed');
    const {data:remainingFiles,error:photoVerifyError}=await client().storage.from(bucket).list(config.tripId,{limit:1});
    if(photoVerifyError)throw new Error(photoVerifyError.message||'Unable to verify cloud photo reset');
    if((remainingFiles||[]).some(file=>file?.name)){
      throw new Error(`Cloud photos were not deleted. Supabase Storage DELETE policy has not been applied (requested ${paths.length}, removed ${(removedFiles||[]).length}). Run SUPABASE_STAGE_11_RESET_ARCHITECTURE.sql, then try Reset again.`);
    }
    return{removed:(removedFiles||[]).length};
  }
  /* Removes the legacy one-per-place moment_<key> / moment_latest_<key>
     localStorage entries. The writer for plain moment_<key> keys was
     removed in Stage 4C-4, but renderMoments() in moments.js still scans
     every localStorage key for this prefix (to keep any pre-4C-4 data
     visible) and merges whatever it finds into the rendered feed. That
     scan runs independently of moments_list/EXPENSE_SYNC's own state, so
     a device that still carries one of these keys from years-ago usage
     would have it silently resurface after moments_list was wiped — the
     very failure mode Reset exists to prevent, just via a different
     mechanism than cloud sync. This is why clearLocal(), not just the
     Reset button flow, is responsible for removing them: it must happen
     on every device that wipes its local moments, not only the one that
     pressed the button. */
  function clearLegacyMomentKeys(){
    const prefixes=[root.STORAGE_CONFIG?.keys?.momentPrefix,root.STORAGE_CONFIG?.keys?.latestMomentPrefix].filter(Boolean);
    if(!prefixes.length)return;
    for(let i=localStorage.length-1;i>=0;i--){
      const k=localStorage.key(i);
      if(k && prefixes.some(prefix=>k.startsWith(prefix))) localStorage.removeItem(k);
    }
  }
  /* Clears this device's local moment store only (list, tombstones, sync
     meta, pending-photo IndexedDB queue, legacy per-place keys). Does NOT
     touch the cloud. Called both by reset-runtime.js (the device that
     pressed Reset) and by generation-runtime.js (any other device that
     detects the trip was reset out from under it). */
  async function clearLocal(){
    writeLocal([]);writeTombstones([]);await clearPendingPhotos();clearLegacyMomentKeys();
    try{storage?.remove?storage.remove(META_KEY):localStorage.removeItem(META_KEY);}catch(e){}
    state.lastSyncAt=null;state.error=null;
  }
  function initialise(){readLocal();root.addEventListener?.('online',()=>queueSync(50));root.document?.addEventListener('visibilitychange',()=>{if(root.document.visibilityState==='visible')queueSync(100);});root.setInterval?.(()=>{if(root.document?.visibilityState==='visible')syncNow();},30000);}
  root.MOMENT_SYNC=Object.freeze({EVENTS,getState:snapshot,normalizeRecord,readLocal,writeLocal,markDeleted,stagePhoto,syncNow,queueSync,pause,clearPendingPhotos,clearLocal,resetCloudPhotos,isConfigured:configured});initialise();
})(globalThis);
