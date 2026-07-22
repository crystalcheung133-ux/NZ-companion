/* itinerary-authority.js — RC15 Master File authority boundary.
   Admin itinerary overrides belong to exactly one master itinerary. When the
   authoritative master changes, only itinerary overrides and pending itinerary
   draft entries are retired; expenses, moments, family settings and other trip
   state are untouched. */
(function(root){
  'use strict';
  function stable(value){
    if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
    if(value&&typeof value==='object')return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';
    return JSON.stringify(value);
  }
  function fingerprint(value){
    const text=stable(value);let hash=2166136261;
    for(let i=0;i<text.length;i+=1){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
    return 'itinerary-'+(hash>>>0).toString(16).padStart(8,'0');
  }
  function removePendingItineraryChanges(){
    const key=root.STORAGE_CONFIG?.keys?.adminDraft;
    if(!key||!root.STORAGE?.local)return;
    const draft=root.STORAGE.local.readJSON(key,null);
    if(!draft||!draft.changes||typeof draft.changes!=='object')return;
    let changed=false;
    Object.keys(draft.changes).forEach(k=>{if(k.startsWith('itineraryDay')){delete draft.changes[k];changed=true;}});
    if(changed){draft.updatedAt=new Date().toISOString();root.STORAGE.local.writeJSON(key,draft);}
  }
  function reconcile(master){
    const keys=root.STORAGE_CONFIG?.keys,store=root.STORAGE?.local;
    if(!keys||!store||!master)return {changed:false,fingerprint:null};
    const current=fingerprint(master),previous=store.get(keys.itineraryMasterFingerprint);
    if(previous!==current){
      store.remove(keys.itineraryOverrides);
      removePendingItineraryChanges();
      store.set(keys.itineraryMasterFingerprint,current);
      try{root.sessionStorage?.setItem('travel_engine_itinerary_master_replaced_v1','1');}catch(e){}
      return {changed:true,fingerprint:current,previous:previous||null};
    }
    return {changed:false,fingerprint:current,previous};
  }
  root.ITINERARY_AUTHORITY=Object.freeze({fingerprint,reconcile});
})(globalThis);
