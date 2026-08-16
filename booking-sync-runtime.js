/* booking-sync-runtime.js — Travel Engine 25.2.8 shared Booking state transport.
   Admin mode remains local/Studio-managed unless sync is explicitly enabled.
   Collaborative mode uses the same Booking Authority and pushes via the generic
   booking-sync Edge Function. The shared token identifies the trip; partyId
   identifies who made the change. */
(function(root){
  'use strict';
  const LOG='[Booking Sync]';
  const state={pullPromise:null,lastSyncAt:'',lastError:'',versions:{},started:false};
  function management(){return (root.TRIP_CONFIG&&root.TRIP_CONFIG.bookingManagement)||{};}
  function syncConfig(){return management().sync||{};}
  function mode(){return root.BOOKING_PERMISSIONS?root.BOOKING_PERMISSIONS.mode():'admin';}
  function enabled(){return mode()==='collaborative'&&syncConfig().enabled===true&&!!String(syncConfig().accessToken||'').trim()&&!!(root.SYNC_CONFIG&&root.SYNC_CONFIG.url&&root.SYNC_CONFIG.anonKey);}
  function tripId(){return String((root.SYNC_CONFIG&&root.SYNC_CONFIG.tripId)||(root.TRIP_CONFIG&&root.TRIP_CONFIG.storageNamespace)||'');}
  function partyId(){return root.BOOKING_PERMISSIONS?root.BOOKING_PERMISSIONS.currentPartyId():'';}
  function headers(){return {apikey:root.SYNC_CONFIG.anonKey,Authorization:`Bearer ${root.SYNC_CONFIG.anonKey}`,Accept:'application/json','Content-Type':'application/json'};}
  function uuid(){return root.crypto&&root.crypto.randomUUID?root.crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`;}
  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
  function legacyRow(row){
    return {
      id:row.booking_id,bookingId:row.booking_id,eventId:row.event_id||'',placeId:row.place_id||'',
      day:row.day_number||'',dayId:row.day_number?`day${row.day_number}`:'',status:row.status||'pending',
      date:row.booking_date||'',time:(row.booking_time||'').slice(0,5),bookingName:row.booking_name||'',
      bookingCategory:row.category||'',category:row.category||'',title:row.title||'',
      depositPaid:row.deposit_paid?'Yes':'',depositAmount:row.deposit_amount||'',bookingMethod:row.booking_method||'',
      bookingContact:row.booking_contact||'',secondaryContact:row.secondary_contact||'',bookingUrl:row.booking_url||'',
      notes:row.notes||'',updatedAt:row.updated_at||'',updatedByPartyId:row.updated_by_party_id||''
    };
  }
  function mapRow(row){
    const payload=row&&row.payload&&typeof row.payload==='object'&&!Array.isArray(row.payload)?clone(row.payload):{};
    const record=Object.assign({},legacyRow(row||{}),payload,{id:(payload.id||payload.bookingId||row.booking_id),bookingId:(payload.bookingId||payload.id||row.booking_id)});
    record.status=String(record.status||'pending').toLowerCase()==='confirmed'?'confirmed':'pending';
    record._remoteVersion=Number(row.version||1);record._remoteDeletedAt=row.deleted_at||'';
    state.versions[record.id]=record._remoteVersion;
    return record;
  }
  function sourceTarget(){
    try{const view=root.GenerationSelectionAdapter&&root.GenerationSelectionAdapter.view?root.GenerationSelectionAdapter.view('bookings'):null;return view&&view.byId?view.byId:null;}catch(_){return null;}
  }
  function mergeRemoteWithDeployMaster(record,target){
    const master=root.BOOKING_AUTHORITY&&root.BOOKING_AUTHORITY.deployMaster?root.BOOKING_AUTHORITY.deployMaster(record&&record.id):null;
    if(!master)return record;
    const currentRevision=root.BOOKING_AUTHORITY.masterRevision();
    const remoteRevision=Number(record&&((record._masterRevision!=null?record._masterRevision:record.masterRevision))||0);
    if(remoteRevision===currentRevision)return Object.assign({},master,record,{_masterRevision:currentRevision});
    const merged=Object.assign({},master);
    const editable=root.BOOKING_AUTHORITY.editableStateFields||[];
    editable.forEach(function(field){if(Object.prototype.hasOwnProperty.call(record,field))merged[field]=clone(record[field]);});
    merged._masterRevision=currentRevision;
    return merged;
  }
  function applyRemote(row){
    let record=mapRow(row);
    if(!root.BOOKING_AUTHORITY)return record;
    const target=sourceTarget();
    if(row.deleted_at){root.BOOKING_AUTHORITY.remove(record.id,target,{silent:true,remote:true});return record;}
    record=mergeRemoteWithDeployMaster(record,target);
    root.BOOKING_AUTHORITY.save(record.id,record,target,{silent:true,remote:true});
    return record;
  }
  async function fetchRows(bookingId){
    if(!enabled())return [];
    const response=await root.fetch(`${root.SYNC_CONFIG.url}/functions/v1/booking-sync`,{method:'POST',headers:headers(),body:JSON.stringify({action:'read',tripId:tripId(),tripAccessToken:String(syncConfig().accessToken||''),partyId:partyId(),bookingId:bookingId||''})});
    const body=await response.json().catch(()=>({ok:false,code:`HTTP_${response.status}`}));
    if(!response.ok||!body||!body.ok)throw new Error((body&&body.code)||`BOOKING_READ_${response.status}`);
    return Array.isArray(body.rows)?body.rows:[];
  }
  async function pull(){
    if(!enabled())return [];
    if(state.pullPromise)return state.pullPromise;
    state.pullPromise=(async()=>{try{
      const rows=await fetchRows();rows.forEach(applyRemote);state.lastSyncAt=new Date().toISOString();state.lastError='';
      document.dispatchEvent(new CustomEvent('travelengine:bookingchange',{detail:{remote:true}}));return rows.map(mapRow);
    }catch(error){state.lastError=error&&error.message||String(error);console.error(LOG,error);throw error;}finally{state.pullPromise=null;}})();
    return state.pullPromise;
  }
  function toPayload(record){
    const copy=clone(record)||{};
    delete copy._category;delete copy._status;delete copy._remoteVersion;delete copy._remoteDeletedAt;
    copy.id=record.id||record.bookingId;copy.bookingId=copy.id;
    copy._masterRevision=root.BOOKING_AUTHORITY&&root.BOOKING_AUTHORITY.masterRevision?root.BOOKING_AUTHORITY.masterRevision():1;
    copy.updatedByPartyId=partyId();copy.updatedAt=new Date().toISOString();
    return copy;
  }
  function mutation(operation,record,baseVersion){
    const value={mutationId:uuid(),tripId:tripId(),tripGeneration:Number((root.TRIP_CONFIG&&root.TRIP_CONFIG.tripGeneration)||1),schemaVersion:1,domain:'booking',recordId:record.id||record.bookingId,operation,payload:toPayload(record),createdAt:new Date().toISOString(),createdByPartyId:partyId(),retryCount:0,state:'queued'};
    if(operation!=='create')value.baseVersion=Number(baseVersion);
    return value;
  }
  async function send(operation,record,baseVersion){
    const response=await root.fetch(`${root.SYNC_CONFIG.url}/functions/v1/booking-sync`,{method:'POST',headers:headers(),body:JSON.stringify({tripId:tripId(),tripAccessToken:String(syncConfig().accessToken||''),partyId:partyId(),permissionMode:mode(),mutation:mutation(operation,record,baseVersion)})});
    const body=await response.json().catch(()=>({ok:false,code:`HTTP_${response.status}`}));
    return {response,body};
  }
  async function push(record,operationHint){
    if(!enabled())return {ok:true,localOnly:true,booking:clone(record)};
    if(!(root.BOOKING_PERMISSIONS&&root.BOOKING_PERMISSIONS.canEdit()))throw new Error('BOOKING_EDIT_NOT_ALLOWED');
    if(!navigator.onLine)throw new Error('BOOKING_SAVE_REQUIRES_CONNECTION');
    let canonical=(await fetchRows(record.id||record.bookingId))[0]||null;
    let operation=operationHint||(canonical?'update':'create');
    let result=await send(operation,record,canonical?Number(canonical.version):undefined);
    if(result.response.status===409){canonical=(await fetchRows(record.id||record.bookingId))[0]||null;result=await send(operation,record,canonical?Number(canonical.version):undefined);}
    if(!result.response.ok||!result.body||!result.body.ok)throw new Error((result.body&&result.body.code)||`BOOKING_WRITE_${result.response.status}`);
    const row=result.body.record;if(row)applyRemote(row);
    state.lastSyncAt=new Date().toISOString();state.lastError='';
    const booking=row?mapRow(row):clone(record);
    document.dispatchEvent(new CustomEvent('travelengine:bookingchange',{detail:{bookingId:booking.id,booking,remote:true}}));
    return {ok:true,booking,remote:true};
  }
  async function remove(record){
    if(!enabled())return {ok:true,localOnly:true,id:record.id||record.bookingId};
    return push(Object.assign({},record,{deletedAt:new Date().toISOString()}),'delete');
  }
  function status(){return Object.freeze({enabled:enabled(),mode:mode(),canEdit:!!(root.BOOKING_PERMISSIONS&&root.BOOKING_PERMISSIONS.canEdit()),partyId:partyId(),lastSyncAt:state.lastSyncAt,lastError:state.lastError});}
  function safePull(){if(enabled()&&navigator.onLine)pull().catch(()=>{});}
  function start(){
    if(state.started)return;state.started=true;if(!enabled())return;
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',safePull,{once:true});else safePull();
    root.addEventListener('focus',safePull);root.addEventListener('online',safePull);document.addEventListener('visibilitychange',()=>{if(!document.hidden)safePull();});
    const interval=Math.max(5000,Number(syncConfig().pollIntervalMs||15000));root.setInterval(()=>{if(!document.hidden&&navigator.onLine)safePull();},interval);
  }
  root.BOOKING_SYNC=Object.freeze({enabled,pull,push,remove,getStatus:status,start});
  start();
})(globalThis);
