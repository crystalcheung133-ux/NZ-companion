/* storage.js — Stage 7F browser-storage access layer.
   Centralizes safe local/session storage access without changing key values or data shapes. */
(function(root){
  'use strict';

  function createStore(nativeStore){
    function get(key, fallback=null){
      try{
        const value=nativeStore.getItem(key);
        return value===null ? fallback : value;
      }catch(error){
        return fallback;
      }
    }
    function set(key, value){
      try{nativeStore.setItem(key,String(value));return true;}catch(error){return false;}
    }
    function remove(key){
      try{nativeStore.removeItem(key);return true;}catch(error){return false;}
    }
    function readJSON(key, fallback=null){
      const raw=get(key,null);
      if(raw===null)return fallback;
      try{return JSON.parse(raw);}catch(error){return fallback;}
    }
    function writeJSON(key, value){
      try{return set(key,JSON.stringify(value));}catch(error){return false;}
    }
    function keys(){
      const result=[];
      try{
        for(let index=0;index<nativeStore.length;index++){
          const key=nativeStore.key(index);
          if(key!==null)result.push(key);
        }
      }catch(error){}
      return result;
    }
    return Object.freeze({get,set,remove,readJSON,writeJSON,keys});
  }

  const local=createStore(root.localStorage);
  const session=createStore(root.sessionStorage);
  function domain(name){
    const map=root.STORAGE_CONFIG&&root.STORAGE_CONFIG.domains&&root.STORAGE_CONFIG.domains[name];
    if(!map)return null;
    return Object.freeze({keys:map,local,session});
  }
  root.STORAGE=Object.freeze({local,session,domain});
})(globalThis);
