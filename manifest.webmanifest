/* itinerary-authority.js — RC15 canonical itinerary authority.
   ONE owner for: master identity (masterRevision), saved-override validation,
   pending-draft validation, storage-format migration, and invalidation.
   Nothing else in the app should read or write STORAGE_CONFIG.keys.itineraryOverrides
   directly, and nothing else should decide whether a saved/pending itinerary
   change is still valid — every consumer (day.html, publication-runtime.js,
   export-runtime.js) calls into this module instead.

   Lifecycle implemented here (see RC15-ROOT-CAUSE-AUDIT.md):
     Current Master File + Saved Admin edits = Current Itinerary
     New Master File = new authoritative baseline; anything (saved override or
     pending draft change) stamped with a different masterRevision is invalid
     and is dropped — never applied, never left silently masking the master.

   masterRevision is a deterministic content hash of the shipped ITINERARY_DATA
   (computed in data.js, before any cloud hydration can touch it). It is NOT a
   build/version string and NOT a one-time migration flag — it changes exactly
   when the master's own itinerary content changes, so a stale override always
   fails validation against a newer master and a same-master edit always
   passes, regardless of build numbers or cache names. */
(function(root){
  'use strict';

  function log(){ if(root.console&&console.warn) console.warn.apply(console,['[ItineraryAuthority]'].concat(Array.prototype.slice.call(arguments))); }

  /* Defensive fallback hash — identical algorithm to the one in data.js.
     Only used if data.js has not yet set MASTER_ITINERARY_REVISION for some
     reason (should not happen in normal load order); data.js's own value is
     always used when present so there is a single source of truth. */
  function hashString(input){
    let h1=0xdeadbeef^input.length,h2=0x41c6ce57^input.length;
    for(let i=0;i<input.length;i++){
      const ch=input.charCodeAt(i);
      h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677);
    }
    h1=Math.imul(h1^(h1>>>16),2246822507);h1^=Math.imul(h2^(h2>>>13),3266489909);
    h2=Math.imul(h2^(h2>>>16),2246822507);h2^=Math.imul(h1^(h1>>>13),3266489909);
    return (4294967296*(2097151&h2)+(h1>>>0)).toString(16);
  }
  function computeRevisionFallback(){
    try{
      const source=root.ITINERARY_DATA||(root.TRAVEL_DATASETS&&root.TRAVEL_DATASETS.ITINERARY_DATA)||{};
      return hashString(JSON.stringify(source));
    }catch(error){ log('Could not compute fallback master revision',error); return null; }
  }
  function getMasterRevision(){
    return root.MASTER_ITINERARY_REVISION||computeRevisionFallback();
  }

  function storageKey(){ return (root.STORAGE_CONFIG&&root.STORAGE_CONFIG.keys&&root.STORAGE_CONFIG.keys.itineraryOverrides)||'travel_engine_itinerary_overrides_v1'; }
  function localStore(){ return root.STORAGE&&root.STORAGE.local?root.STORAGE.local:null; }
  function draftKey(){ return (root.STORAGE_CONFIG&&root.STORAGE_CONFIG.keys&&root.STORAGE_CONFIG.keys.adminDraft)||'travel_engine_admin_draft_v1'; }
  function clone(value){ return value==null?value:JSON.parse(JSON.stringify(value)); }

  function emptyStore(){ return {masterRevision:getMasterRevision(),dayChanges:{}}; }

  /* Accepts any previously-saved shape and returns a store that is guaranteed
     to be {masterRevision, dayChanges:{day:{items:[...]}}} and bound to the
     CURRENT master. Three input shapes are handled:
       1. Missing / null              -> fresh empty store.
       2. Legacy flat {"2":[...]}     -> revision is unknown, so the whole
                                          store is treated as belonging to an
                                          unrecoverable previous master and is
                                          dropped (Test A: legacy override must
                                          never mask the current master).
       3. Current {masterRevision,dayChanges} -> kept only if masterRevision
          matches; otherwise dropped (Test C: new Master File invalidates the
          previous master's saved overrides). */
  function normalizeStore(raw){
    const current=getMasterRevision();
    if(!raw||typeof raw!=='object'||Array.isArray(raw)) return emptyStore();
    const hasRevisionShape=typeof raw.masterRevision==='string'&&raw.dayChanges&&typeof raw.dayChanges==='object'&&!Array.isArray(raw.dayChanges);
    if(!hasRevisionShape){
      // Legacy flat shape (or anything unrecognised) — revision unknown, discard.
      return emptyStore();
    }
    if(raw.masterRevision!==current){
      // Saved under a previous master — invalidate rather than let it mask
      // whatever the current master says.
      return emptyStore();
    }
    const cleanChanges={};
    Object.keys(raw.dayChanges).forEach(function(day){
      const entry=raw.dayChanges[day];
      if(entry&&Array.isArray(entry.items)) cleanChanges[String(day)]={items:clone(entry.items)};
    });
    return {masterRevision:current,dayChanges:cleanChanges};
  }

  /* Reads, migrates/validates and — only when the on-disk shape actually
     needed to change — persists the result once. Safe to call on every
     render; it only writes when normalization produced a different result. */
  function getValidatedStore(){
    const store=localStore();
    const raw=store?store.readJSON(storageKey(),null):null;
    const normalized=normalizeStore(raw);
    const rawJson=raw?JSON.stringify(raw):null;
    const normalizedJson=JSON.stringify(normalized);
    if(store&&rawJson!==normalizedJson){
      store.writeJSON(storageKey(),normalized);
    }
    return normalized;
  }

  function getDayOverrideItems(dayKey){
    const store=getValidatedStore();
    const entry=store.dayChanges[String(dayKey)];
    return entry&&Array.isArray(entry.items)?clone(entry.items):null;
  }

  /* Commits a batch of admin-draft changes (as produced by admin.js's
     'itineraryDay<N>' keys) into the saved-override store, stamped with the
     CURRENT master revision. This is the only path that writes saved
     overrides — day.html's 'travelengine:adminsave' handler calls this
     instead of touching localStorage directly. */
  function commitDayChanges(changes){
    const store=getValidatedStore();
    Object.keys(changes||{}).forEach(function(key){
      if(!key.startsWith('itineraryDay')) return;
      const change=changes[key];
      if(change&&Array.isArray(change.items)){
        store.dayChanges[String(change.day)]={items:clone(change.items)};
      }
    });
    store.masterRevision=getMasterRevision();
    const backing=localStore();
    if(backing) backing.writeJSON(storageKey(),store);
    return store;
  }

  function clearDayOverride(dayKey){
    const store=getValidatedStore();
    delete store.dayChanges[String(dayKey)];
    const backing=localStore();
    if(backing) backing.writeJSON(storageKey(),store);
    return store;
  }

  /* Pending (unsaved) Admin Mode edits live in the admin draft, keyed
     'itineraryDay<N>' -> {day, items, masterRevision}. day.html stamps
     masterRevision when it marks a day dirty; this validates that stamp
     against the current master before ever trusting a pending edit. */
  function getPendingDayItems(dayKey){
    const draft=typeof root.getAdminDraft==='function'?root.getAdminDraft():null;
    const pending=draft&&draft.changes?draft.changes['itineraryDay'+dayKey]:null;
    if(!pending||!Array.isArray(pending.items)) return null;
    if(pending.masterRevision!==getMasterRevision()) return null;
    return clone(pending.items);
  }

  /* Removes only the itinerary-related entries of the persisted admin draft
     that belong to a previous master, leaving every other pending change
     (and the draft itself) intact. Call once per page load — not on every
     render — since it performs a write. (Test D) */
  function pruneStaleDraftItineraryChanges(){
    const backing=localStore();
    if(!backing) return;
    const raw=backing.readJSON(draftKey(),null);
    if(!raw||!raw.changes||typeof raw.changes!=='object') return;
    const current=getMasterRevision();
    let changed=false;
    Object.keys(raw.changes).forEach(function(key){
      if(!key.startsWith('itineraryDay')) return;
      const change=raw.changes[key];
      if(change&&Array.isArray(change.items)&&change.masterRevision!==current){
        delete raw.changes[key];
        changed=true;
      }
    });
    if(changed) backing.writeJSON(draftKey(),raw);
  }

  /* Single resolver used by every itinerary consumer:
     pending (validated) -> saved override (validated) -> master. */
  function resolveDayItems(dayKey,masterItems){
    const pending=getPendingDayItems(dayKey);
    if(pending) return pending;
    const saved=getDayOverrideItems(dayKey);
    if(saved) return saved;
    return clone(masterItems||[]);
  }

  /* Used by sync-runtime.js to decide whether a cached/fetched Supabase
     publication is compatible with the master file that is CURRENTLY
     deployed on this device. A publication built from an older/different
     master must never be allowed to mask a newer one. */
  function isCompatibleSnapshotPayload(payload){
    const current=getMasterRevision();
    return !!(current&&payload&&typeof payload==='object'&&payload.masterRevision===current);
  }

  root.ITINERARY_AUTHORITY=Object.freeze({
    getMasterRevision,
    resolveDayItems,
    getDayOverrideItems,
    getPendingDayItems,
    commitDayChanges,
    clearDayOverride,
    pruneStaleDraftItineraryChanges,
    isCompatibleSnapshotPayload
  });
})(globalThis);
