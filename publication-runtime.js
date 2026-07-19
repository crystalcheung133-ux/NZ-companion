/* publication-runtime.js — Stage 9B-1 safe publication builder.
   Builds the next trip_publications snapshot from the active companion data.
   It deliberately does not write to Supabase from the browser: the public
   publishable key remains read-only under RLS. Admin downloads one SQL file
   and runs it in Supabase SQL Editor. */
(function(root){
  'use strict';

  const OVERRIDES_KEY=(root.STORAGE_CONFIG&&root.STORAGE_CONFIG.keys&&root.STORAGE_CONFIG.keys.itineraryOverrides)||'travel_engine_itinerary_overrides_v1';
  const state={busy:false,lastPreparedVersion:null};

  function clone(value){ return value==null?value:JSON.parse(JSON.stringify(value)); }
  function localStore(){ return root.STORAGE&&root.STORAGE.local?root.STORAGE.local:null; }
  function readOverrides(){
    const store=localStore();
    const value=store?store.readJSON(OVERRIDES_KEY,{}):{};
    return value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  }
  function mergedItinerary(){
    const itinerary=clone(root.ITINERARY_DATA||{});
    const overrides=readOverrides();
    Object.keys(overrides).forEach(function(day){
      if(!Array.isArray(overrides[day]))return;
      if(!itinerary[day]||typeof itinerary[day]!=='object')itinerary[day]={dayId:'day'+day};
      itinerary[day].items=clone(overrides[day]);
    });
    return itinerary;
  }
  function buildPayload(){
    return {
      data:{
        places:clone(root.PLACES||{}),
        categories:clone(root.CATEGORIES||{}),
        guideOrder:clone(root.GUIDE_ORDER||[]),
        dayLinks:clone(root.DAY_LINKS||{}),
        friends:clone(root.FRIENDS||{}),
        bookingsData:clone(root.BOOKINGS_DATA||{}),
        tripData:clone(root.TRIP_DATA||{}),
        tripOrder:clone(root.TRIP_ORDER||[]),
        itineraryData:mergedItinerary()
      }
    };
  }
  function escapeSqlText(value){ return String(value).replace(/'/g,"''"); }
  function filename(version){
    const date=new Date().toISOString().slice(0,10).replace(/-/g,'');
    return 'SUPABASE_PUBLICATION_V'+version+'_'+date+'.sql';
  }
  function download(name,text){
    const blob=new Blob([text],{type:'application/sql;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const anchor=document.createElement('a');
    anchor.href=url;anchor.download=name;anchor.hidden=true;
    document.body.appendChild(anchor);anchor.click();anchor.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},1000);
  }
  function currentRemoteVersion(){
    const sync=root.TRIP_SYNC&&root.TRIP_SYNC.getState?root.TRIP_SYNC.getState():null;
    return sync&&Number.isFinite(Number(sync.remoteVersion))?Number(sync.remoteVersion):0;
  }
  async function resolveNextVersion(){
    let latest=currentRemoteVersion();
    if(root.TRIP_SYNC&&typeof root.TRIP_SYNC.fetchLatestPublished==='function'&&navigator.onLine!==false){
      const result=await root.TRIP_SYNC.fetchLatestPublished({reloadOnChange:false});
      if(result&&result.snapshot&&Number.isFinite(Number(result.snapshot.version)))latest=Number(result.snapshot.version);
    }
    return Math.max(0,latest)+1;
  }
  function makeSql(version,payload){
    const cfg=root.SYNC_CONFIG||{};
    const tripId=escapeSqlText(cfg.tripId||'nz-family-2026');
    const schemaVersion=Number(cfg.schemaVersion)||1;
    const json=escapeSqlText(JSON.stringify(payload));
    return `-- NZ Companion publication v${version}\n-- Generated safely in Trip Studio. Review, then run in Supabase SQL Editor.\n-- This inserts a new immutable publication row; it does not update or delete older versions.\n\ninsert into public.trip_publications\n  (trip_id, schema_version, version, published_at, published_by, payload)\nvalues\n  ('${tripId}', ${schemaVersion}, ${version}, now(), 'trip-studio-safe-builder', '${json}'::jsonb);\n\nselect\n  trip_id, schema_version, version, published_at, published_by,\n  jsonb_typeof(payload) as data_type,\n  jsonb_array_length(payload->'data'->'guideOrder') as guide_count,\n  jsonb_object_length(payload->'data'->'places') as place_count,\n  jsonb_object_length(payload->'data'->'itineraryData') as day_count\nfrom public.trip_publications\nwhere trip_id='${tripId}' and schema_version=${schemaVersion}\norder by version desc\nlimit 1;\n`;
  }
  function updateButton(status){
    const button=document.getElementById('preparePublicationButton');
    if(!button)return;
    button.disabled=state.busy;
    const strong=button.querySelector('strong');
    const small=button.querySelector('small');
    if(strong)strong.textContent=state.busy?'Preparing publication…':'Prepare Cloud Publication';
    if(small)small.textContent=status||'Build the next version as a Supabase SQL file.';
  }
  async function prepare(){
    if(state.busy)return false;
    if(!root.isAdminMode||!root.isAdminMode()){
      alert('Open Trip Studio before preparing a publication.');return false;
    }
    if(root.hasUnsavedAdminChanges&&root.hasUnsavedAdminChanges()){
      alert('Save pending Trip Studio changes before preparing a publication.');return false;
    }
    state.busy=true;updateButton('Checking the latest cloud version…');
    try{
      const version=await resolveNextVersion();
      const payload=buildPayload();
      download(filename(version),makeSql(version,payload));
      state.lastPreparedVersion=version;
      updateButton('Version '+version+' is ready. Run the downloaded SQL in Supabase.');
      alert('Cloud publication v'+version+' is ready.\n\nRun the downloaded SQL file in Supabase SQL Editor. Nothing has been uploaded from the browser.');
      document.dispatchEvent(new CustomEvent('travelengine:publicationprepared',{detail:{version:version}}));
      return true;
    }catch(error){
      console.error('Publication preparation failed',error);
      updateButton('Could not prepare the publication. Try again while online.');
      alert('Could not prepare the publication. '+(error&&error.message?error.message:''));
      return false;
    }finally{
      state.busy=false;setTimeout(function(){updateButton();},5000);
    }
  }
  function installButton(){
    const group=document.getElementById('tripStudioManagement');
    if(!group||document.getElementById('preparePublicationButton'))return;
    const button=document.createElement('button');
    button.id='preparePublicationButton';button.type='button';button.className='trip-studio-action publication-prepare-btn';button.hidden=!(root.isAdminMode&&root.isAdminMode());
    button.innerHTML='<span><strong>Prepare Cloud Publication</strong><small>Build the next version as a Supabase SQL file.</small></span><span aria-hidden="true">☁️</span>';
    button.addEventListener('click',prepare);group.appendChild(button);
  }
  function reflectMode(){
    installButton();
    const button=document.getElementById('preparePublicationButton');
    if(button)button.hidden=!(root.isAdminMode&&root.isAdminMode());
  }

  root.TRIP_PUBLICATION=Object.freeze({buildPayload:buildPayload,prepare:prepare,getLastPreparedVersion:function(){return state.lastPreparedVersion;}});
  root.prepareCloudPublication=prepare;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){installButton();reflectMode();},{once:true});
  else {installButton();reflectMode();}
  document.addEventListener('travelengine:adminmodechange',reflectMode);
})(globalThis);
