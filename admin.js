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
  const ADMIN_PIN='260922';
  const SESSION_KEY='travel_engine_admin_unlocked_v1';
  const state={mode:false,dirty:false,draft:null};

  function isAdminUser(){ return getFriend()===ADMIN_USER; }
  function isUnlocked(){ return sessionStorage.getItem(SESSION_KEY)==='1'; }
  function lockAdminSession(){ sessionStorage.removeItem(SESSION_KEY); }
  function scrollTripStudioToBottom(){
    const modal=document.getElementById('mamaModal');
    const sheet=modal&&modal.querySelector('.guide-sheet');
    const studio=document.getElementById('adminModeControl');
    if(!modal||!sheet||!studio) return;
    window.requestAnimationFrame(()=>window.requestAnimationFrame(()=>{
      sheet.scrollTop=0;
      modal.scrollTop=0;
      studio.scrollIntoView({block:'start'});
    }));
  }
  function closeTripStudioPanel(){
    const modal=document.getElementById('mamaModal');
    const studio=document.getElementById('adminModeControl');
    if(studio) studio.hidden=true;
    if(modal){
      modal.classList.remove('studio-view');
      modal.classList.remove('show');
    }
  }
  function openTripStudioPanel(){
    if(!isAdminUser()){ alert('Trip Studio is available to Lee only.'); return false; }
    if(typeof renderFriendChoices==='function') renderFriendChoices();
    const modal=document.getElementById('mamaModal');
    const studio=document.getElementById('adminModeControl');
    if(!modal||!studio) return false;
    studio.hidden=false;
    modal.classList.add('studio-view');
    modal.classList.add('show');
    scrollTripStudioToBottom();
    return true;
  }
  function syncPinModalToVisualViewport(modal){
    if(!modal) return;
    const viewport=window.visualViewport;
    const top=viewport?Math.max(0,viewport.offsetTop):0;
    const height=viewport?viewport.height:window.innerHeight;
    modal.style.setProperty('--admin-pin-vv-top',`${Math.round(top)}px`);
    modal.style.setProperty('--admin-pin-vv-height',`${Math.round(height)}px`);
  }
  function ensurePinModal(){
    let modal=document.getElementById('adminPinModal');
    if(modal) return modal;
    modal=document.createElement('div');
    modal.id='adminPinModal';
    modal.className='admin-pin-modal';
    modal.hidden=true;
    modal.innerHTML=`<div class="admin-pin-sheet" role="dialog" aria-modal="true" aria-labelledby="adminPinTitle"><button type="button" class="admin-pin-close" aria-label="Close">×</button><p class="kicker">TRIP STUDIO ACCESS</p><h2 id="adminPinTitle">Enter Studio PIN</h2><p class="admin-pin-help">Enter the 6-digit PIN to open Trip Studio.</p><form id="adminPinForm"><input id="adminPinInput" type="tel" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" aria-label="6-digit Trip Studio PIN" placeholder="••••••"><p id="adminPinError" class="admin-pin-error" hidden>Incorrect PIN.</p><button type="submit" class="admin-pin-submit">Open Trip Studio</button></form></div>`;
    document.body.appendChild(modal);
    const syncViewport=()=>syncPinModalToVisualViewport(modal);
    const close=()=>{
      modal.hidden=true;
      const input=modal.querySelector('#adminPinInput');
      if(input) input.value='';
      if(window.visualViewport){
        window.visualViewport.removeEventListener('resize',syncViewport);
        window.visualViewport.removeEventListener('scroll',syncViewport);
      }
    };
    modal.querySelector('.admin-pin-close').addEventListener('click',close);
    modal.addEventListener('click',event=>{ if(event.target===modal) close(); });
    modal.querySelector('#adminPinInput').addEventListener('input',event=>{ event.target.value=event.target.value.replace(/\D/g,'').slice(0,6); const error=modal.querySelector('#adminPinError'); if(error) error.hidden=true; });
    modal._syncAdminPinViewport=syncViewport;
    modal.querySelector('#adminPinForm').addEventListener('submit',event=>{
      event.preventDefault();
      const input=modal.querySelector('#adminPinInput');
      const value=input?input.value:'';
      const error=modal.querySelector('#adminPinError');
      if(value!==ADMIN_PIN){ if(error) error.hidden=false; if(input){ input.value=''; input.focus(); } return; }
      sessionStorage.setItem(SESSION_KEY,'1');
      close();
      window.setAdminMode(true);
    });
    return modal;
  }
  function requestUnlock(){
    if(typeof window.closeFriendModal==='function') window.closeFriendModal();
    const modal=ensurePinModal();
    modal.hidden=false;
    if(typeof modal._syncAdminPinViewport==='function') modal._syncAdminPinViewport();
    if(window.visualViewport && typeof modal._syncAdminPinViewport==='function'){
      window.visualViewport.addEventListener('resize',modal._syncAdminPinViewport);
      window.visualViewport.addEventListener('scroll',modal._syncAdminPinViewport);
    }
    const input=modal.querySelector('#adminPinInput');
    if(input){
      try{ input.focus({preventScroll:true}); }catch(e){ input.focus(); }
      window.requestAnimationFrame(()=>{
        if(typeof modal._syncAdminPinViewport==='function') modal._syncAdminPinViewport();
        if(document.activeElement!==input){
          try{ input.focus({preventScroll:true}); }catch(e){ input.focus(); }
        }
        window.setTimeout(()=>{
          if(typeof modal._syncAdminPinViewport==='function') modal._syncAdminPinViewport();
        },120);
      });
    }
    return false;
  }
  function readMode(){ return isAdminUser() && isUnlocked() && STORAGE.local.get(MODE_KEY)==='admin'; }
  function setStoredMode(enabled){
    if(enabled) STORAGE.local.set(MODE_KEY,'admin');
    else STORAGE.local.remove(MODE_KEY);
  }
  function ensureDraft(){
    if(!state.draft){
      state.draft=STORAGE.local.readJSON(DRAFT_KEY,{version:1,tripId:TRIP_CONFIG.tripName,changes:{},updatedAt:null});
    }
    return state.draft;
  }
  function hasDraftChanges(draft){ return !!draft && !!draft.changes && Object.keys(draft.changes).length>0; }
  function updateUI(){
    document.body.classList.toggle('admin-mode',state.mode);
    document.body.classList.toggle('admin-dirty',state.mode&&state.dirty);
    const control=document.getElementById('adminModeControl');
    if(control && !document.getElementById('mamaModal')?.classList.contains('studio-view')) control.hidden=true;
    const entry=document.getElementById('tripStudioEntry');
    if(entry) entry.hidden=!isAdminUser();
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
    const exportButton=document.getElementById('expenseExportButton');
    if(exportButton){
      const showExport=state.mode && isUnlocked() && isAdminUser();
      exportButton.hidden=!showExport;
      exportButton.setAttribute('aria-hidden',String(!showExport));
      exportButton.style.display=showExport?'inline-flex':'none';
    }
    ['tripStudioManagement','tripStudioExports','tripStudioDanger'].forEach(id=>{
      const group=document.getElementById(id);
      if(group) group.hidden=!state.mode;
    });
  }
  function buildShell(){
    const familySheet=document.querySelector('#mamaModal .guide-sheet');
    const familyList=familySheet&&familySheet.querySelector('.friend-choice-list');
    if(familySheet && familyList && !document.getElementById('tripStudioEntry')){
      const entry=document.createElement('button');
      entry.id='tripStudioEntry';
      entry.type='button';
      entry.className='trip-studio-entry';
      entry.innerHTML='<span><strong>⚙ Trip Studio</strong><small>Manage itinerary, exports and trip data</small></span><span aria-hidden="true">›</span>';
      entry.addEventListener('click',openTripStudioPanel);
      familyList.insertAdjacentElement('afterend',entry);
    }
    if(familySheet && !document.getElementById('adminModeControl')){
      const block=document.createElement('section');
      block.id='adminModeControl';
      block.className='admin-mode-control trip-studio';
      block.hidden=true;
      block.innerHTML=`
        <header class="trip-studio-head">
          <div>
            <p class="trip-studio-kicker">CREATOR WORKSPACE</p>
            <h3>Trip Studio</h3>
            <small>Create, refine and manage this companion.</small>
          </div>
          <button type="button" class="trip-studio-close" aria-label="Close Trip Studio">×</button>
        </header>
        <div class="trip-studio-section trip-studio-mode">
          <div class="trip-studio-copy"><strong>Studio Mode</strong><small>Turn on editing tools for itinerary and trip data.</small></div>
          <label class="admin-switch"><input id="adminModeToggle" type="checkbox" role="switch" aria-label="Toggle Trip Studio"><span></span></label>
        </div>
        <div id="tripStudioManagement" class="trip-studio-group" hidden>
          <p class="trip-studio-label">TRIP MANAGEMENT</p>
        </div>
        <div id="tripStudioExports" class="trip-studio-group" hidden>
          <p class="trip-studio-label">EXPORT CENTRE</p>
        </div>
        <div id="tripStudioDanger" class="trip-studio-group trip-studio-danger" hidden>
          <p class="trip-studio-label">DATA CONTROL</p>
          <button id="resetTripDataButton" class="reset-trip-data-btn" type="button">
            <span><strong>Reset Trip Data</strong><small>Restore the original trip and remove all saved progress.</small></span><span aria-hidden="true">↺</span>
          </button>
        </div>`;
      familySheet.appendChild(block);
      block.querySelector('.trip-studio-close').addEventListener('click',closeTripStudioPanel);
      const input=block.querySelector('#adminModeToggle');
      input.addEventListener('change',()=>window.setAdminMode(input.checked));
      block.querySelector('#resetTripDataButton').addEventListener('click',window.resetTripData);
    }
    if(!document.getElementById('adminModeBanner')){
      const banner=document.createElement('div');
      banner.id='adminModeBanner';
      banner.className='admin-mode-banner';
      banner.setAttribute('role','status');
      banner.hidden=true;
      banner.innerHTML='<strong>TRIP STUDIO</strong><span id="adminDirtyText">All changes saved</span>';
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
    return window.confirm('You have unsaved Trip Studio changes. Discard them and leave Studio Mode?');
  }


  /* window.resetTripData is defined in reset-runtime.js (RC11R4), which
     owns the whole reset transaction — RPC, storage, and every local store
     that needs clearing. admin.js only builds the button and wires the
     click; it doesn't know how a reset works, on purpose, so there's one
     place (reset-runtime.js) that does. */

  window.setAdminMode=function(enabled){
    enabled=!!enabled;
    if(enabled && !isAdminUser()){
      alert('Trip Studio is available to Lee only.');
      updateUI();
      return false;
    }
    if(enabled && !isUnlocked() && !requestUnlock()){
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
    if(!enabled) lockAdminSession();
    updateUI();
    if(!enabled && typeof window.closeFriendModal==='function') window.closeFriendModal();
    if(typeof window.refreshExpenseAdminUI==='function') window.refreshExpenseAdminUI();
    document.dispatchEvent(new CustomEvent('travelengine:adminmodechange',{detail:{enabled:state.mode}}));
    return true;
  };

  window.markAdminDirty=function(changeKey,payload){
    if(!state.mode) return false;
    const draft=ensureDraft();
    draft.changes[String(changeKey||'general')]=payload==null?true:payload;
    draft.updatedAt=new Date().toISOString();
    STORAGE.local.writeJSON(DRAFT_KEY,draft);
    state.dirty=true;
    updateUI();
    document.dispatchEvent(new CustomEvent('travelengine:admindirty',{detail:{changeKey,payload}}));
    return true;
  };

  window.getAdminDraft=function(){ return JSON.parse(JSON.stringify(ensureDraft())); };
  window.isAdminMode=function(){ return state.mode && isUnlocked() && isAdminUser(); };
  window.isAdminUnlocked=function(){ return isUnlocked() && isAdminUser(); };
  window.getAdminPublishCredential=function(){ return isUnlocked() && isAdminUser() ? ADMIN_PIN : null; };
  window.hasUnsavedAdminChanges=function(){ return state.dirty; };

  window.saveAdminChanges=function(){
    if(!state.mode || !state.dirty) return true;
    const draft=ensureDraft();
    document.dispatchEvent(new CustomEvent('travelengine:adminsave',{detail:{draft:JSON.parse(JSON.stringify(draft))}}));
    draft.changes={};
    draft.updatedAt=new Date().toISOString();
    STORAGE.local.writeJSON(DRAFT_KEY,draft);
    state.dirty=false;
    updateUI();
    return true;
  };

  window.discardAdminChanges=function(){
    const draft=ensureDraft();
    document.dispatchEvent(new CustomEvent('travelengine:admindiscard',{detail:{draft:JSON.parse(JSON.stringify(draft))}}));
    draft.changes={};
    draft.updatedAt=new Date().toISOString();
    STORAGE.local.writeJSON(DRAFT_KEY,draft);
    state.dirty=false;
    updateUI();
    return true;
  };

  window.openTripStudioPanel=openTripStudioPanel;
  window.closeTripStudioPanel=closeTripStudioPanel;
  window.scrollTripStudioToBottom=scrollTripStudioToBottom;

  const originalOpenFriendModal=window.openFriendModal||openFriendModal;
  window.openFriendModal=function(){
    const modal=document.getElementById('mamaModal');
    const studio=document.getElementById('adminModeControl');
    if(modal) modal.classList.remove('studio-view');
    if(studio) studio.hidden=true;
    originalOpenFriendModal();
    updateUI();
  };

  const originalSetFriend=window.setFriend||setFriend;
  window.setFriend=function(key){
    if(state.mode&&state.dirty&&!confirmExit()) return;
    if(state.mode&&state.dirty) window.discardAdminChanges();
    if(key!==ADMIN_USER){ state.mode=false; setStoredMode(false); lockAdminSession(); }
    originalSetFriend(key);
    state.mode=readMode();
    updateUI();
    if(typeof window.refreshExpenseAdminUI==='function') window.refreshExpenseAdminUI();
    document.dispatchEvent(new CustomEvent('travelengine:adminmodechange',{detail:{enabled:state.mode}}));
  };

  /* Pending Admin changes are intentionally allowed to travel across pages.
     The draft is already persisted under DRAFT_KEY by markAdminDirty(), so normal
     in-app navigation must never commit, discard, or prompt. Only the explicit
     Save Changes button commits the draft to itinerary overrides. */

  document.addEventListener('DOMContentLoaded',function(){
    buildShell();
    state.draft=STORAGE.local.readJSON(DRAFT_KEY,{version:1,changes:{},updatedAt:null});
    state.dirty=hasDraftChanges(state.draft);
    state.mode=readMode();
    if(STORAGE.local.get(MODE_KEY)==='admin' && !state.mode) setStoredMode(false);
    updateUI();
  });
})();
