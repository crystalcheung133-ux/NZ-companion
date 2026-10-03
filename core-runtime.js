/* FIELD-DIAG2 — capture bottom hit-testing before shared runtime migration. */
(function(root){
  'use strict';
  const KEY='nz_field_diag_v2';
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}}
  function push(type,detail){try{const a=read();a.push({time:new Date().toISOString(),page:(location.pathname.split('/').pop()||'index.html'),type,detail});while(a.length>50)a.shift();localStorage.setItem(KEY,JSON.stringify(a));}catch(e){}}
  function runtime(){try{return root.APP_RUNTIME&&root.APP_RUNTIME.getState?root.APP_RUNTIME.getState():null}catch(e){return null}}
  function brief(el){if(!el)return null;let cs=null;try{cs=getComputedStyle(el)}catch(e){}return {tag:el.tagName||'',id:el.id||'',class:String(el.className||'').slice(0,180),text:String(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,80),position:cs&&cs.position,zIndex:cs&&cs.zIndex,pointerEvents:cs&&cs.pointerEvents,display:cs&&cs.display,visibility:cs&&cs.visibility,opacity:cs&&cs.opacity};}
  function overlays(){const out=[];document.querySelectorAll('body *').forEach(el=>{let cs;try{cs=getComputedStyle(el)}catch(e){return}if(cs.position!=='fixed'||cs.display==='none'||cs.visibility==='hidden'||cs.pointerEvents==='none'||Number(cs.opacity)===0)return;const r=el.getBoundingClientRect();if(r.width<1||r.height<1)return;if(r.bottom<innerHeight-190)return;out.push(Object.assign({rect:[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)]},brief(el)));});return out.slice(0,16);}
  function snap(target,x,y){const ids={trip:'tripMenu',guide:'guideMenu',days:'daysMenu'};const m=target?document.getElementById(ids[target]):null;const r=runtime();let stack=[];try{stack=document.elementsFromPoint(x,y).slice(0,8).map(brief)}catch(e){}return {target,x:Math.round(x),y:Math.round(y),hit:brief(document.elementFromPoint(x,y)),stack,visibleFixedBottom:overlays(),menuExists:!!m,menuClass:m?m.className:'',toggleTrip:typeof root.toggleTripMenu,toggleGuide:typeof root.toggleGuideMenu,toggleDays:typeof root.toggleDays,bodyClass:document.body?document.body.className:'',appReady:r&&r.ready,appValid:r&&r.valid,missing:r&&r.missing,errors:r&&r.errors};}
  function show(info){let box=document.getElementById('nzFieldDiag');if(!box){box=document.createElement('div');box.id='nzFieldDiag';box.style.cssText='position:fixed;z-index:2147483647;left:8px;right:8px;top:34px;max-height:48vh;overflow:auto;background:#fff3cd;color:#3b2f00;border:2px solid #b7791f;border-radius:12px;padding:10px;font:11px/1.3 monospace;white-space:pre-wrap;box-shadow:0 8px 30px rgba(0,0,0,.25);pointer-events:auto';document.body.appendChild(box);}box.textContent='NZ FIELD DIAG2 — screenshot this\n'+JSON.stringify(info,null,2);}
  function badge(){if(document.getElementById('nzDiagBadge'))return;const b=document.createElement('div');b.id='nzDiagBadge';b.textContent='DIAG2';b.style.cssText='position:fixed;z-index:2147483646;top:4px;right:6px;background:#111;color:#fff;padding:4px 7px;border-radius:7px;font:700 11px monospace;pointer-events:none';document.body.appendChild(b);}
  function targetFor(el){const b=el&&el.closest?el.closest('.trip-trigger,.guide-trigger,.days-trigger'):null;return b?(b.classList.contains('trip-trigger')?'trip':b.classList.contains('guide-trigger')?'guide':'days'):null;}
  function capture(e){const pt=(e.touches&&e.touches[0])||e;const x=Number(pt.clientX||0),y=Number(pt.clientY||0);if(y<innerHeight-190)return;const target=targetFor(e.target);const info=snap(target,x,y);push(e.type,info);if(!target)show(Object.assign({reason:'BOTTOM TAP HIT NON-NAV ELEMENT',eventTarget:brief(e.target)},info));}
  document.addEventListener('pointerdown',capture,true);
  document.addEventListener('touchstart',capture,true);
  document.addEventListener('click',function(e){const target=targetFor(e.target);if(!target)return;const x=Number(e.clientX||0),y=Number(e.clientY||0);push('nav-click-before',snap(target,x,y));setTimeout(function(){const info=snap(target,x,y);push('nav-click-after',info);const id={trip:'tripMenu',guide:'guideMenu',days:'daysMenu'}[target];const m=document.getElementById(id);if(!m||!m.classList.contains('show'))show(Object.assign({reason:'NAV CLICK DID NOT OPEN MENU'},info));},150);},true);
  root.addEventListener('error',function(e){push('window-error',{message:String(e.message||e.error||'error'),source:e.filename||'',line:e.lineno||0});},true);
  root.addEventListener('unhandledrejection',function(e){push('unhandled-rejection',{message:String(e.reason&&e.reason.message||e.reason||'rejection')});});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',badge,{once:true});else badge();
  root.NZ_FIELD_DIAG={read,clear:function(){try{localStorage.removeItem(KEY)}catch(e){}}};push('core-runtime-enter',{readyState:document.readyState});
})(window);

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
/* Shared modal state helper. Presentation classes remain modal-specific; this
   only centralises class, aria-hidden and optional body-lock bookkeeping. */
