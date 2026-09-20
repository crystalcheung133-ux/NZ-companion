/* booking-sync-runtime.js — single-writer Booking Authority cross-device sync.
   Studio is the only writer; all devices pull the latest authority state.
   This channel is intentionally independent from whole-trip publication. */
(function(root){'use strict';
  const cfg=root.SYNC_CONFIG||{}, table=cfg.tables?.bookings||'trip_bookings';
  const ROW_ID='booking-authority-v1';
  const state={timer:null,inFlight:null,lastSyncAt:null,status:'idle'};
  function configured(){return !!(cfg.enabled&&cfg.url&&cfg.anonKey&&cfg.tripId&&root.SUPABASE?.isConfigured?.()&&root.BOOKING_AUTHORITY);}
  function iso(v){const d=new Date(v||0);return Number.isNaN(d.getTime())?0:d.getTime();}
  async function session(){return root.SUPABASE.getSession();}
  function client(){return root.SUPABASE.getClient();}
  async function pull(){
    await session();
    const q=await client().from(table).select('payload,updated_at').eq('trip_id',cfg.tripId).eq('id',ROW_ID).maybeSingle();
    if(q.error)throw q.error; return q.data||null;
  }
  async function push(local){
    await session();
    const row={id:ROW_ID,trip_id:cfg.tripId,payload:local,updated_at:local.updatedAt||new Date().toISOString()};
    const q=await client().from(table).upsert(row,{onConflict:'id'}); if(q.error)throw q.error;
  }
  async function syncNow(options={}){
    if(!configured()||!navigator.onLine)return {status:'offline'};
    if(state.inFlight)return state.inFlight;
    state.inFlight=(async()=>{
      state.status='syncing';
      try{
        const local=root.BOOKING_AUTHORITY.read();
        if(options.forcePush===true&&local.updatedAt){
          // Studio is the sole writer: the just-saved local mutation is authoritative.
          await push(local);
        }else{
          const remoteRow=await pull(); const remote=remoteRow?.payload;
          const lt=iso(local.updatedAt), rt=iso(remote?.updatedAt||remoteRow?.updated_at);
          if(remote&&rt>lt){
            root.BOOKING_AUTHORITY.replaceState(remote);
            document.dispatchEvent(new CustomEvent('travelengine:bookingchange',{detail:{remote:true,local:false,sync:true}}));
          }else if(local.updatedAt&&(!remote||lt>rt)){
            await push(local);
          }
        }
        state.lastSyncAt=new Date().toISOString();state.status='synced';
        document.dispatchEvent(new CustomEvent('travelengine:bookingsyncchanged',{detail:{lastSyncAt:state.lastSyncAt}}));
        return {status:'synced',lastSyncAt:state.lastSyncAt};
      }catch(e){state.status='error';return {status:'error',error:e?.message||String(e)};}
      finally{state.inFlight=null;}
    })(); return state.inFlight;
  }
  function queueSync(delay=250,options){clearTimeout(state.timer);state.timer=setTimeout(()=>syncNow(options),delay);}
  document.addEventListener('travelengine:bookingchange',e=>{if(e.detail?.local===true)queueSync(50,{forcePush:true});});
  addEventListener('online',()=>queueSync(50));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')queueSync(100);});
  setInterval(()=>{if(document.visibilityState==='visible')syncNow();},30000);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>queueSync(0),{once:true});else queueSync(0);
  function enabled(){return configured();}
  async function push(){
    if(state.inFlight)await state.inFlight;
    return syncNow({forcePush:true});
  }
  root.BOOKING_SYNC=Object.freeze({enabled,syncNow,push,queueSync,getState:()=>Object.freeze({...state,timer:undefined,inFlight:undefined})});
})(globalThis);
