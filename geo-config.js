/* generation-runtime.js — RC11R4 Reset Architecture Root Repair
   Canonical trip-generation module. This is the ONE place that:
     - knows what generation this device last saw
     - knows how to ask the cloud what generation the trip is on now
     - owns the "wipe cloud-synced local data" routine, so EXPENSE_SYNC and
       MOMENT_SYNC each own how to clear their own store, but nothing outside
       this file decides WHEN that clearing should happen.

   Root cause this exists to fix (see RC11R4-ROOT-CAUSE-REPORT.md):
   Reset used to delete cloud rows/photos but had no way to tell a stale
   client "the trip was reset" versus "you just have offline edits". A
   stale client's sync merge saw "record exists locally, missing from
   cloud" and — correctly, for the offline-edit case — re-uploaded it. For
   the reset case that re-upload resurrects deleted data. Generation is the
   fact that distinguishes the two cases: offline edits keep the same
   generation as the cloud; a reset changes it.

   Every sync engine MUST call ensureCurrentGeneration() before it pulls/
   merges/pushes anything, and MUST stamp its own generation on every row
   it pushes (see EXPENSE_SYNC/MOMENT_SYNC toRemote()). The database also
   validates the stamp independently (see SUPABASE_STAGE_11_RESET_ARCHITECTURE.sql)
   so a frontend bug alone can't resurrect old-generation rows. */
(function(root){
  'use strict';

  const config=root.SYNC_CONFIG||{};
  const storage=root.STORAGE?.local;
  const KEY=()=>root.STORAGE_CONFIG?.keys?.tripGeneration||'travel_engine_trip_generation_v1';
  const LOG='[Generation]';
  const state={checkPromise:null};

  function readJSON(k,fallback){try{return storage?.readJSON?storage.readJSON(k,fallback):(JSON.parse(localStorage.getItem(k)||'null')??fallback);}catch(e){return fallback;}}
  function writeJSON(k,v){try{storage?.writeJSON?storage.writeJSON(k,v):localStorage.setItem(k,JSON.stringify(v));}catch(e){}}

  function getLocal(){
    const n=Number(readJSON(KEY(),1));
    return Number.isFinite(n)&&n>=1?n:1;
  }
  function setLocal(n){
    const value=Number(n);
    if(!Number.isFinite(value)||value<1)return;
    writeJSON(KEY(),value);
  }

  function client(){
    if(!root.SUPABASE?.getClient)throw new Error('Shared Supabase client runtime unavailable');
    return root.SUPABASE.getClient();
  }
  async function ensureSession(){
    if(!root.SUPABASE?.getSession)throw new Error('Shared Supabase client runtime unavailable');
    return root.SUPABASE.getSession();
  }
  function configured(){return !!(config.enabled&&config.url&&config.anonKey&&config.tripId&&root.SUPABASE?.isConfigured?.());}
  const table=()=>config.tables?.generation||'trip_generation';

  /* Returns the trip's current generation from the database, or null if it
     can't be determined right now (offline, not configured, migration not
     yet applied). null means "unknown" — callers must treat that as
     "assume not stale", never as "assume 1", so a fresh device that just
     hasn't loaded the migration doesn't erroneously wipe good data. */
  async function fetchCloudGeneration(){
    if(!configured()||!navigator.onLine)return null;
    try{
      await ensureSession();
      const {data,error}=await client().from(table()).select('generation').eq('trip_id',config.tripId).maybeSingle();
      if(error){
        console.warn(LOG,'Could not read trip_generation (migration may not be applied yet):',error.message);
        return null;
      }
      const generation=Number(data?.generation);
      return Number.isFinite(generation)&&generation>=1?generation:null;
    }catch(error){
      console.warn(LOG,'Generation check failed',error?.message||error);
      return null;
    }
  }

  /* The single wipe routine for cloud-synced trip data. Deliberately scoped
     to ONLY what a reset invalidates: moments, expenses, their photos,
     pending uploads, tombstones and sync metadata. Device-local-only state
     (checklist ticks, itinerary overrides, admin drafts, trip-completion
     notes) is NOT touched here — those never round-trip through the cloud,
     so a reset on a different device has no bearing on them. The Reset
     button flow (reset-runtime.js) clears that extra device-local state
     itself, separately, because pressing Reset on THIS device is an
     explicit request for a fully clean device — detecting someone else's
     reset is not. */
  async function clearSyncedLocalData(){
    try{window.EXPENSE_SYNC?.clearLocal?.();}catch(e){console.error(LOG,'Failed clearing local expenses',e);}
    try{await window.MOMENT_SYNC?.clearLocal?.();}catch(e){console.error(LOG,'Failed clearing local moments',e);}
  }

  /* Call at the start of every sync cycle, before pull/merge/push. If the
     cloud is on a newer generation than this device, wipes local
     cloud-synced data, adopts the new generation, and tells the caller not
     to upload anything this cycle — the caller must re-pull fresh instead. */
  async function ensureCurrentGeneration(){
    if(state.checkPromise)return state.checkPromise;
    state.checkPromise=(async()=>{
      const cloudGeneration=await fetchCloudGeneration();
      const localGeneration=getLocal();
      if(cloudGeneration==null)return{stale:false,generation:localGeneration};
      if(cloudGeneration>localGeneration){
        console.warn(LOG,`Cloud generation ${cloudGeneration} > local ${localGeneration} — trip was reset. Clearing local data, not uploading.`);
        await clearSyncedLocalData();
        setLocal(cloudGeneration);
        return{stale:true,generation:cloudGeneration};
      }
      if(cloudGeneration<localGeneration){
        // Should not happen — generation only increases. A stale/cached
        // read is more likely than the trip having "un-reset". Ignore
        // rather than rewind local state.
        console.warn(LOG,`Cloud generation ${cloudGeneration} < local ${localGeneration}; ignoring stale read`);
      }
      return{stale:false,generation:localGeneration};
    })();
    try{return await state.checkPromise;}
    finally{state.checkPromise=null;}
  }

  root.TRIP_GENERATION=Object.freeze({getLocal,setLocal,fetchCloudGeneration,ensureCurrentGeneration,clearSyncedLocalData});
})(globalThis);
