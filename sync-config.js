/* sync-config.js — Stage 9A-2 Supabase read-sync configuration.
   Browser-safe publishable/anon key only. Never place a secret/service-role key here. */
(function(root){
  'use strict';

  /* Fill these three browser-safe values once, or supply window.TRAVEL_ENGINE_SUPABASE before this file loads. */
  const project=Object.freeze({
    enabled:true,
    url:'https://dafgbqygccvctifrevpa.supabase.co',
    publishableKey:'sb_publishable_gjObd52pFWZh5VDWD5wKZw_jHxzV7yP'
  });
  const runtimeOverride=root.TRAVEL_ENGINE_SUPABASE||{};
  /* Portability Stage: tripId used to be a literal 'nz-family-2026', a third
     copy of the same identifier already owned by trip-config.js's
     storageNamespace (publication-runtime.js carried a second copy as a
     fallback). This module loads before trip-config.js, so tripId is
     resolved lazily via a getter rather than read at parse time — by the
     time any sync call actually fires, TRIP_CONFIG has always loaded. */
  const legacyTripIdFallback='nz-family-2026';
  const config=Object.freeze({
    provider:'supabase',
    enabled:runtimeOverride.enabled===true||project.enabled===true,
    url:String(runtimeOverride.url||project.url||''),
    anonKey:String(runtimeOverride.anonKey||runtimeOverride.publishableKey||project.publishableKey||''),
    get tripId(){ return (root.TRIP_CONFIG&&root.TRIP_CONFIG.storageNamespace)||legacyTripIdFallback; },
    schemaVersion:1,
    tables:Object.freeze({publications:'trip_publications',expenses:'trip_expenses',moments:'trip_moments',generation:'trip_generation'}),
    storage:Object.freeze({momentsBucket:'trip-moments'}),
    rpc:Object.freeze({resetTrip:'reset_trip',publishTrip:'publish_trip_snapshot'}),
    requestTimeoutMs:8000,
    cacheKey:(root.STORAGE_CONFIG&&root.STORAGE_CONFIG.keys.cloudSnapshot)||'travel_engine_cloud_snapshot_v1',
    metadataKey:(root.STORAGE_CONFIG&&root.STORAGE_CONFIG.keys.cloudSyncMeta)||'travel_engine_cloud_sync_meta_v1',
    reloadMarkerKey:(root.STORAGE_CONFIG&&root.STORAGE_CONFIG.keys.cloudReloadMarker)||'travel_engine_cloud_reload_version_v1',
    autoRead:true
  });

  function hasCredentials(){
    return config.enabled===true &&
      /^https:\/\/.+\.supabase\.co\/?$/i.test(config.url) &&
      /^(?:eyJ|sb_publishable_)/.test(config.anonKey) &&
      config.anonKey.length>20;
  }

  const exported=Object.assign({},config,{hasCredentials});
  /* Object.assign above would flatten the tripId getter into whatever value
     TRIP_CONFIG has (or hasn't) loaded at this exact instant — redefine it
     as a live getter on the exported object so it still resolves lazily. */
  Object.defineProperty(exported,'tripId',{
    enumerable:true,
    get:function(){ return (root.TRIP_CONFIG&&root.TRIP_CONFIG.storageNamespace)||legacyTripIdFallback; }
  });
  root.SYNC_CONFIG=Object.freeze(exported);
})(globalThis);
