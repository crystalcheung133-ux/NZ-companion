/* publication-runtime.js — RC13 one-click Supabase publication.
   Builds the immutable trip snapshot locally, then calls the server-side
   publish_trip_snapshot RPC. The database allocates the next version under
   a transaction lock; no SQL download or service-role key is used. */
(function(root){
  'use strict';

  const OVERRIDES_KEY=(root.STORAGE_CONFIG&&root.STORAGE_CONFIG.keys&&root.STORAGE_CONFIG.keys.itineraryOverrides)||'travel_engine_itinerary_overrides_v1';
  const state={busy:false,lastPublishedVersion:null};

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
  function currentRemoteVersion(){
    const sync=root.TRIP_SYNC&&root.TRIP_SYNC.getState?root.TRIP_SYNC.getState():null;
    return sync&&Number.isFinite(Number(sync.remoteVersion))?Number(sync.remoteVersion):0;
  }
  function publicationStatusText(){
    const current=state.lastPublishedVersion||currentRemoteVersion();
    return current>0?'Latest published version: v'+current+'.':'Publish the saved trip directly to every Companion.';
  }
  function updateButton(status){
    const button=document.getElementById('preparePublicationButton');
    if(!button)return;
    button.disabled=state.busy;
    const strong=button.querySelector('strong');
    const small=button.querySelector('small');
    if(strong)strong.textContent=state.busy?'Publishing…':'Publish Latest Trip';
    if(small)small.textContent=status||publicationStatusText();
  }
  function rpcResultVersion(data){
    const row=Array.isArray(data)?data[0]:data;
    const version=Number(row&&row.version);
    return Number.isFinite(version)&&version>0?version:null;
  }
  function readableError(error){
    const message=error&&error.message?String(error.message):'Unknown publishing error';
    if(/function .* does not exist|Could not find the function|PGRST202/i.test(message)){
      return 'One-click Publish is not installed in Supabase yet. Run SUPABASE_STAGE_13_ONE_CLICK_PUBLISH.sql once, then try again.';
    }
    if(/Invalid Trip Studio credential/i.test(message))return 'Supabase rejected the Trip Studio credential.';
    return message;
  }
  async function publish(){
    if(state.busy)return false;
    if(!root.isAdminMode||!root.isAdminMode()){
      alert('Open Trip Studio before publishing.');return false;
    }
    if(root.hasUnsavedAdminChanges&&root.hasUnsavedAdminChanges()){
      alert('Save pending Trip Studio changes before publishing.');return false;
    }
    if(navigator.onLine===false){
      alert('Publishing needs an internet connection.');return false;
    }
    if(!root.SUPABASE||typeof root.SUPABASE.getClient!=='function'||typeof root.SUPABASE.getSession!=='function'){
      alert('Supabase is not available on this device.');return false;
    }
    const credential=typeof root.getAdminPublishCredential==='function'?root.getAdminPublishCredential():null;
    if(!credential){
      alert('Trip Studio session has expired. Close and reopen Trip Studio.');return false;
    }
    const confirmed=root.confirm('Publish the latest saved trip now?\n\nEvery Companion will receive the new version when it next connects.');
    if(!confirmed)return false;

    state.busy=true;updateButton('Creating a new immutable cloud version…');
    try{
      await root.SUPABASE.getSession();
      const cfg=root.SYNC_CONFIG||{};
      const rpcName=cfg.rpc&&cfg.rpc.publishTrip?cfg.rpc.publishTrip:'publish_trip_snapshot';
      const payload=buildPayload();
      const result=await root.SUPABASE.getClient().rpc(rpcName,{
        p_trip_id:cfg.tripId||'nz-family-2026',
        p_schema_version:Number(cfg.schemaVersion)||1,
        p_payload:payload,
        p_admin_pin:credential
      });
      if(result&&result.error)throw result.error;
      const version=rpcResultVersion(result&&result.data);
      if(!version)throw new Error('Supabase returned no publication version.');
      state.lastPublishedVersion=version;
      updateButton('Published successfully · v'+version);

      if(root.TRIP_SYNC&&typeof root.TRIP_SYNC.fetchLatestPublished==='function'){
        await root.TRIP_SYNC.fetchLatestPublished({reloadOnChange:false});
      }
      document.dispatchEvent(new CustomEvent('travelengine:publicationpublished',{detail:{version:version}}));
      alert('Trip published successfully.\n\nCloud version v'+version+' is now live.');
      return true;
    }catch(error){
      console.error('One-click publication failed',error);
      const message=readableError(error);
      updateButton('Publish failed. No new version was created.');
      alert('Could not publish the trip.\n\n'+message);
      return false;
    }finally{
      state.busy=false;
      setTimeout(function(){updateButton();},5000);
    }
  }
  function installButton(){
    const group=document.getElementById('tripStudioManagement');
    if(!group||document.getElementById('preparePublicationButton'))return;
    const button=document.createElement('button');
    button.id='preparePublicationButton';button.type='button';button.className='trip-studio-action publication-prepare-btn';button.hidden=!(root.isAdminMode&&root.isAdminMode());
    button.innerHTML='<span><strong>Publish Latest Trip</strong><small>'+publicationStatusText()+'</small></span><span aria-hidden="true">☁️</span>';
    button.addEventListener('click',publish);group.appendChild(button);
  }
  function reflectMode(){
    installButton();
    const button=document.getElementById('preparePublicationButton');
    if(button)button.hidden=!(root.isAdminMode&&root.isAdminMode());
  }

  root.TRIP_PUBLICATION=Object.freeze({buildPayload:buildPayload,publish:publish,prepare:publish,getLastPublishedVersion:function(){return state.lastPublishedVersion;}});
  root.publishLatestTrip=publish;
  root.prepareCloudPublication=publish;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){installButton();reflectMode();},{once:true});
  else {installButton();reflectMode();}
  document.addEventListener('travelengine:adminmodechange',reflectMode);
})(globalThis);
