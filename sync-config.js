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
  const config=Object.freeze({
    provider:'supabase',
    enabled:runtimeOverride.enabled===true||project.enabled===true,
    url:String(runtimeOverride.url||project.url||''),
    anonKey:String(runtimeOverride.anonKey||runtimeOverride.publishableKey||project.publishableKey||''),
    tripId:'nz-family-2026',
    schemaVersion:1,
    tables:Object.freeze({publications:'trip_publications'}),
    requestTimeoutMs:8000,
    cacheKey:'travel_engine_cloud_snapshot_v1',
    metadataKey:'travel_engine_cloud_sync_meta_v1',
    reloadMarkerKey:'travel_engine_cloud_reload_version_v1',
    autoRead:true
  });

  function hasCredentials(){
    return config.enabled===true &&
      /^https:\/\/.+\.supabase\.co\/?$/i.test(config.url) &&
      /^(?:eyJ|sb_publishable_)/.test(config.anonKey) &&
      config.anonKey.length>20;
  }

  root.SYNC_CONFIG=Object.freeze(Object.assign({},config,{hasCredentials}));
})(globalThis);
