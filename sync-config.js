/* sync-config.js — Stage 9A-1 cloud sync configuration.
   Safe-by-default: the Companion remains fully local until valid Supabase values are supplied. */
(function(root){
  'use strict';

  const config=Object.freeze({
    provider:'supabase',
    enabled:false,
    url:'',
    anonKey:'',
    tripId:'nz-family-2026',
    schemaVersion:1,
    tables:Object.freeze({publications:'trip_publications'}),
    requestTimeoutMs:8000,
    cacheKey:'travel_engine_cloud_snapshot_v1',
    metadataKey:'travel_engine_cloud_sync_meta_v1'
  });

  function hasCredentials(){
    return config.enabled===true && /^https:\/\/.+\.supabase\.co\/?$/i.test(config.url) && config.anonKey.length>20;
  }

  root.SYNC_CONFIG=Object.freeze(Object.assign({},config,{hasCredentials}));
})(globalThis);
