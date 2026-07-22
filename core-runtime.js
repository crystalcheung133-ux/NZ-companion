/* RC15.1 — Master itinerary authority migration.
   Saved Admin itinerary snapshots remain authoritative only while they belong
   to the same bundled master itinerary. A changed master clears itinerary-only
   overrides and pending itinerary edits, while preserving every other domain. */
(function(root){
  'use strict';

  function stableStringify(value){
    if(value===null||typeof value!=='object')return JSON.stringify(value);
    if(Array.isArray(value))return '['+value.map(stableStringify).join(',')+']';
    return '{'+Object.keys(value).sort().map(function(key){
      return JSON.stringify(key)+':'+stableStringify(value[key]);
    }).join(',')+'}';
  }

  function hash(text){
    let h=2166136261;
    for(let i=0;i<text.length;i++){
      h^=text.charCodeAt(i);
      h=Math.imul(h,16777619);
    }
    return ('00000000'+(h>>>0).toString(16)).slice(-8);
  }

  function migrate(){
    if(!root.STORAGE_CONFIG||!root.STORAGE||typeof ITINERARY_DATA==='undefined')return;
    const keys=root.STORAGE_CONFIG.keys||{};
    const signatureKey=keys.itineraryMasterSignature||'travel_engine_itinerary_master_signature_v1';
    const overridesKey=keys.itineraryOverrides||'travel_engine_itinerary_overrides_v1';
    const draftKey=keys.adminDraft||'travel_engine_admin_draft_v1';
    const signature='itinerary-v1:'+hash(stableStringify(ITINERARY_DATA));
    const previous=root.STORAGE.local.get(signatureKey);

    if(previous===signature)return;

    /* First RC15.1 run is deliberately a migration: legacy snapshots have no
       master signature, so they cannot safely override the current master. */
    root.STORAGE.local.remove(overridesKey);

    const draft=root.STORAGE.local.readJSON(draftKey,null);
    if(draft&&draft.changes&&typeof draft.changes==='object'){
      const nextChanges={};
      Object.keys(draft.changes).forEach(function(key){
        if(!/^itineraryDay\d+$/.test(key))nextChanges[key]=draft.changes[key];
      });
      draft.changes=nextChanges;
      draft.updatedAt=new Date().toISOString();
      root.STORAGE.local.writeJSON(draftKey,draft);
    }

    root.STORAGE.local.set(signatureKey,signature);
    root.dispatchEvent(new CustomEvent('travelengine:itinerary-master-migrated',{
      detail:{previous:previous||null,current:signature}
    }));
  }

  migrate();
})(globalThis);

/* Travel Engine v1.0 — Stage 7M modular runtime. */
function tripDateParts(date=new Date()){
  return FORMATTER.dateKey(date,TRIP_CONFIG.timeZone);
}
function tripDayNumber(date=new Date()){
  const cfg=TRIP_CONFIG;
  const toUtc=value=>{const [y,m,d]=String(value).split('-').map(Number);return Date.UTC(y,m-1,d);};
  const raw=Math.floor((toUtc(tripDateParts(date))-toUtc(cfg.startDate))/86400000)+1;
  const available=typeof ITINERARY_DATA!=='undefined'?Object.keys(ITINERARY_DATA).map(Number).filter(Number.isFinite):[1];
  return Math.min(Math.max(...available,1),Math.max(1,raw));
}
window.tripDayNumber=tripDayNumber;


/* ============================================================================
   TRAVEL ENGINE ACTIVE-SOURCE NOTE — Stage 4F-S4
   ----------------------------------------------------------------------------
   data.js is the canonical source for trip, place, itinerary, guide, friend
   and booking content. Shared behavior lives in this file; page-specific Day
   and Place render bootstraps remain documented inline in day.html/place.html.

   Expenses use one canonical module for open/save/reset/render/edit/delete/
   history. Moments use one canonical append/edit/delete implementation with
   retained legacy localStorage compatibility reads. See ENGINE_FILE_MAP.md,
   HOW_TO_UPDATE_TRIP.md and ENGINE_CHANGE_PROTOCOL.md.
   ============================================================================ */

/* Stage 7K-2D: Guide navigation context and place routing moved to guide.js. */

