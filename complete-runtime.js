/* Travel Engine v1.0 — Stage 8A-2 Complete Mode lifecycle. */
(function(){
  'use strict';
  const KEY=STORAGE_CONFIG.keys.tripCompletion;
  const ADMIN_USER='lee';
  let completed=false;
  let record=null;

  function tripId(){ return TRIP_CONFIG.storageNamespace || TRIP_CONFIG.tripName || 'trip'; }
  function valid(value){ return !!value && value.version===1 && value.tripId===tripId() && typeof value.completed==='boolean'; }
  function read(){ const value=STORAGE.local.readJSON(KEY,null); return valid(value)?value:null; }
  function guardMessage(){ alert('This trip is complete and is now read-only.'); return false; }
  function isMutationControl(el){
    if(!el) return false;
    if(el.closest('#adminSaveBar')) return true;
    const call=(el.getAttribute('onclick')||'')+(el.getAttribute('onchange')||'');
    return /saveChecklist|openExpenseModal|saveExpense|editExpense|deleteExpense|openMomentsModal|openPlannedMomentCapture|saveMoments|editMoment|deleteMoment|openUnexpectedModal|saveUnexpected|setAdminMode|saveAdminChanges|discardAdminChanges/.test(call);
  }
  function updateLifecycleControl(){
    const control=document.getElementById('completeTripControl');
    const title=document.getElementById('completeTripTitle');
    const help=document.getElementById('completeTripHelp');
    const button=document.getElementById('completeTripButton');
    const isAdmin=getFriend()===ADMIN_USER && typeof window.isAdminMode==='function' && window.isAdminMode();
    if(control) control.hidden=!isAdmin;
    if(!button) return;
    if(completed){
      if(title) title.textContent='Trip Completed';
      if(help) help.textContent='Reopen the trip to enable editing again. Existing data will remain unchanged.';
      button.textContent='Reopen Trip';
      button.classList.add('reopen-trip-btn');
      button.onclick=window.reopenTrip;
    }else{
      if(title) title.textContent='Complete Trip';
      if(help) help.textContent='Lock trip changes and keep everything available to browse.';
      button.textContent='Complete Trip';
      button.classList.remove('reopen-trip-btn');
      button.onclick=window.completeTrip;
    }
  }
  function render(){
    document.body.classList.toggle('trip-completed',completed);
    let banner=document.getElementById('tripCompleteBanner');
    if(completed && !banner){
      banner=document.createElement('div');
      banner.id='tripCompleteBanner';
      banner.className='trip-complete-banner';
      banner.setAttribute('role','status');
      banner.innerHTML='<strong>TRIP COMPLETE</strong><span>Read only</span>';
      document.body.prepend(banner);
    }
    if(banner) banner.hidden=!completed;
    document.querySelectorAll('[data-check]').forEach(el=>{el.disabled=completed;});
    document.querySelectorAll('#expenseModal input,#expenseModal select,#expenseModal textarea,#expenseModal button:not(.tools-close),#momentsModal input,#momentsModal select,#momentsModal textarea,#momentsModal button:not(.moments-close),#unexpectedModal textarea,#unexpectedModal button:not(.unexpected-close)').forEach(el=>{el.disabled=completed;});
    document.querySelectorAll('button,a').forEach(el=>{if(isMutationControl(el)){el.hidden=completed;el.setAttribute('aria-hidden',String(completed));}});
    updateLifecycleControl();
  }
  function buildControl(){
    const host=document.querySelector('#mamaModal .guide-sheet');
    if(!host || document.getElementById('completeTripControl')) return;
    const section=document.createElement('section');
    section.id='completeTripControl';
    section.className='complete-trip-control';
    section.innerHTML='<div><strong id="completeTripTitle">Complete Trip</strong><small id="completeTripHelp">Lock trip changes and keep everything available to browse.</small></div><button id="completeTripButton" type="button" class="complete-trip-btn">Complete Trip</button>';
    host.appendChild(section);
  }
  function wrap(name){
    const original=window[name];
    if(typeof original!=='function' || original.__completeGuarded) return;
    const wrapped=function(){ if(completed) return guardMessage(); return original.apply(this,arguments); };
    wrapped.__completeGuarded=true;
    window[name]=wrapped;
  }
  function installGuards(){
    ['saveChecklist','openExpenseModal','saveExpense','editExpense','deleteExpense','openMomentsModal','openPlannedMomentCapture','saveMoments','editMoment','deleteMoment','openUnexpectedModal','saveUnexpected','markAdminDirty','saveAdminChanges','discardAdminChanges'].forEach(wrap);
  }
  function persist(nextRecord){
    record=nextRecord;
    STORAGE.local.writeJSON(KEY,record);
    completed=record.completed===true;
    render();
  }

  window.isTripCompleted=function(){ return completed; };
  window.getTripCompletion=function(){ return record?JSON.parse(JSON.stringify(record)):null; };
  window.assertTripWritable=function(){ return completed?guardMessage():true; };
  window.completeTrip=function(){
    if(completed) return true;
    if(getFriend()!==ADMIN_USER || typeof window.isAdminMode!=='function' || !window.isAdminMode()){ alert('Enter Admin Mode to complete the trip.'); return false; }
    if(typeof window.hasUnsavedAdminChanges==='function' && window.hasUnsavedAdminChanges()){
      alert('Save or discard the pending Admin changes before completing the trip.');
      return false;
    }
    const ok=window.confirm('Complete this trip? All trip content will remain available to browse, but editing will be disabled until Lee reopens the trip.');
    if(!ok) return false;
    if(typeof window.setAdminMode==='function') window.setAdminMode(false);
    const next={version:1,tripId:tripId(),completed:true,completedAt:new Date().toISOString(),completedBy:ADMIN_USER};
    persist(next);
    document.dispatchEvent(new CustomEvent('travelengine:tripcompleted',{detail:{...next}}));
    closeFriendModal();
    return true;
  };
  window.reopenTrip=function(){
    if(!completed) return true;
    if(getFriend()!==ADMIN_USER || typeof window.isAdminMode!=='function' || !window.isAdminMode()){ alert('Enter Admin Mode to reopen the trip.'); return false; }
    const ok=window.confirm('Reopen this trip? Editing will be enabled again. Existing moments, expenses and trip data will remain unchanged.');
    if(!ok) return false;
    const next={
      version:1,
      tripId:tripId(),
      completed:false,
      completedAt:record&&record.completedAt?record.completedAt:null,
      completedBy:record&&record.completedBy?record.completedBy:ADMIN_USER,
      reopenedAt:new Date().toISOString(),
      reopenedBy:ADMIN_USER
    };
    persist(next);
    document.dispatchEvent(new CustomEvent('travelengine:tripreopened',{detail:{...next}}));
    closeFriendModal();
    return true;
  };

  record=read();
  completed=!!record && record.completed===true;
  installGuards();

  document.addEventListener('DOMContentLoaded',function(){
    buildControl();
    if(completed && typeof window.setAdminMode==='function') window.setAdminMode(false);
    render();
  });
  document.addEventListener('travelengine:adminmodechange',render);
})();
