/* Analytics System v1 — additive, failure-isolated product instrumentation.
   Captures coarse traveller behaviour only. No content, amounts, photos,
   precise location, fingerprints, or typed values are collected. */
(function(root){
  'use strict';
  const LOG='[Analytics]';
  const cfg=root.SYNC_CONFIG||{};
  const table=cfg.tables&&cfg.tables.analytics||'trip_analytics_events';
  const storage=root.STORAGE;
  const keys=root.STORAGE_CONFIG&&root.STORAGE_CONFIG.keys||{};
  const QUEUE_KEY=keys.analyticsQueue||((root.TRIP_CONFIG?.storageNamespace||'trip')+':analytics_queue:v1');
  const SESSION_KEY=keys.analyticsSession||'travel_engine_analytics_session_v1';
  const MAX_QUEUE=500;
  const state={timer:null,inFlight:null,lastSignature:'',lastAt:0,activeGuideKey:null};

  function uuid(){
    try{if(root.crypto&&typeof root.crypto.randomUUID==='function')return root.crypto.randomUUID();}catch(e){}
    return 'a-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);
  }
  function sessionId(){
    try{
      let id=storage?.session?.get(SESSION_KEY,null)||root.sessionStorage?.getItem(SESSION_KEY);
      if(!id){id=uuid(); if(storage?.session)storage.session.set(SESSION_KEY,id);else root.sessionStorage?.setItem(SESSION_KEY,id);}
      return id;
    }catch(e){return uuid();}
  }
  function travellerId(){
    try{return typeof root.getFriend==='function'?root.getFriend():(storage?.local?.get(keys.friend,root.TRIP_CONFIG?.participants?.defaultKey||'unknown'));}
    catch(e){return root.TRIP_CONFIG?.participants?.defaultKey||'unknown';}
  }
  function isAdmin(){
    try{return typeof root.isAdminMode==='function'&&root.isAdminMode();}catch(e){return false;}
  }
  function pageInfo(){
    const file=(root.location?.pathname||'').split('/').pop()||'index.html';
    const map={
      'index.html':'Home','itinerary.html':'Days','day.html':'Days','guide.html':'Guide',
      'place.html':'Guide','trip.html':'Booking','expenses.html':'Expenses','moments.html':'Moments','memory.html':'Moments'
    };
    return {file,pageType:map[file]||'Other'};
  }
  function cleanMeta(meta){
    const src=meta&&typeof meta==='object'?meta:{}; const out={};
    Object.keys(src).slice(0,8).forEach(k=>{
      const v=src[k]; if(v==null)return;
      if(['string','number','boolean'].includes(typeof v))out[k]=typeof v==='string'?v.slice(0,120):v;
    });
    return out;
  }
  function readQueue(){try{const q=storage?.local?.readJSON(QUEUE_KEY,[]);return Array.isArray(q)?q:[];}catch(e){return [];}}
  function writeQueue(q){try{return !!storage?.local?.writeJSON(QUEUE_KEY,q.slice(-MAX_QUEUE));}catch(e){return false;}}
  function enqueue(event){const q=readQueue();q.push(event);writeQueue(q);}
  function sameTooSoon(sig){const now=Date.now();if(sig===state.lastSignature&&now-state.lastAt<900)return true;state.lastSignature=sig;state.lastAt=now;return false;}
  function track(eventType,details){
    try{
      const d=details||{}; const p=pageInfo();
      const sig=[eventType,p.file,d.entityType||'',d.entityId||'',JSON.stringify(cleanMeta(d.metadata))].join('|');
      if(sameTooSoon(sig))return null;
      const admin=isAdmin();
      const event={
        event_id:uuid(),trip_id:String(cfg.tripId||root.TRIP_CONFIG?.storageNamespace||''),traveller_id:String(travellerId()||'unknown'),
        session_id:sessionId(),actor_type:admin?'admin':'traveller',event_type:String(eventType),page_type:String(d.pageType||p.pageType),
        entity_type:d.entityType?String(d.entityType):null,entity_id:d.entityId!=null?String(d.entityId):null,
        metadata:cleanMeta(d.metadata),occurred_at:new Date().toISOString()
      };
      enqueue(event); queueSync(120); return event.event_id;
    }catch(e){return null;}
  }
  async function syncNow(){
    if(state.inFlight)return state.inFlight;
    state.inFlight=(async()=>{
      try{
        if(!root.navigator?.onLine||!root.SUPABASE?.isConfigured?.())return {ok:false,reason:'offline-or-unconfigured'};
        const q=readQueue(); if(!q.length)return {ok:true,count:0};
        await root.SUPABASE.getSession();
        const client=root.SUPABASE.getClient();
        const batch=q.slice(0,100);
        const api=client.from(table);
        const {error}=await api.insert(batch);
        if(error){
          // A previous request may have reached Supabase but failed before the
          // local queue was cleared. In that rare case, retry rows one-by-one
          // and treat primary-key duplicates as already delivered. This keeps
          // the browser on INSERT-only privileges; analytics never needs
          // SELECT or UPDATE permission merely to de-duplicate delivery.
          if(String(error.code||'')!=='23505')throw error;
          const delivered=[];
          for(const row of batch){
            const result=await client.from(table).insert(row);
            if(!result.error||String(result.error.code||'')==='23505')delivered.push(row.event_id);
            else throw result.error;
          }
          const ids=new Set(delivered); writeQueue(readQueue().filter(x=>!ids.has(x.event_id)));
          return {ok:true,count:delivered.length,recoveredDuplicates:true};
        }
        const ids=new Set(batch.map(x=>x.event_id)); writeQueue(readQueue().filter(x=>!ids.has(x.event_id)));
        return {ok:true,count:batch.length};
      }catch(error){
        console.warn(LOG,'sync unavailable; events remain queued',error?.message||error);return {ok:false,error:String(error?.message||error)};
      }finally{state.inFlight=null;}
    })();
    return state.inFlight;
  }
  function queueSync(delay){clearTimeout(state.timer);state.timer=setTimeout(syncNow,delay||250);}
  function trackPageView(){
    const p=pageInfo(); const params=new URLSearchParams(root.location?.search||'');
    const d={pageType:p.pageType,entityType:'page',entityId:p.file,metadata:{}};
    if(p.file==='day.html'){d.entityType='day';d.entityId=params.get('day')||'unknown';d.metadata.day=d.entityId;}
    if(p.file==='place.html'){d.entityType='guide';d.entityId=params.get('placeId')||params.get('legacyPlaceId')||params.get('id')||'unknown';state.activeGuideKey=d.entityId;}
    track('page_view',d);
    if(p.file==='place.html'&&d.entityId!=='unknown'){
      const g=root.GenerationSelectionAdapter?.view?.('guide')?.places?.[d.entityId];
      track('guide_open',{pageType:'Guide',entityType:'guide',entityId:d.entityId,metadata:{category:g?.cat||'',source:'place_page'}});
    }
  }
  function wrap(name,handler){
    const original=root[name]; if(typeof original!=='function'||original.__analyticsWrapped)return;
    function wrapped(){try{handler.apply(this,arguments);}catch(e){}return original.apply(this,arguments);}
    wrapped.__analyticsWrapped=true; root[name]=wrapped;
  }
  function installWrappers(){
    wrap('toggleGuideMenu',function(){track('page_view',{pageType:'Guide',entityType:'page',entityId:'guide_menu'});});
    wrap('openGuideCategory',function(cat){track('guide_category_open',{pageType:'Guide',entityType:'guide_category',entityId:cat});});
    wrap('openGuideModal',function(key,options){state.activeGuideKey=key;const g=root.GenerationSelectionAdapter?.view?.('guide')?.places?.[key];track('guide_open',{pageType:'Guide',entityType:'guide',entityId:key,metadata:{category:g?.cat||'',from_options:!!options?.fromAlternatives}});});
    wrap('openGuideAlternatives',function(keys,itemId){track('options_open',{pageType:'Guide',entityType:'guide_group',entityId:itemId||'',metadata:{option_count:Array.isArray(keys)?keys.length:0}});});
    wrap('openGuideLinkedBooking',function(bookingId){track('booking_link_use',{pageType:'Guide',entityType:'booking',entityId:bookingId,metadata:{source:'guide'}});});
    wrap('openTripCard',function(key){track('booking_centre_open',{pageType:'Booking',entityType:'trip_section',entityId:key});});
    wrap('openAccommodationDetail',function(id){track('booking_open',{pageType:'Booking',entityType:'booking',entityId:id,metadata:{booking_type:'accommodation'}});});
    wrap('openActivityBookingDetail',function(id){track('booking_open',{pageType:'Booking',entityType:'booking',entityId:id,metadata:{booking_type:'activity'}});});
    wrap('openExpenseModal',function(){track('expense_entry_open',{pageType:'Expenses',entityType:'feature',entityId:'expense_entry'});});
  }
  function clickTracking(event){
    try{
      const el=event.target?.closest?.('a,button'); if(!el)return;
      const text=(el.textContent||'').trim(); const href=el.getAttribute('href')||'';
      if(el.matches('.map-button')||/^Navigate/i.test(text)||/Navigate to/i.test(text)){
        track('navigate_use',{entityType:state.activeGuideKey?'guide':'action',entityId:state.activeGuideKey||'navigate',metadata:{source:state.activeGuideKey?'guide':'booking'}});return;
      }
      if(el.matches('.day-jump-button')||(href&&/day\.html\?day=/.test(href)&&el.closest('.guide-sheet,.place-detail,.guide-card'))){
        const m=href.match(/[?&]day=(\d+)/);track('guide_day_link_use',{pageType:'Guide',entityType:'day',entityId:m?m[1]:'unknown',metadata:{guide_id:state.activeGuideKey||''}});return;
      }
      if(/day\.html\?day=/.test(href)){const m=href.match(/[?&]day=(\d+)/);track('day_open',{pageType:'Days',entityType:'day',entityId:m?m[1]:'unknown'});}
    }catch(e){}
  }
  function initialise(){
    installWrappers(); trackPageView(); document.addEventListener('click',clickTracking,true);
    root.addEventListener('online',()=>queueSync(50));
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')queueSync(100);});
    setInterval(()=>{if(document.visibilityState==='visible')syncNow();},30000);
  }
  root.ANALYTICS=Object.freeze({track,trackPageView,syncNow,queueSync,readQueue,isAdminExcluded:()=>isAdmin()});
  if(root.document){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialise,{once:true});else setTimeout(initialise,0);}
})(globalThis);
