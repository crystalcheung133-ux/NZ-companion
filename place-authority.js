/* place-authority.js — RC25.7.40 shared Place facts for Booking, Guide and Timeline. */
(function(root){
 'use strict';
 const KEY='travel_engine_place_overrides_v1';
 const FIELDS=['title','address','phone','website','hours','description','usefulInfo','maps'];
 function clone(v){return v==null?v:JSON.parse(JSON.stringify(v));}
 function store(){return root.STORAGE&&root.STORAGE.local?root.STORAGE.local:null;}
 function basePlaces(){try{return (root.GenerationSelectionAdapter&&GenerationSelectionAdapter.view('guide').places)||{};}catch(e){return {};}}
 function read(){const raw=store()?store().readJSON(KEY,null):null;return raw&&raw.version===1&&raw.overrides?raw:{version:1,overrides:{},updatedAt:null};}
 function write(s){return !!(store()&&store().writeJSON(KEY,s));}
 function projection(record){const out={};FIELDS.forEach(k=>{if(record&&Object.prototype.hasOwnProperty.call(record,k))out[k]=clone(record[k]);});return out;}
 function get(id){const base=clone(basePlaces()[id]||{});const o=read().overrides[id]||{};return Object.assign(base,clone(o),{key:id});}
 function save(id,record){if(!id||!basePlaces()[id])return {ok:false,reason:'invalid-place'};const s=read();s.overrides[id]=Object.assign({},s.overrides[id]||{},projection(record));s.updatedAt=new Date().toISOString();if(!write(s))return {ok:false,reason:'storage-failed'};const place=get(id);try{document.dispatchEvent(new CustomEvent('travelengine:placechange',{detail:{placeId:id,place:clone(place)}}));}catch(e){}return {ok:true,place};}
 function mapURL(place){const p=typeof place==='string'?get(place):place;if(!p)return '';if(String(p.maps||'').trim())return String(p.maps).trim();const q=String(p.address||p.title||'').trim();return q?'https://maps.google.com/?q='+encodeURIComponent(q):'';}
 root.PLACE_AUTHORITY=Object.freeze({key:KEY,fields:FIELDS.slice(),read,get,save,mapURL});
})(typeof globalThis!=='undefined'?globalThis:this);
