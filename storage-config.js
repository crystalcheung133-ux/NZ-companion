/* storage-config.js — Stage 7F canonical browser-storage key ownership.
   Existing key values are intentionally preserved so deployed user data remains compatible. */
(function(root){
  'use strict';

  const keys=Object.freeze({
    checklist:'checklist',
    expenses:'expenses',
    momentPrefix:'moment_',
    latestMomentPrefix:'moment_latest_',
    momentsFreeform:'moments_freeform',
    momentsList:'moments_list',
    friend:'nz_friend',
    adminMode:'travel_engine_admin_mode_v1',
    adminDraft:'travel_engine_admin_draft_v1',
    guideNavContext:'ccmv_guide_nav_context',
    guideNavReopen:'ccmv_guide_nav_reopen',
    itineraryOverrides:'travel_engine_itinerary_overrides_v1',
    itineraryMasterSignature:'travel_engine_itinerary_master_signature_v1',
    tripCompletion:'travel_engine_trip_completion_v1',
    changedPlans:'travel_engine_changed_plans_v1',
    cloudSnapshot:'travel_engine_cloud_snapshot_v1',
    cloudSyncMeta:'travel_engine_cloud_sync_meta_v1',
    expenseSyncTombstones:'travel_engine_expense_tombstones_v1',
    expenseSyncMeta:'travel_engine_expense_sync_meta_v1',
    tripGeneration:'travel_engine_trip_generation_v1'
  });

  const domains=Object.freeze({
    identity:Object.freeze({friend:keys.friend}),
    checklist:Object.freeze({state:keys.checklist}),
    expenses:Object.freeze({records:keys.expenses,tombstones:keys.expenseSyncTombstones,syncMetadata:keys.expenseSyncMeta}),
    moments:Object.freeze({records:keys.momentsList,freeform:keys.momentsFreeform,legacyPrefix:keys.momentPrefix,latestPrefix:keys.latestMomentPrefix}),
    admin:Object.freeze({mode:keys.adminMode,draft:keys.adminDraft}),
    guide:Object.freeze({context:keys.guideNavContext,reopen:keys.guideNavReopen}),
    itinerary:Object.freeze({overrides:keys.itineraryOverrides,masterSignature:keys.itineraryMasterSignature}),
    completion:Object.freeze({state:keys.tripCompletion}),
    journey:Object.freeze({changedPlans:keys.changedPlans}),
    sync:Object.freeze({snapshot:keys.cloudSnapshot,metadata:keys.cloudSyncMeta})
  });

  root.STORAGE_CONFIG=Object.freeze({
    appPrefix:'travel_engine',
    version:1,
    keys,
    domains
  });
})(globalThis);
