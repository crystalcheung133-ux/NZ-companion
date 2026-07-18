/* Travel Engine v1.0 — Stage 8A Complete Mode lifecycle. */
(function(){
  'use strict';
  const KEY=STORAGE_CONFIG.keys.tripCompletion;
  const ADMIN_USER='lee';
  let completed=false;
  let record=null;

  function tripId(){ return TRIP_CONFIG.storageNamespace || TRIP_CONFIG.tripName || 'trip'; }
  function valid(value){ return !!value && value.version===1 && value.tripId===tripId() && value.completed===true; }
  function read(){ const value=STORAGE.local.readJSON(KEY,null); return valid(value)?value:null; }
  function guardMessage(){ alert('This trip is complete and is now read-only.'); return false; }
  function isMutationControl(el){
    if(!el) return false;
    if(el.closest('#adminModeControl,#adminSaveBar')) return true;
    const call=(el.getAttribute('onclick')||'')+(el.getAttribute('onchange')||'');
    return /saveChecklist|openExpenseModal|saveExpense|editExpense|deleteExpense|openMomentsModal|openPlannedMomentCapture|saveMoments|editMoment|deleteMoment|openUnexpectedModal|saveUnexpected|setAdminMode|saveAdminChanges|discardAdminChanges/.test(call);
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
    const completeButton=document.getElementById('completeTripButton');
    if(completeButton) completeButton.hidden=completed || getFriend()!==ADMIN_USER;
  }
  function buildControl(){
    const host=document.querySelector('#mamaModal .guide-sheet');
    if(!host || document.getElementById('completeTripControl')) return;
    const section=document.createElement('section');
    section.id='completeTripControl';
    section.className='complete-trip-control';
    section.innerHTML='<div><strong>Complete Trip</strong><small>Lock trip changes and keep everything available to browse.</small></div><button id="completeTripButton" type="button" class="complete-trip-btn">Complete Trip</button>';
    host.appendChild(section);
    section.querySelector('button').addEventListener('click',window.completeTrip);
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
    const originalSetAdmin=window.setAdminMode;
    if(typeof originalSetAdmin==='function') window.setAdminMode=function(enabled){ if(completed && enabled) return guardMessage(); return originalSetAdmin.apply(this,arguments); };
  }

  window.isTripCompleted=function(){ return completed; };
  window.getTripCompletion=function(){ return record?JSON.parse(JSON.stringify(record)):null; };
  window.assertTripWritable=function(){ return completed?guardMessage():true; };
  window.completeTrip=function(){
    if(completed) return true;
    if(getFriend()!==ADMIN_USER){ alert('Only Lee can complete the trip.'); return false; }
    if(typeof window.hasUnsavedAdminChanges==='function' && window.hasUnsavedAdminChanges()){
      alert('Save or discard the pending Admin changes before completing the trip.');
      return false;
    }
    const ok=window.confirm('Complete this trip? All trip content will remain available to browse, but editing will be permanently disabled on this device.');
    if(!ok) return false;
    if(typeof window.setAdminMode==='function') window.setAdminMode(false);
    record={version:1,tripId:tripId(),completed:true,completedAt:new Date().toISOString(),completedBy:ADMIN_USER};
    STORAGE.local.writeJSON(KEY,record);
    completed=true;
    render();
    document.dispatchEvent(new CustomEvent('travelengine:tripcompleted',{detail:{...record}}));
    closeFriendModal();
    return true;
  };

  record=read();
  completed=!!record;
  installGuards();

  document.addEventListener('DOMContentLoaded',function(){
    buildControl();
    if(completed && typeof window.setAdminMode==='function') window.setAdminMode(false);
    render();
  });
  document.addEventListener('travelengine:adminmodechange',render);
})();
