(function(global){
  'use strict';

  const EVENTS=Object.freeze({
    ready:'travelengine:pwa-ready',
    updateReady:'travelengine:update-ready',
    stateChange:'travelengine:pwa-state-change',
    connectionChange:'travelengine:connection-change'
  });

  const state={
    supported:false,
    registered:false,
    ready:false,
    online:true,
    updateReady:false,
    version:'',
    registration:null,
    waitingWorker:null,
    error:null
  };

  function emit(name,detail){
    if(!global.document || typeof global.CustomEvent !== 'function') return;
    global.document.dispatchEvent(new global.CustomEvent(name,{detail:detail||{}}));
  }

  function snapshot(){
    return Object.freeze({
      supported:state.supported,
      registered:state.registered,
      ready:state.ready,
      online:state.online,
      updateReady:state.updateReady,
      version:state.version,
      registration:state.registration,
      waitingWorker:state.waitingWorker,
      error:state.error
    });
  }

  function reflectState(){
    const root=global.document && global.document.documentElement;
    if(!root || !root.dataset) return;
    root.dataset.pwaSupported=state.supported ? 'true' : 'false';
    root.dataset.pwaReady=state.ready ? 'true' : 'false';
    root.dataset.connection=state.online ? 'online' : 'offline';
    root.dataset.updateReady=state.updateReady ? 'true' : 'false';
  }

  function publishState(reason){
    reflectState();
    emit(EVENTS.stateChange,{reason:reason||'state',state:snapshot()});
  }

  function currentVersionToken(){
    const script=global.document && global.document.currentScript;
    if(!script || !script.src) return '';
    try{return new URL(script.src,global.location.href).searchParams.get('v') || '';}
    catch(error){return '';}
  }

  function serviceWorkerUrl(versionToken){
    const token=String(versionToken == null ? currentVersionToken() : versionToken).trim();
    return './sw.js' + (token ? '?v=' + encodeURIComponent(token) : '');
  }

  function supported(){
    return !!(global.navigator && 'serviceWorker' in global.navigator);
  }

  function isOnline(){
    return state.online;
  }

  function hasUpdate(){
    return state.updateReady;
  }

  function setConnection(online,reason){
    const next=online !== false;
    const changed=state.online !== next;
    state.online=next;
    if(changed){
      publishState(reason||'connection');
      emit(EVENTS.connectionChange,{online:state.online,state:snapshot()});
    }else{
      reflectState();
    }
    return state.online;
  }

  function setUpdateReady(registration,worker,reason){
    state.registration=registration || state.registration;
    state.waitingWorker=worker || (registration && registration.waiting) || state.waitingWorker;
    const changed=!state.updateReady;
    state.updateReady=true;
    publishState(reason||'update-ready');
    if(changed) emit(EVENTS.updateReady,{registration:state.registration,worker:state.waitingWorker,state:snapshot()});
    return state.waitingWorker;
  }

  function clearUpdateReady(reason){
    if(!state.updateReady && !state.waitingWorker) return snapshot();
    state.updateReady=false;
    state.waitingWorker=null;
    publishState(reason||'update-cleared');
    return snapshot();
  }

  function observeUpdate(registration){
    if(!registration) return registration;
    state.registration=registration;
    if(registration.waiting) setUpdateReady(registration,registration.waiting,'waiting-worker');
    registration.addEventListener('updatefound',function(){
      const worker=registration.installing;
      if(!worker) return;
      worker.addEventListener('statechange',function(){
        if(worker.state === 'installed' && global.navigator.serviceWorker.controller){
          setUpdateReady(registration,worker,'worker-installed');
        }
      });
    });
    return registration;
  }

  function register(options){
    const opts=options || {};
    if(!supported()){
      state.ready=true;
      publishState('unsupported');
      emit(EVENTS.ready,{registration:null,state:snapshot()});
      return Promise.resolve(null);
    }
    const url=opts.url || serviceWorkerUrl(opts.version);
    return global.navigator.serviceWorker.register(url,Object.assign({updateViaCache:'none'},opts.registrationOptions||{}))
      .then(observeUpdate)
      .then(function(registration){
        state.registration=registration;
        state.registered=!!registration;
        state.ready=true;
        state.error=null;
        publishState('registered');
        emit(EVENTS.ready,{registration,state:snapshot()});
        if(typeof registration.update==='function') registration.update().catch(function(){});
        return registration;
      })
      .catch(function(error){
        state.ready=true;
        state.error=error || new Error('Service Worker registration failed');
        publishState('registration-error');
        emit(EVENTS.ready,{registration:null,error:state.error,state:snapshot()});
        return null;
      });
  }

  function checkForUpdate(){
    const registration=state.registration;
    if(!registration || typeof registration.update !== 'function') return Promise.resolve(null);
    return registration.update().then(function(){
      if(registration.waiting) setUpdateReady(registration,registration.waiting,'manual-check');
      return registration;
    }).catch(function(){return registration;});
  }

  function registerOnLoad(options){
    if(!supported()){
      register(options);
      return;
    }
    const run=function(){register(options);};
    if(global.document && global.document.readyState === 'complete') run();
    else global.addEventListener('load',run,{once:true});
  }

  function bindConnectionLifecycle(){
    if(typeof global.addEventListener !== 'function') return;
    global.addEventListener('online',function(){setConnection(true,'browser-online');});
    global.addEventListener('offline',function(){setConnection(false,'browser-offline');});
  }


  if(supported() && global.navigator.serviceWorker){
    global.navigator.serviceWorker.addEventListener('controllerchange',function(){
      // RC15.2 Fast Resume: a newly active worker must not tear down the page
      // the traveller is currently using. The next navigation/cold launch will
      // naturally use the new cache while this page remains instantly usable.
      state.updateReady=false;
      state.waitingWorker=null;
      publishState('controller-changed-no-reload');
    });
  }

  state.supported=supported();
  state.online=!(global.navigator && global.navigator.onLine === false);
  state.version=currentVersionToken();
  reflectState();
  bindConnectionLifecycle();

  const PWA=Object.freeze({
    events:EVENTS,
    supported,
    currentVersionToken,
    serviceWorkerUrl,
    observeUpdate,
    register,
    registerOnLoad,
    getState:snapshot,
    isOnline,
    hasUpdate,
    checkForUpdate,
    clearUpdateReady
  });

  global.PWA=PWA;
  PWA.registerOnLoad();
})(typeof window !== 'undefined' ? window : globalThis);