function $(id){return document.getElementById(id);}
function escapeHTML(value){return String(value ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function closeMiniMenus(){document.querySelectorAll('.mini-menu').forEach(m=>m.classList.remove('show'));document.body.classList.remove('admin-overlay-open');}
function clampMenuPosition(n,min,max){return Math.max(min,Math.min(max,n));}
function positionMiniMenu(menu,trigger){
  if(!menu||!trigger)return;
  const rect=trigger.getBoundingClientRect();
  const menuWidth=Math.min(230,window.innerWidth-24);
  const center=rect.left+rect.width/2;
  const left=clampMenuPosition(center,12+menuWidth/2,window.innerWidth-12-menuWidth/2);
  menu.style.left=left+'px';
  menu.style.right='auto';
  menu.style.width=menuWidth+'px';
}
function openMiniMenu(id,trigger){
  const m=$(id);
  if(!m)return;
  closeMiniMenus();
  positionMiniMenu(m,trigger||document.activeElement);
  m.classList.add('show');
  document.body.classList.add('admin-overlay-open');
}
function toggleMenu(id,trigger){
  const m=$(id);
  const open=m&&m.classList.contains('show');
  closeMiniMenus();
  if(m&&!open)openMiniMenu(id,trigger);
}
function toggleTripMenu(){toggleMenu('tripMenu',document.querySelector('.trip-trigger'));}
function toggleGuideMenu(){toggleMenu('guideMenu',document.querySelector('.guide-trigger'));}
function toggleDays(){toggleMenu('daysMenu',document.querySelector('.days-trigger'));}
function reopenTripMenu(){requestAnimationFrame(()=>openMiniMenu('tripMenu',document.querySelector('.trip-trigger')));}
function reopenGuideMenu(){requestAnimationFrame(()=>openMiniMenu('guideMenu',document.querySelector('.guide-trigger')));}
window.addEventListener('resize',closeMiniMenus);
document.addEventListener('click',e=>{if(!e.target.closest('.mini-menu')&&!e.target.closest('.trip-modal')&&!e.target.closest('.trip-trigger')&&!e.target.closest('.guide-trigger')&&!e.target.closest('.days-trigger')) closeMiniMenus();});
document.addEventListener('DOMContentLoaded',()=>{
  if(location.hash==='#open-guide'){
    history.replaceState(null,'',location.pathname+location.search);
    reopenGuideMenu();
  }else if(location.hash==='#open-trip'){
    history.replaceState(null,'',location.pathname+location.search);
    reopenTripMenu();
  }
});

function getFriend(){return STORAGE.local.get(STORAGE_CONFIG.keys.friend,TRIP_CONFIG.participants?.defaultKey||'lee');}
function setFriend(k){
  STORAGE.local.set(STORAGE_CONFIG.keys.friend,k);
  closeFriendModal();
  updateFriendLabels();
  if(document.getElementById('expenseModal')?.classList.contains('show')&&typeof window.resetExpenseForm==='function')window.resetExpenseForm();
  if(document.getElementById('momentsModal')?.classList.contains('show')&&typeof window.simplifyMomentsAuthor==='function')window.simplifyMomentsAuthor();
  if(typeof window.refreshExpenseAdminUI==='function')window.refreshExpenseAdminUI();
}
const FRIEND_IDENTITY=TRIP_CONFIG.participants?.identities||{};
function friendIdentityHTML(key,compact=false){
  const fallbackKey=TRIP_CONFIG.participants?.defaultKey||Object.keys(FRIEND_IDENTITY)[0];
  const identity=FRIEND_IDENTITY[key]||FRIEND_IDENTITY[fallbackKey];
  return `<span class="family-identity family-${escapeHTML(key)}${compact?' is-compact':''}"><span class="family-code">${escapeHTML(identity.code)}</span><span class="family-name">${escapeHTML(identity.name)}</span></span>`;
}
window.friendIdentityHTML=friendIdentityHTML;
function updateFriendLabels(){const key=getFriend();document.querySelectorAll('[data-friend-label]').forEach(e=>{e.innerHTML=friendIdentityHTML(key,true);e.dataset.family=key;});}
function renderFriendChoices(){const list=document.querySelector('#mamaModal .friend-choice-list');if(!list)return;const current=getFriend();list.innerHTML=Object.keys(FRIEND_IDENTITY).map(key=>`<button type="button" class="family-choice${key===current?' active':''}" data-family="${key}" onclick="setFriend('${key}')">${friendIdentityHTML(key)}</button>`).join('');}
function openFriendModal(){renderFriendChoices();$('mamaModal').classList.add('show')} function closeFriendModal(){$('mamaModal').classList.remove('show')}



/* Context-aware modal close fallback. */
document.addEventListener('click', function(e){
  const modal = e.target.closest('.guide-modal,.moments-modal,.unexpected-modal,.tools-modal,.mama-modal,.trip-modal');
  if(!modal || e.target !== modal) return;
  if(modal.id==='tripModal' && typeof closeTripModal==='function') closeTripModal();
  else if(modal.id==='guideModal' && typeof closeGuideModal==='function') closeGuideModal();
  else modal.classList.remove('show');
});
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    const tripModal=document.getElementById('tripModal');
    const guideModal=document.getElementById('guideModal');
    if(tripModal?.classList.contains('show') && typeof closeTripModal==='function') closeTripModal();
    else if(guideModal?.classList.contains('show') && typeof closeGuideModal==='function') closeGuideModal();
    else document.querySelectorAll('.moments-modal,.unexpected-modal,.tools-modal,.mama-modal').forEach(m=>m.classList.remove('show'));
  }
});

