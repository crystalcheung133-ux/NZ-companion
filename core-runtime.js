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
function toggleMenu(id,trigger){
  const m=$(id);
  const open=m&&m.classList.contains('show');
  closeMiniMenus();
  if(m&&!open){positionMiniMenu(m,trigger||document.activeElement);m.classList.add('show');document.body.classList.add('admin-overlay-open');}
}
function toggleTripMenu(){toggleMenu('tripMenu',document.querySelector('.trip-trigger'));}
function toggleGuideMenu(){toggleMenu('guideMenu',document.querySelector('.guide-trigger'));}
function toggleDays(){toggleMenu('daysMenu',document.querySelector('.days-trigger'));}
window.addEventListener('resize',closeMiniMenus);
document.addEventListener('click',e=>{if(!e.target.closest('.mini-menu')&&!e.target.closest('.trip-trigger')&&!e.target.closest('.guide-trigger')&&!e.target.closest('.days-trigger')) closeMiniMenus();});

function getFriend(){return STORAGE.local.get(STORAGE_CONFIG.keys.friend,'lee');}
function setFriend(k){
  STORAGE.local.set(STORAGE_CONFIG.keys.friend,k);
  closeFriendModal();
  updateFriendLabels();
  if(document.getElementById('expenseModal')?.classList.contains('show')&&typeof window.resetExpenseForm==='function')window.resetExpenseForm();
  if(document.getElementById('momentsModal')?.classList.contains('show')&&typeof window.simplifyMomentsAuthor==='function')window.simplifyMomentsAuthor();
  if(typeof window.refreshExpenseAdminUI==='function')window.refreshExpenseAdminUI();
}
function updateFriendLabels(){const label=FRIENDS[getFriend()]||'MEL · Lee';document.querySelectorAll('[data-friend-label]').forEach(e=>e.textContent=label);}
function renderFriendChoices(){const list=document.querySelector('#mamaModal .friend-choice-list');if(!list)return;list.innerHTML=Object.entries(FRIENDS).map(([key,label])=>`<button type="button" onclick="setFriend('${key}')">${label}</button>`).join('');}
function openFriendModal(){renderFriendChoices();$('mamaModal').classList.add('show')} function closeFriendModal(){$('mamaModal').classList.remove('show')}



/* v2.1.11 safe modal close fallback */
document.addEventListener('click', function(e){
  const modal = e.target.closest('.guide-modal,.moments-modal,.unexpected-modal,.tools-modal,.mama-modal,.trip-modal');
  if(modal && e.target === modal){
    modal.classList.remove('show');
  }
});
document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    document.querySelectorAll('.guide-modal,.moments-modal,.unexpected-modal,.tools-modal,.mama-modal,.trip-modal').forEach(m=>m.classList.remove('show'));
  }
});

