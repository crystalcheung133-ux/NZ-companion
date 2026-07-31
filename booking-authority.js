/* booking-authority.js — canonical Studio-managed booking overrides.
   Static BOOKING_DATA remains the deploy master. Studio saves replace one
   booking record in a small local override store; every page applies those
   overrides before GenerationSelectionAdapter builds its production views. */
(function(root){
  'use strict';
  const KEY=(root.STORAGE_CONFIG&&root.STORAGE_CONFIG.keys&&root.STORAGE_CONFIG.keys.bookingOverrides)||'travel_engine_booking_overrides_v1';
  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
  function store(){return root.STORAGE&&root.STORAGE.local?root.STORAGE.local:null;}
  function read(){
    const raw=store()?store().readJSON(KEY,null):null;
    if(!raw||Number(raw.version)!==1||!raw.overrides||typeof raw.overrides!=='object')return {version:1,overrides:{},updatedAt:null};
    return {version:1,overrides:clone(raw.overrides),updatedAt:raw.updatedAt||null};
  }
  function write(state){return !!(store()&&store().writeJSON(KEY,state));}
  function apply(target){
    if(!target||typeof target!=='object')return target;
    const state=read();
    Object.keys(state.overrides).forEach(function(id){
      if(!target[id]||!state.overrides[id]||typeof state.overrides[id]!=='object')return;
      target[id]=Object.assign({},target[id],clone(state.overrides[id]),{id:id});
    });
    return target;
  }
  function master(){try{return typeof BOOKINGS_DATA!=='undefined'?BOOKINGS_DATA:(root.BOOKINGS_DATA||{});}catch(error){return root.BOOKINGS_DATA||{};}}
  function resolvedSource(target){
    const source=target||master();
    const output={};
    Object.keys(source||{}).forEach(function(id){output[id]=clone(source[id]);});
    const state=read();
    Object.keys(state.overrides).forEach(function(id){
      if(!output[id]||!state.overrides[id]||typeof state.overrides[id]!=='object')return;
      output[id]=Object.assign({},output[id],clone(state.overrides[id]),{id:id});
    });
    return output;
  }
  function all(target){
    return Object.values(resolvedSource(target)).filter(Boolean).map(clone);
  }
  function get(id,target){
    const source=resolvedSource(target);
    return source[id]?clone(source[id]):null;
  }
  function byType(type,target){return all(target).filter(function(item){return item&&item.type===type;});}
  function byPlace(placeId,target){return all(target).find(function(item){return item&&item.placeId===placeId;})||null;}
  function byDay(dayId,target){return all(target).filter(function(item){return item&&item.dayId===dayId;});}
  function save(id,record,target){
    const source=target||master();
    if(!id||!source[id]||!record||typeof record!=='object')return {ok:false,reason:'invalid-booking'};
    const complete=Object.assign({},clone(source[id]),clone(record),{id:id});
    const state=read();
    state.overrides[id]=complete;
    state.updatedAt=new Date().toISOString();
    if(!write(state))return {ok:false,reason:'storage-failed'};
    try{source[id]=clone(complete);}catch(error){}
    const base=master();
    if(base&&base!==source&&base[id]){try{base[id]=clone(complete);}catch(error){}}
    return {ok:true,booking:clone(complete),updatedAt:state.updatedAt};
  }
  function clear(){return !!(store()&&store().remove(KEY));}
  root.BOOKING_AUTHORITY=Object.freeze({key:KEY,read:read,apply:apply,all:all,get:get,byType:byType,byPlace:byPlace,byDay:byDay,save:save,clear:clear});
  apply(master());
})(globalThis);
