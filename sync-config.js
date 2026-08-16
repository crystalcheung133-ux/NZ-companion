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
  /* 25.2.6 portability: trip identity is instance-owned. This module may load
     before trip-config.js, so resolve it lazily. A host may also provide
     TRAVEL_ENGINE_SUPABASE.tripId for non-standard boot orders. */
  const config=Object.freeze({
    provider:'supabase',
    enabled:runtimeOverride.enabled===true||project.enabled===true,
    url:String(runtimeOverride.url||project.url||''),
    anonKey:String(runtimeOverride.anonKey||runtimeOverride.publishableKey||project.publishableKey||''),
    get tripId(){ return String((root.TRIP_CONFIG&&root.TRIP_CONFIG.storageNamespace)||runtimeOverride.tripId||''); },
    schemaVersion:1,
    tables:Object.freeze({publications:'trip_publications',expenses:'trip_expenses',moments:'trip_moments',generation:'trip_generation',analytics:'trip_analytics_events',bookings:'bookings'}),
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
    get:function(){ return String((root.TRIP_CONFIG&&root.TRIP_CONFIG.storageNamespace)||runtimeOverride.tripId||''); }
  });
  root.SYNC_CONFIG=Object.freeze(exported);
})(globalThis);