(function(root){
  'use strict';
  function resolve(target){return typeof target==='string'?document.getElementById(target):target;}
  function setOpen(target,open,options){
    const modal=resolve(target);
    if(!modal)return false;
    const opts=options||{};
    const openClass=opts.openClass||'show';
    modal.classList.toggle(openClass,!!open);
    if(opts.aria!==false)modal.setAttribute('aria-hidden',String(!open));
    if(opts.bodyClass)document.body.classList.toggle(opts.bodyClass,!!open);
    return true;
  }
  root.CCMV_MODAL=Object.freeze({resolve,setOpen});
})(window);
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
function closeCrossModuleOverlays(target){
  const tripModal=document.getElementById('tripModal');
  const guideModal=document.getElementById('guideModal');
  if(target!=='trip' && tripModal?.classList.contains('show')){
    if(typeof window.isBookingEditActive==='function' && window.isBookingEditActive()) return false;
    tripModal.classList.remove('show');
  }
  if(target!=='guide' && guideModal?.classList.contains('show')) guideModal.classList.remove('show');
  return true;
}
function toggleTripMenu(){
  if(!closeCrossModuleOverlays('trip'))return;
  toggleMenu('tripMenu',document.querySelector('.trip-trigger'));
}
function toggleGuideMenu(){
  if(!closeCrossModuleOverlays('guide'))return;
  toggleMenu('guideMenu',document.querySelector('.guide-trigger'));
}
function toggleDays(){
  if(!closeCrossModuleOverlays('days'))return;
  toggleMenu('daysMenu',document.querySelector('.days-trigger'));
}
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

