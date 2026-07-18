/* ============================================================================
   TRAVEL ENGINE — ADMIN MODE RUNTIME
   Stage 7K-2C: extracted from script.js without changing behaviour.
   Load after script.js because this module wraps the shared setFriend() API.
   ============================================================================ */

/* ============================================================================
   STAGE 6A-2 — ADMIN MODE + TIMELINE EDITING
   Shared Admin shell with Day timeline editing support.
   ============================================================================ */
(function(){
  const MODE_KEY=STORAGE_CONFIG.keys.adminMode;
  const DRAFT_KEY=STORAGE_CONFIG.keys.adminDraft;
    const ADMIN_USER='lee';
  const state={mode:false,dirty:false,draft:null};

  function isAdminUser(){ return getFriend()===ADMIN_USER; }
  function readJSON(key,fallback){
    try{ const value=STORAGE.local.readJSON(key,null); return value==null?fallback:value; }
    catch(e){ return fallback; }
  }
  function writeJSON(key,value){
    try{return STORAGE.local.writeJSON(key,value);}
    catch(e){return false;}
  }
  function readMode(){ return isAdminUser() && STORAGE.local.get(MODE_KEY)==='admin'; }
  function setStoredMode(enabled){
    if(enabled) STORAGE.local.set(MODE_KEY,'admin');
    else STORAGE.local.remove(MODE_KEY);
  }
  function ensureDraft(){
    if(!state.draft){
      state.draft=readJSON(DRAFT_KEY,{version:1,tripId:TRIP_CONFIG.tripName,changes:{},updatedAt:null});
    }
    return state.draft;
  }
  function hasDraftChanges(draft){ return !!draft && !!draft.changes && Object.keys(draft.changes).length>0; }
  function updateUI(){
    document.body.classList.toggle('admin-mode',state.mode);
    document.body.classList.toggle('admin-dirty',state.mode&&state.dirty);
    const control=document.getElementById('adminModeControl');
    if(control) control.hidden=!isAdminUser();
    const toggle=document.getElementById('adminModeToggle');
    if(toggle){
      toggle.checked=state.mode;
      toggle.setAttribute('aria-checked',String(state.mode));
    }
    const banner=document.getElementById('adminModeBanner');
    if(banner) banner.hidden=!state.mode;
    const bar=document.getElementById('adminSaveBar');
    if(bar) bar.hidden=!(state.mode&&state.dirty);
    const status=document.getElementById('adminDirtyText');
    if(status) status.textContent=state.dirty?'Unsaved changes':'All changes saved';
  }
  function buildShell(){
    const familySheet=document.querySelector('#mamaModal .guide-sheet');
    if(familySheet && !document.getElementById('adminModeControl')){
      const block=document.createElement('section');
      block.id='adminModeControl';
      block.className='admin-mode-control';
      block.innerHTML=`<div class="admin-control-head"><div><strong>Admin Mode</strong><small>Edit and reorganise Day timeline cards</small></div><label class="admin-switch"><input id="adminModeToggle" type="checkbox" role="switch" aria-label="Toggle Admin Mode"><span></span></label></div>`;
      familySheet.appendChild(block);
      const input=block.querySelector('#adminModeToggle');
      input.addEventListener('change',()=>window.setAdminMode(input.checked));
    }
    if(!document.getElementById('adminModeBanner')){
      const banner=document.createElement('div');
      banner.id='adminModeBanner';
      banner.className='admin-mode-banner';
      banner.setAttribute('role','status');
      banner.hidden=true;
      banner.innerHTML='<strong>ADMIN MODE</strong><span id="adminDirtyText">All changes saved</span>';
      document.body.prepend(banner);
    }
    if(!document.getElementById('adminSaveBar')){
      const bar=document.createElement('div');
      bar.id='adminSaveBar';
      bar.className='admin-save-bar';
      bar.hidden=true;
      bar.innerHTML='<div><strong>Unsaved changes</strong><small>Save or discard before leaving Admin Mode.</small></div><div class="admin-save-actions"><button type="button" class="admin-discard-btn" onclick="discardAdminChanges()">Discard</button><button type="button" class="admin-save-btn" onclick="saveAdminChanges()">Save Changes</button></div>';
      document.body.appendChild(bar);
    }
  }
  function confirmExit(){
    if(!state.dirty) return true;
    return window.confirm('You have unsaved Admin changes. Discard them and leave Admin Mode?');
  }

  window.setAdminMode=function(enabled){
    enabled=!!enabled;
    if(enabled && !isAdminUser()){
      alert('Admin Mode is available to Lee only.');
      updateUI();
      return false;
    }
    if(!enabled && state.dirty){
      const leave=confirmExit();
      if(!leave){ updateUI(); return false; }
      window.discardAdminChanges();
    }
    state.mode=enabled;
    setStoredMode(enabled);
    updateUI();
    document.dispatchEvent(new CustomEvent('travelengine:adminmodechange',{detail:{enabled}}));
    return true;
  };

  window.markAdminDirty=function(changeKey,payload){
    if(!state.mode) return false;
    const draft=ensureDraft();
    draft.changes[String(changeKey||'general')]=payload==null?true:payload;
    draft.updatedAt=new Date().toISOString();
    writeJSON(DRAFT_KEY,draft);
    state.dirty=true;
    updateUI();
    document.dispatchEvent(new CustomEvent('travelengine:admindirty',{detail:{changeKey,payload}}));
    return true;
  };

  window.getAdminDraft=function(){ return JSON.parse(JSON.stringify(ensureDraft())); };
  window.isAdminMode=function(){ return state.mode; };
  window.hasUnsavedAdminChanges=function(){ return state.dirty; };

  window.saveAdminChanges=function(){
    if(!state.mode || !state.dirty) return true;
    const draft=ensureDraft();
    document.dispatchEvent(new CustomEvent('travelengine:adminsave',{detail:{draft:JSON.parse(JSON.stringify(draft))}}));
    draft.changes={};
    draft.updatedAt=new Date().toISOString();
    writeJSON(DRAFT_KEY,draft);
    state.dirty=false;
    updateUI();
    return true;
  };

  window.discardAdminChanges=function(){
    const draft=ensureDraft();
    document.dispatchEvent(new CustomEvent('travelengine:admindiscard',{detail:{draft:JSON.parse(JSON.stringify(draft))}}));
    draft.changes={};
    draft.updatedAt=new Date().toISOString();
    writeJSON(DRAFT_KEY,draft);
    state.dirty=false;
    updateUI();
    return true;
  };

  const originalSetFriend=window.setFriend||setFriend;
  window.setFriend=function(key){
    if(state.mode&&state.dirty&&!confirmExit()) return;
    if(state.mode&&state.dirty) window.discardAdminChanges();
    if(key!==ADMIN_USER){ state.mode=false; setStoredMode(false); }
    originalSetFriend(key);
    state.mode=readMode();
    updateUI();
  };

  /* Pending Admin changes are intentionally allowed to travel across pages.
     The draft is already persisted under DRAFT_KEY by markAdminDirty(), so normal
     in-app navigation must never commit, discard, or prompt. Only the explicit
     Save Changes button commits the draft to itinerary overrides. */

  document.addEventListener('DOMContentLoaded',function(){
    buildShell();
    state.draft=readJSON(DRAFT_KEY,{version:1,changes:{},updatedAt:null});
    state.dirty=hasDraftChanges(state.draft);
    state.mode=readMode();
    updateUI();
  });
})();
