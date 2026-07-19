(function(global){
  'use strict';

  const EVENTS=Object.freeze({
    bootstrap:'travelengine:app-bootstrap',
    ready:'travelengine:app-ready',
    error:'travelengine:app-error'
  });

  const state={
    started:false,
    ready:false,
    valid:false,
    page:'',
    version:'',
    missing:[],
    errors:[]
  };

  let resolveReady;
  const readyPromise=new Promise(function(resolve){resolveReady=resolve;});

  function emit(name,detail){
    if(!global.document || typeof global.CustomEvent!=='function') return;
    global.document.dispatchEvent(new global.CustomEvent(name,{detail:detail||{}}));
  }

  function currentVersionToken(){
    const script=global.document && global.document.currentScript;
    if(!script || !script.src) return '';
    try{return new URL(script.src,global.location.href).searchParams.get('v') || '';}
    catch(error){return '';}
  }

  function currentPage(){
    try{
      if(global.NAVIGATION && typeof global.NAVIGATION.currentPage==='function'){
        return global.NAVIGATION.currentPage() || 'index.html';
      }
    }catch(error){}
    const path=global.location && global.location.pathname ? global.location.pathname : '';
    return path.split('/').pop() || 'index.html';
  }

  function snapshot(){
    return Object.freeze({
      started:state.started,
      ready:state.ready,
      valid:state.valid,
      page:state.page,
      version:state.version,
      missing:Object.freeze(state.missing.slice()),
      errors:Object.freeze(state.errors.slice())
    });
  }

  function reflectState(){
    const root=global.document && global.document.documentElement;
    if(!root || !root.dataset) return;
    root.dataset.appRuntime=state.started ? 'started' : 'pending';
    root.dataset.appReady=state.ready ? 'true' : 'false';
    root.dataset.appValid=state.valid ? 'true' : 'false';
    root.dataset.appPage=state.page || '';
    root.dataset.appVersion=state.version || '';
  }

  function recordError(error,source){
    const entry=Object.freeze({
      source:source || 'runtime',
      message:error && error.message ? String(error.message) : String(error || 'Unknown runtime error'),
      name:error && error.name ? String(error.name) : 'Error',
      time:new Date().toISOString()
    });
    state.errors.push(entry);
    reflectState();
    emit(EVENTS.error,{error:entry,state:snapshot()});
    return entry;
  }

  function bindErrorLifecycle(){
    if(typeof global.addEventListener!=='function') return;
    global.addEventListener('error',function(event){
      recordError(event && (event.error || event.message),'window-error');
    });
    global.addEventListener('unhandledrejection',function(event){
      recordError(event && event.reason,'unhandled-rejection');
    });
  }

  function dependencyChecks(){
    const base=[
      ['THEME_CONFIG',function(){return typeof THEME_CONFIG!=='undefined';}],
      ['ASSET_CONFIG',function(){return typeof ASSET_CONFIG!=='undefined';}],
      ['LOCALE_CONFIG',function(){return typeof LOCALE_CONFIG!=='undefined';}],
      ['FORMATTER',function(){return typeof FORMATTER!=='undefined';}],
      ['NAVIGATION_CONFIG',function(){return typeof NAVIGATION_CONFIG!=='undefined';}],
      ['NAVIGATION',function(){return typeof NAVIGATION!=='undefined';}],
      ['TRIP_CONFIG',function(){return typeof TRIP_CONFIG!=='undefined';}]
    ];
    if(state.page==='offline.html') return base;
    return base.concat([
      ['MONEY_CONFIG',function(){return typeof MONEY_CONFIG!=='undefined';}],
      ['STORAGE_CONFIG',function(){return typeof STORAGE_CONFIG!=='undefined';}],
      ['STORAGE',function(){return typeof STORAGE!=='undefined';}],
      ['SYNC_CONFIG',function(){return typeof SYNC_CONFIG!=='undefined';}],
      ['TRIP_SYNC',function(){return typeof TRIP_SYNC!=='undefined';}],
      ['MONEY',function(){return typeof MONEY!=='undefined';}],
      ['PLACES',function(){return typeof PLACES!=='undefined';}],
      ['ITINERARY_DATA',function(){return typeof ITINERARY_DATA!=='undefined';}],
      ['PWA',function(){return typeof PWA!=='undefined';}]
    ]);
  }

  function validateDependencies(){
    const missing=[];
    dependencyChecks().forEach(function(check){
      try{if(!check[1]()) missing.push(check[0]);}
      catch(error){missing.push(check[0]);}
    });
    state.missing=missing;
    state.valid=missing.length===0;
    return Object.freeze({valid:state.valid,missing:Object.freeze(missing.slice())});
  }

  function finalize(){
    if(state.ready) return snapshot();
    state.page=currentPage();
    validateDependencies();
    state.ready=true;
    reflectState();
    const result=snapshot();
    emit(EVENTS.ready,{state:result});
    resolveReady(result);
    return result;
  }

  function start(){
    if(state.started) return readyPromise;
    state.started=true;
    state.page=currentPage();
    reflectState();
    emit(EVENTS.bootstrap,{state:snapshot()});

    const schedule=function(){global.setTimeout(finalize,0);};
    if(!global.document || global.document.readyState!=='loading') schedule();
    else global.document.addEventListener('DOMContentLoaded',schedule,{once:true});
    return readyPromise;
  }

  function whenReady(callback){
    if(typeof callback!=='function') return readyPromise;
    return readyPromise.then(callback);
  }

  state.version=currentVersionToken();
  bindErrorLifecycle();

  const APP_RUNTIME=Object.freeze({
    events:EVENTS,
    currentVersionToken,
    currentPage,
    getState:snapshot,
    validateDependencies,
    recordError,
    start,
    whenReady
  });

  global.APP_RUNTIME=APP_RUNTIME;
  APP_RUNTIME.start();
})(typeof window!=='undefined' ? window : globalThis);