function selectableFriendKeys(){
  const identities=TRIP_CONFIG.participants?.identities||{};
  const configured=Array.isArray(TRIP_CONFIG.participants?.order)?TRIP_CONFIG.participants.order:[];
  const ordered=configured.filter(key=>identities[key]);
  return ordered.length?ordered:Object.keys(identities);
}
function hasSingleSelectableFriend(){return selectableFriendKeys().length===1;}
function getStoredFriend(){const identities=TRIP_CONFIG.participants?.identities||{};const saved=STORAGE.local.get(STORAGE_CONFIG.keys.friend,null);return saved&&identities[saved]?saved:null;}
function getFriend(){const identities=TRIP_CONFIG.participants?.identities||{};const fallback=TRIP_CONFIG.participants?.defaultKey||Object.keys(identities)[0]||'unknown';return getStoredFriend()||fallback;}
let identitySelectionRequired=false;
function setFriend(k){
  const identities=TRIP_CONFIG.participants?.identities||{}; if(!identities[k])return;
  STORAGE.local.set(STORAGE_CONFIG.keys.friend,k); identitySelectionRequired=false;
  document.documentElement.removeAttribute('data-identity-selection-required'); document.body?.classList.remove('identity-selection-required');
  const modal=document.getElementById('mamaModal'); modal?.classList.remove('identity-required');
  const closeBtn=modal?.querySelector('.mama-close'); if(closeBtn){closeBtn.hidden=false;closeBtn.style.display='';closeBtn.removeAttribute('aria-hidden');}
  closeFriendModal(); updateFriendLabels();
  if(document.getElementById('expenseModal')?.classList.contains('show')&&typeof window.resetExpenseForm==='function')window.resetExpenseForm();
  if(document.getElementById('momentsModal')?.classList.contains('show')&&typeof window.simplifyMomentsAuthor==='function')window.simplifyMomentsAuthor();
  if(typeof window.refreshExpenseAdminUI==='function')window.refreshExpenseAdminUI();
  try{document.dispatchEvent(new CustomEvent('travelengine:familychange',{detail:{family:k}}));}catch(e){}
}
const FRIEND_IDENTITY=TRIP_CONFIG.participants?.identities||{};
function friendIdentityHTML(key,compact=false){
  const fallbackKey=TRIP_CONFIG.participants?.defaultKey||Object.keys(FRIEND_IDENTITY)[0];
  const identity=FRIEND_IDENTITY[key]||FRIEND_IDENTITY[fallbackKey];
  return `<span class="family-identity family-${escapeHTML(key)}${compact?' is-compact':''}"><span class="family-code" aria-hidden="true">${escapeHTML(identity.code)}</span><span class="family-name">${escapeHTML(identity.name)}</span></span>`;
}
window.friendIdentityHTML=friendIdentityHTML;
function updateFriendLabels(){const key=getFriend();document.querySelectorAll('[data-friend-label]').forEach(e=>{e.innerHTML=friendIdentityHTML(key,true);e.dataset.family=key;});}
function renderFriendChoices(){const list=document.querySelector('#mamaModal .friend-choice-list');if(!list)return;const current=getStoredFriend();list.innerHTML=selectableFriendKeys().map(key=>`<button type="button" class="family-choice${key===current?' active':''}" data-family="${key}" onclick="setFriend('${key}')">${friendIdentityHTML(key)}</button>`).join('');}
function openFriendModal(){if(getStoredFriend()&&identitySelectionRequired){identitySelectionRequired=false;document.documentElement.removeAttribute('data-identity-selection-required');document.body?.classList.remove('identity-selection-required');}if(hasSingleSelectableFriend()){const only=selectableFriendKeys()[0];if(only&&!getStoredFriend())setFriend(only);return;}renderFriendChoices();const modal=$('mamaModal');if(!modal)return;const closeBtn=modal.querySelector('.mama-close');if(identitySelectionRequired){modal.classList.add('identity-required');if(closeBtn){closeBtn.hidden=true;closeBtn.style.display='none';closeBtn.setAttribute('aria-hidden','true');}}else if(closeBtn){closeBtn.hidden=false;closeBtn.style.display='';closeBtn.removeAttribute('aria-hidden');}modal.classList.add('show');}
function closeFriendModal(){if(identitySelectionRequired&&!getStoredFriend())return;const modal=$('mamaModal');if(modal)modal.classList.remove('show','identity-required');}
function ensureFriendIdentity(){
  if(getStoredFriend()){
    identitySelectionRequired=false;
    document.documentElement.removeAttribute('data-identity-selection-required');
    document.body?.classList.remove('identity-selection-required');
    const existing=document.getElementById('mamaModal');
    if(existing){existing.classList.remove('show','identity-required');existing.setAttribute('aria-hidden','true');existing.style.pointerEvents='';}
    return false;
  }
  const selectable=selectableFriendKeys();
  if(selectable.length===1){
    setFriend(selectable[0]);
    return false;
  }
  identitySelectionRequired=true; document.documentElement.dataset.identitySelectionRequired='true'; document.body?.classList.add('identity-selection-required');
  const modal=document.getElementById('mamaModal'); if(!modal)return true;
  const title=modal.querySelector('h2'); if(title)title.textContent=TRIP_CONFIG.participants?.selectionTitle||'Who are you travelling with?';
  const kicker=modal.querySelector('.kicker'); if(kicker)kicker.textContent=TRIP_CONFIG.participants?.selectionKicker||'SELECT FAMILY';
  modal.classList.add('identity-required'); const closeBtn=modal.querySelector('.mama-close');
  if(closeBtn){closeBtn.hidden=true;closeBtn.style.display='none';closeBtn.setAttribute('aria-hidden','true');}
  renderFriendChoices(); requestAnimationFrame(()=>modal.classList.add('show')); return true;
}
window.getStoredFriend=getStoredFriend; window.ensureFriendIdentity=ensureFriendIdentity; window.selectableFriendKeys=selectableFriendKeys; window.hasSingleSelectableFriend=hasSingleSelectableFriend;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(ensureFriendIdentity,0));else setTimeout(ensureFriendIdentity,0);



/* Context-aware modal close fallback. */
document.addEventListener('click', function(e){
  const modal = e.target.closest('.guide-modal,.moments-modal,.unexpected-modal,.tools-modal,.mama-modal,.trip-modal');
  if(!modal || e.target !== modal) return;
  if(modal.id==='tripModal' && typeof window.isBookingEditActive==='function' && window.isBookingEditActive()) return;
  if(modal.id==='tripModal' && typeof closeTripModal==='function') closeTripModal();
  else if(modal.id==='guideModal' && typeof closeGuideModal==='function') closeGuideModal();
  else modal.classList.remove('show');
});
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    const tripModal=document.getElementById('tripModal');
    const guideModal=document.getElementById('guideModal');
    if(tripModal?.classList.contains('show') && typeof window.isBookingEditActive==='function' && window.isBookingEditActive()) return;
    if(tripModal?.classList.contains('show') && typeof closeTripModal==='function') closeTripModal();
    else if(guideModal?.classList.contains('show') && typeof closeGuideModal==='function') closeGuideModal();
    else document.querySelectorAll('.moments-modal,.unexpected-modal,.tools-modal,.mama-modal').forEach(m=>m.classList.remove('show'));
  }
});

