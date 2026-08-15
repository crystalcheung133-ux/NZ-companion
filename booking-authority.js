/* booking-authority.js — canonical Studio-managed booking overrides.
   Deploy master owns itinerary identity. User/remote booking state may override
   editable reservation fields. Full schedule overrides are only accepted when
   they were authored against the current bookingMasterRevision. */
(function(root){
  'use strict';
  const KEY=(root.STORAGE_CONFIG&&root.STORAGE_CONFIG.keys&&root.STORAGE_CONFIG.keys.bookingOverrides)||'travel_engine_booking_overrides_v1';
  function clone(value){return value==null?value:JSON.parse(JSON.stringify(value));}
  function store(){return root.STORAGE&&root.STORAGE.local?root.STORAGE.local:null;}
  function master(){try{return typeof BOOKINGS_DATA!=='undefined'?BOOKINGS_DATA:(root.BOOKINGS_DATA||{});}catch(error){return root.BOOKINGS_DATA||{};}}
  const DEPLOY_MASTER=clone(master()||{});
  const EDITABLE_STATE_FIELDS=Object.freeze([
    'status','displayStatus','bookingName',
    'depositPaid','depositAmount','depositCurrency','paymentStatus',
    'reference','referenceLabel','bookingReference',
    'totalAmount','cashbackAmount','netTotalAUD','price','paymentLabel'
  ]);
  function masterRevision(){return Number(root.TRIP_CONFIG&&root.TRIP_CONFIG.bookingMasterRevision||1);}
  function recordRevision(record){return Number(record&&((record._masterRevision!=null?record._masterRevision:record.masterRevision))||0);}
  function stamp(record){const out=clone(record)||{};out._masterRevision=masterRevision();return out;}
  function meaningful(value){
    return !(value===undefined||value===null||value===''||value===false);
  }
  function mergeStaleState(base,override){
    const out=Object.assign({},clone(base));
    if(!override||typeof override!=='object')return out;
    ['status','displayStatus'].forEach(function(field){
      if(Object.prototype.hasOwnProperty.call(override,field))out[field]=clone(override[field]);
    });
    ['bookingName','reference','referenceLabel','bookingReference',
     'depositPaid','depositAmount','depositCurrency','paymentStatus',
     'totalAmount','cashbackAmount','netTotalAUD','price','paymentLabel'].forEach(function(field){
      if(!meaningful(base&&base[field])&&Object.prototype.hasOwnProperty.call(override,field))out[field]=clone(override[field]);
    });
    return out;
  }
  function mergeOverride(base,override){
    if(!override||typeof override!=='object')return clone(base);
    if(recordRevision(override)===masterRevision())return Object.assign({},clone(base),clone(override));
    return mergeStaleState(base,override);
  }
  function read(){
    const raw=store()?store().readJSON(KEY,null):null;
    if(!raw||Number(raw.version)!==1||!raw.overrides||typeof raw.overrides!=='object')return {version:1,overrides:{},deletedIds:[],updatedAt:null};
    return {version:1,overrides:clone(raw.overrides),deletedIds:Array.isArray(raw.deletedIds)?raw.deletedIds.slice():[],updatedAt:raw.updatedAt||null};
  }
  function write(state){return !!(store()&&store().writeJSON(KEY,state));}
  function canonicalBase(id,source){return clone((DEPLOY_MASTER&&DEPLOY_MASTER[id])||(source&&source[id])||null);}
  function resolvedSource(target){
    const source=target||master();
    const output={};
    const ids=new Set([...Object.keys(source||{}),...Object.keys(DEPLOY_MASTER||{})]);
    ids.forEach(function(id){
      const base=canonicalBase(id,source);
      if(base)output[id]=base;
    });
    const state=read();
    Object.keys(state.overrides).forEach(function(id){
      if(!output[id]||!state.overrides[id]||typeof state.overrides[id]!=='object')return;
      output[id]=Object.assign({},mergeOverride(output[id],state.overrides[id]),{id:id});
    });
    (state.deletedIds||[]).forEach(function(id){delete output[id];});
    return output;
  }
  function apply(target){
    if(!target||typeof target!=='object')return target;
    const resolved=resolvedSource(target);
    Object.keys(target).forEach(function(id){if(!resolved[id])delete target[id];});
    Object.keys(resolved).forEach(function(id){target[id]=clone(resolved[id]);});
    return target;
  }
  function all(target){return Object.values(resolvedSource(target)).filter(Boolean).map(clone);}
  function get(id,target){const source=resolvedSource(target);return source[id]?clone(source[id]):null;}
  function byType(type,target){return all(target).filter(function(item){return item&&item.type===type;});}
  function byPlace(placeId,target){return all(target).find(function(item){return item&&item.placeId===placeId;})||null;}
  function byDay(dayId,target){return all(target).filter(function(item){return item&&item.dayId===dayId;});}
  function save(id,record,target){
    const opts=arguments[3]||{};
    const source=target||master();
    const base=canonicalBase(id,source);
    if(!id||!base||!record||typeof record!=='object')return {ok:false,reason:'invalid-booking'};
    const current=resolvedSource(source)[id]||base;
    const complete=stamp(Object.assign({},current,clone(record),{id:id}));
    const state=read();
    state.overrides[id]=complete;
    state.deletedIds=(state.deletedIds||[]).filter(function(item){return item!==id;});
    state.updatedAt=new Date().toISOString();
    if(!write(state))return {ok:false,reason:'storage-failed'};
    if(source&&source[id])try{source[id]=clone(complete);}catch(error){}
    if(!opts.silent&&typeof document!=='undefined')document.dispatchEvent(new CustomEvent('travelengine:bookingchange',{detail:{bookingId:id,booking:clone(complete),local:true}}));
    return {ok:true,booking:clone(complete),updatedAt:state.updatedAt};
  }
  function remove(id,target){
    const opts=arguments[2]||{};
    const source=target||master();
    if(!id||!canonicalBase(id,source))return {ok:false,reason:'invalid-booking'};
    const state=read();
    delete state.overrides[id];
    if(!state.deletedIds.includes(id))state.deletedIds.push(id);
    state.updatedAt=new Date().toISOString();
    if(!write(state))return {ok:false,reason:'storage-failed'};
    if(source&&source[id])try{delete source[id];}catch(error){}
    if(!opts.silent&&typeof document!=='undefined')document.dispatchEvent(new CustomEvent('travelengine:bookingchange',{detail:{bookingId:id,deleted:true,local:true}}));
    return {ok:true,id:id,updatedAt:state.updatedAt};
  }
  function clear(){return !!(store()&&store().remove(KEY));}
  function deployMaster(id){return id?clone(DEPLOY_MASTER[id]||null):clone(DEPLOY_MASTER);}
  root.BOOKING_AUTHORITY=Object.freeze({
    key:KEY,read:read,apply:apply,all:all,get:get,byType:byType,byPlace:byPlace,byDay:byDay,
    save:save,remove:remove,clear:clear,deployMaster:deployMaster,
    masterRevision:masterRevision,editableStateFields:EDITABLE_STATE_FIELDS
  });
  apply(master());
})(globalThis);
