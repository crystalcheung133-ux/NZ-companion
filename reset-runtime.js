/* reset-runtime.js — RC11R4 Reset Architecture Root Repair
   Owns the ENTIRE Reset Trip Data flow as one linear, no-partial-state
   sequence. This replaces the old resetTripData() that used to live in
   admin.js and call EXPENSE_SYNC.resetTrip()/MOMENT_SYNC.resetTrip()
   independently — each of which did its own multi-step cloud delete with
   no shared "this trip was reset" signal for other devices to detect.

   Required flow (see RC11R4-ROOT-CAUSE-REPORT.md):
     Pause sync
       -> single database RPC (reset_trip): bumps trip generation,
          deletes trip_expenses + trip_moments, in one transaction
       -> delete Storage photos, verify the folder is empty
       -> clear this device's local state (synced stores + device-only UI state)
       -> reload

   No step here talks to the cloud more than once for the same concern.
   The database RPC is the only place expense/moment ROWS are deleted;
   MOMENT_SYNC.resetCloudPhotos() is the only place photo files are
   deleted; EXPENSE_SYNC.clearLocal()/MOMENT_SYNC.clearLocal() are the only
   places local synced stores are cleared. reset-runtime.js only sequences
   those, plus clears the handful of device-local-only keys (checklist,
   admin draft, itinerary overrides, etc.) that were never part of the
   cloud contract and so aren't touched by TRIP_GENERATION's clear either. */
(function(root){
  'use strict';

  async function callResetRpc(){
    if(!root.SUPABASE?.getClient||!root.SUPABASE?.getSession)throw new Error('Shared Supabase client runtime unavailable');
    await root.SUPABASE.getSession();
    const config=root.SYNC_CONFIG||{};
    const rpcName=config.rpc?.resetTrip||'reset_trip';
    const {data,error}=await root.SUPABASE.getClient().rpc(rpcName,{p_trip_id:config.tripId});
    if(error){
      const missing=/could not find|does not exist|schema cache/i.test(error.message||'');
      throw new Error(missing
        ?`Reset RPC "${rpcName}" is not installed. Run SUPABASE_STAGE_11_RESET_ARCHITECTURE.sql, then try Reset again.`
        :(error.message||'Reset RPC failed'));
    }
    const row=Array.isArray(data)?data[0]:data;
    if(!row||typeof row.new_generation!=='number')throw new Error('Reset RPC returned an unexpected result');
    return row;
  }

  function clearDeviceOnlyUiState(){
    const exactKeys=[
      STORAGE_CONFIG.keys.checklist,
      STORAGE_CONFIG.keys.momentsFreeform,
      STORAGE_CONFIG.keys.adminDraft,
      STORAGE_CONFIG.keys.guideNavContext,
      STORAGE_CONFIG.keys.guideNavReopen,
      STORAGE_CONFIG.keys.itineraryOverrides,
      STORAGE_CONFIG.keys.tripCompletion,
      STORAGE_CONFIG.keys.changedPlans,
      STORAGE_CONFIG.keys.cloudSnapshot,
      STORAGE_CONFIG.keys.cloudSyncMeta,
      STORAGE_CONFIG.keys.tripCompletion+':notice',
      'travel_engine_cloud_reload_version_v1'
    ];
    exactKeys.forEach(k=>STORAGE.local.remove(k));
  }

  window.resetTripData=async function(){
    if(!window.isAdminUnlocked?.() || !window.isAdminMode?.()){ alert('Open Trip Studio before resetting trip data.'); return false; }
    if(window.hasUnsavedAdminChanges?.()){ alert('Save or discard pending Trip Studio changes before resetting trip data.'); return false; }
    const ok=window.confirm('Reset Trip Data?\n\nThis permanently deletes all synced expenses, moments and uploaded photos for this trip, then clears saved progress from this device.\n\nThe original itinerary and guide will remain. This cannot be undone.');
    if(!ok) return false;

    const button=document.getElementById('resetTripDataButton');
    if(button){button.disabled=true;button.setAttribute('aria-busy','true');}

    try{
      if(!navigator.onLine) throw new Error('Connect to the internet before resetting trip data so cloud records and photos can be deleted safely.');
      if(!window.SYNC_CONFIG?.hasCredentials?.()) throw new Error('Cloud reset is not configured. Reload the app and try again.');
      if(!window.EXPENSE_SYNC?.clearLocal || !window.MOMENT_SYNC?.clearLocal || !window.MOMENT_SYNC?.resetCloudPhotos || !window.TRIP_GENERATION?.setLocal){
        throw new Error('Reset services are not available. Reload the app and try again.');
      }

      // 1. Pause sync on this device so nothing races the reset.
      window.EXPENSE_SYNC.pause();
      window.MOMENT_SYNC.pause();

      // 2. Single database transaction: bump generation, delete both
      //    tables. From this instant, any other device's next sync will
      //    see cloud_generation > its local generation and wipe itself
      //    instead of re-uploading stale rows.
      const {new_generation}=await callResetRpc();

      // 3. Delete Storage photos, verified empty, AFTER the generation
      //    bump — so a photo upload racing the reset either lands before
      //    the bump (and gets deleted here) or is rejected server-side by
      //    the generation trigger.
      await window.MOMENT_SYNC.resetCloudPhotos();

      // 4. Clear this device's own state: the generation, both synced
      //    stores (list + tombstones + sync meta + pending photo queue),
      //    and the device-local-only UI state that was never part of the
      //    cloud contract.
      window.TRIP_GENERATION.setLocal(new_generation);
      window.EXPENSE_SYNC.clearLocal();
      await window.MOMENT_SYNC.clearLocal();
      clearDeviceOnlyUiState();

      alert('Trip data has been permanently reset on this device and in the cloud. The clean companion will now reload.');
      window.location.reload();
      return true;
    }catch(error){
      console.error('[Reset Trip Data]',error);
      alert(`Reset could not be completed. No local data was cleared.\n\n${error?.message||String(error)}`);
      if(button){button.disabled=false;button.removeAttribute('aria-busy');}
      return false;
    }
  };
})(globalThis);
