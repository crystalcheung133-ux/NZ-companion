
function applyTripBranding(){
  if(typeof TRIP_BRAND==='undefined') return;
  document.querySelectorAll('[data-brand-text]').forEach(function(el){
    var key=el.getAttribute('data-brand-text');
    var value=TRIP_BRAND[key];
    if(value==null) return;
    if(key==='splashSlogan') el.innerHTML=String(value).replace(/\n/g,'<br>');
    else el.textContent=value;
  });
  document.querySelectorAll('[data-brand-logo]').forEach(function(img){
    var key=img.getAttribute('data-brand-logo');
    if(TRIP_BRAND.logo && TRIP_BRAND.logo[key]) img.src=TRIP_BRAND.logo[key];
  });
  var suffix=TRIP_BRAND.browserTitleSuffix || TRIP_BRAND.appName;
  if(suffix && document.title){
    document.title=document.title.replace(/New Zealand(?: Family)? Companion/g,suffix);
  }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyTripBranding);
else applyTripBranding();

function tripDateParts(date=new Date()){
  const cfg=(typeof TRIP_CALENDAR!=='undefined'&&TRIP_CALENDAR)||{startDate:'2026-09-22',timeZone:'Pacific/Auckland'};
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:cfg.timeZone||'Pacific/Auckland',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  const out={};
  parts.forEach(part=>{if(part.type!=='literal')out[part.type]=part.value;});
  return `${out.year}-${out.month}-${out.day}`;
}
function tripDayNumber(date=new Date()){
  const cfg=(typeof TRIP_CALENDAR!=='undefined'&&TRIP_CALENDAR)||{startDate:'2026-09-22'};
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

function visitDayHTML(key){
  const days=DAY_LINKS[key]||[];
  if(!days.length) return '';
  const buttons=days.map(([label,href])=>`<a class="day-jump-button" href="${href}">${label} →</a>`).join('');
  return `<div class="quick-info-row visit-row"><span class="quick-info-icon">📅</span><span><span class="quick-info-label">Visit Day</span><span class="quick-info-value day-link-row">${buttons}</span></span></div>`;
}


function placeHref(key){
  return `place.html?id=${encodeURIComponent(key)}`;
}
const GUIDE_NAV_CONTEXT_KEY='ccmv_guide_nav_context';
const GUIDE_NAV_REOPEN_KEY='ccmv_guide_nav_reopen';
function saveGuideNavigationContext(category, options){
  const opts=options||{};
  try{
    sessionStorage.setItem(GUIDE_NAV_CONTEXT_KEY,JSON.stringify({
      category,
      sourceUrl:opts.sourceUrl||window.location.href,
      sourceType:opts.sourceType||'guide',
      savedAt:Date.now()
    }));
  }catch(e){}
}
function openGuideFromDay(key,itemId){
  const place=(typeof PLACES!=='undefined'&&PLACES[key])||{};
  const sourceUrl=`${location.pathname}${location.search}${itemId?`#${encodeURIComponent(itemId)}`:''}`;
  saveGuideNavigationContext(place.cat||'GUIDE',{sourceUrl,sourceType:'day'});
  window.location.href=placeHref(key);
}
function readGuideNavigationContext(){
  try{return JSON.parse(sessionStorage.getItem(GUIDE_NAV_CONTEXT_KEY)||'null');}
  catch(e){return null;}
}
function clearGuideNavigationContext(){
  try{
    sessionStorage.removeItem(GUIDE_NAV_CONTEXT_KEY);
    sessionStorage.removeItem(GUIDE_NAV_REOPEN_KEY);
  }catch(e){}
}
function goPlace(key){
  window.location.href = placeHref(key);
}
function closePlaceDetail(){
  const context=readGuideNavigationContext();
  if(context?.category&&context?.sourceUrl){
    if(context.sourceType!=='day'){
      try{sessionStorage.setItem(GUIDE_NAV_REOPEN_KEY,context.category);}catch(e){}
    }else{
      try{sessionStorage.removeItem(GUIDE_NAV_CONTEXT_KEY);}catch(e){}
    }
    window.location.href=context.sourceUrl;
    return;
  }
  window.location.href='guide.html';
}
function restoreGuideNavigationLayer(){
  let category='';
  try{
    category=sessionStorage.getItem(GUIDE_NAV_REOPEN_KEY)||'';
    sessionStorage.removeItem(GUIDE_NAV_REOPEN_KEY);
  }catch(e){}
  if(category)requestAnimationFrame(()=>openGuideCategory(category));
}
document.addEventListener('DOMContentLoaded',restoreGuideNavigationLayer);

function $(id){return document.getElementById(id);}
function escapeHTML(value){return String(value ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function closeMiniMenus(){document.querySelectorAll('.mini-menu').forEach(m=>m.classList.remove('show'));}
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
  if(m&&!open){positionMiniMenu(m,trigger||document.activeElement);m.classList.add('show');}
}
function toggleTripMenu(){toggleMenu('tripMenu',document.querySelector('.trip-trigger'));}
function toggleGuideMenu(){toggleMenu('guideMenu',document.querySelector('.guide-trigger'));}
function toggleDays(){toggleMenu('daysMenu',document.querySelector('.days-trigger'));}
window.addEventListener('resize',closeMiniMenus);
document.addEventListener('click',e=>{if(!e.target.closest('.mini-menu')&&!e.target.closest('.trip-trigger')&&!e.target.closest('.guide-trigger')&&!e.target.closest('.days-trigger')) closeMiniMenus();});

function getFriend(){return localStorage.getItem('nz_friend')||'lee';}
function setFriend(k){
  localStorage.setItem('nz_friend',k);
  closeFriendModal();
  updateFriendLabels();
  if(document.getElementById('expenseModal')?.classList.contains('show')&&typeof window.resetExpenseForm==='function')window.resetExpenseForm();
  if(document.getElementById('momentsModal')?.classList.contains('show')&&typeof window.simplifyMomentsAuthor==='function')window.simplifyMomentsAuthor();
  if(typeof window.refreshExpenseAdminUI==='function')window.refreshExpenseAdminUI();
}
function updateFriendLabels(){const label=FRIENDS[getFriend()]||'🏙️ Lee';document.querySelectorAll('[data-friend-label]').forEach(e=>e.textContent=label);}
function renderFriendChoices(){const list=document.querySelector('#mamaModal .friend-choice-list');if(!list)return;list.innerHTML=Object.entries(FRIENDS).map(([key,label])=>`<button type="button" onclick="setFriend('${key}')">${label}</button>`).join('');}
function openFriendModal(){renderFriendChoices();$('mamaModal').classList.add('show')} function closeFriendModal(){$('mamaModal').classList.remove('show')}


function applyGuideHashView(){
 const directory=document.getElementById('shopping-directory');
 const main=directory?.closest('main');
 if(!directory||!main)return;
 const directoryOnly=location.hash==='#shopping-directory';
 Array.from(main.children).forEach(el=>{el.hidden=directoryOnly&&el!==directory;});
 document.body.classList.toggle('shopping-directory-view',directoryOnly);
 if(directoryOnly)requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'auto'}));
}
function openShoppingDirectoryView(){
 closeGuideModal();closeMiniMenus();
 const onGuide=/guide\.html$/.test(location.pathname)||location.pathname.endsWith('/guide.html');
 if(!onGuide){location.href='guide.html#shopping-directory';return;}
 if(location.hash==='#shopping-directory')applyGuideHashView();
 else location.hash='shopping-directory';
}
window.addEventListener('hashchange',applyGuideHashView);
document.addEventListener('DOMContentLoaded',applyGuideHashView);

function openGuideCategory(cat){
 saveGuideNavigationContext(cat);
 const list=(CATEGORIES[cat]||[]).slice().sort((a,b)=>String(a.title||'').localeCompare(String(b.title||'')));
 if(cat==='SHOP'){
  const directoryRow=`<button onclick="openShoppingDirectoryView()"><span><span class="guide-list-title">🛍 Shopping Directory</span><span class="guide-list-sub">Optional shops · Near · Best with Day</span></span><span>↓</span></button>`;
  const rows=directoryRow+list.map(i=>`<button onclick="goPlace('${i.key}')"><span><span class="guide-list-title">${i.emoji} ${i.title}</span><span class="guide-list-sub">${i.sub||''}</span></span><span>›</span></button>`).join('');
  $('guideModalContent').innerHTML=`<p class="kicker">Guide</p><h2>SHOP</h2><div class="category-pop-list">${rows}</div>`;
  closeMiniMenus();$('guideModal').classList.add('show');return;
 }
 if(list.length===1){closeMiniMenus();openGuideModal(list[0].key);return;}
 const rows=list.map(i=>`<button onclick="goPlace('${i.key}')"><span><span class="guide-list-title">${i.emoji} ${i.title}</span><span class="guide-list-sub">${i.sub||''}</span></span><span>›</span></button>`).join('');
 $('guideModalContent').innerHTML=`<p class="kicker">Guide</p><h2>${cat}</h2><div class="category-pop-list">${rows}</div>`;
 closeMiniMenus();$('guideModal').classList.add('show');
}

function quickInfoInnerHTML(g,key){
 return `<div class="quick-info-top"><span class="category-tag">${g.categoryLabel||g.cat||'Guide'}</span></div><div class="quick-info-grid"><div class="quick-info-row"><span class="quick-info-icon">📍</span><span><span class="quick-info-label">Address</span><span class="quick-info-value">${g.address||'Check before visit'}</span></span></div><div class="quick-info-row"><span class="quick-info-icon">🕘</span><span><span class="quick-info-label">Hours</span><span class="quick-info-value">${g.hours||'Check before visit'}</span></span></div><div class="quick-info-row"><span class="quick-info-icon">💰</span><span><span class="quick-info-label">Price</span><span class="quick-info-value">${g.price||'Varies'}</span></span></div>${visitDayHTML(key)}</div><div class="quick-info-actions"><a class="map-button" href="${g.maps}" target="_blank" rel="noopener">🗺 Open Google Maps</a><button class="moment-button" aria-label="Add Moment" onclick="openMomentsModal('${key}')">✨ Moment</button></div>`;
}
function quickInfoHTML(g,key){
 return `<div class="quick-info-card">${quickInfoInnerHTML(g,key)}</div>`;
}

function guideNavButtons(key){const idx=GUIDE_ORDER.indexOf(key); if(idx<0)return ''; const prev=GUIDE_ORDER[(idx-1+GUIDE_ORDER.length)%GUIDE_ORDER.length]; const next=GUIDE_ORDER[(idx+1)%GUIDE_ORDER.length]; return `<div class="guide-next-row"><button class="pill" onclick="openGuideModal('${prev}')">‹ Previous</button><button class="pill" onclick="openGuideModal('${next}')">Next ›</button></div>`;}
function openGuideModal(key){
 const g=PLACES[key]; if(!g)return;
 const sig=(g.signature||[]).map(x=>`<li>${x}</li>`).join('');
 const worth=(g.worth||[]).map(x=>`<li>${x}</li>`).join('');
 $('guideModalContent').innerHTML=`<p class="kicker">Guide</p><h2>${g.emoji} ${g.title}</h2><p><strong>${g.sub}</strong></p>${quickInfoHTML(g,key)}<p>${g.desc}</p>${sig?`<h3>Highlights</h3><ul>${sig}</ul>`:''}${worth?`<h3>Good to Know</h3><ul>${worth}</ul>`:''}${guideNavButtons(key)}`;
 $('guideModal').classList.add('show');
 const sheet=document.querySelector('#guideModal .guide-sheet');
 if(sheet) sheet.scrollTop=0;
}
function closeGuideModal(){$('guideModal').classList.remove('show');clearGuideNavigationContext()}

let currentMomentKey='';
function closeMomentsModal(){$('momentsModal').classList.remove('show')}
function setStars(n){document.querySelectorAll('.star').forEach((el,i)=>el.classList.toggle('active',i<n));$('momentsRating').value=n;}

/* Stage 4C-4: legacy one-per-place Moments functions were removed.
   The active Moments API is the append/edit/delete implementation below
   (moments_list + legacy localStorage compatibility inside renderMoments).
   These vars keep global onclick/bare calls stable until the canonical API assigns
   window.openMomentsModal / window.saveMoments / window.editMoment /
   window.deleteMoment / window.renderMoments later in this file. */
var openMomentsModal, saveMoments, editMoment, deleteMoment, renderMoments;

function openUnexpectedModal(){$('unexpectedFriend').textContent=FRIENDS[getFriend()];$('unexpectedText').value='';$('unexpectedModal').classList.add('show')}
function closeUnexpectedModal(){$('unexpectedModal').classList.remove('show')}
function saveUnexpected(){const arr=JSON.parse(localStorage.getItem('moments_freeform')||'[]');arr.push({page:document.title.replace(' · '+((typeof TRIP_BRAND!=='undefined'&&TRIP_BRAND.browserTitleSuffix)||'New Zealand Family Companion'),''),friendLabel:FRIENDS[getFriend()],text:$('unexpectedText').value,savedAt:new Date().toISOString()});localStorage.setItem('moments_freeform',JSON.stringify(arr));closeUnexpectedModal();renderUnexpected();}
function renderUnexpected(){const box=$('unexpectedTimeline');if(!box)return;let arr=[];try{arr=JSON.parse(localStorage.getItem('moments_freeform')||'[]');if(!Array.isArray(arr))arr=[];}catch(e){arr=[];}box.innerHTML=arr.length?arr.map(e=>`<div class="moments-entry"><strong>✨ ${escapeHTML(e.page)}</strong><p>${escapeHTML(e.friendLabel)}</p><p>${escapeHTML(e.text)}</p></div>`).join(''):'<p>No Moments yet.</p>'}

function updateExpenseMode(){
  const personal = document.getElementById('expensePersonal')?.checked;
  const splitBlock = document.getElementById('splitBetweenBlock');
  const consumedBlock = document.getElementById('consumedByBlock');
  if(splitBlock) splitBlock.style.display = personal ? 'none' : 'block';
  if(consumedBlock) consumedBlock.style.display = personal ? 'block' : 'none';
  if(personal) syncConsumedIfAuto();
}
function syncConsumedIfAuto(){
  const paid = document.getElementById('expensePaidBy');
  const consumed = document.getElementById('expenseConsumedBy');
  if(!paid || !consumed) return;
  if(consumed.dataset.manual !== 'true') consumed.value = paid.value;
}
function markConsumedManual(){
  const consumed = document.getElementById('expenseConsumedBy');
  if(consumed) consumed.dataset.manual = 'true';
}

/* Stage 4C-6: legacy top-level Expenses handlers were removed.
   Active Expenses API lives in the Stage 4F-Q single canonical module
   near the end of this file. Keep closeExpenseModal as a simple modal
   utility because HTML buttons call it directly. */
function closeExpenseModal(){const m=$('expenseModal'); if(m) m.classList.remove('show')}

function saveChecklist(){const checks=[...document.querySelectorAll('[data-check]')].map(c=>c.checked);localStorage.setItem('checklist',JSON.stringify(checks));const ready=$('readyBox');if(ready)ready.classList.toggle('show',checks.length>0&&checks.every(Boolean)); renderDashboard();}
function loadChecklist(){const stored=JSON.parse(localStorage.getItem('checklist')||'[]');document.querySelectorAll('[data-check]').forEach((c,i)=>c.checked=!!stored[i]);saveChecklist();}
document.addEventListener('DOMContentLoaded',()=>{updateFriendLabels();renderMoments();renderUnexpected();renderExpenses();loadChecklist();renderDashboard();});

function openTripCard(key) {
  closeMiniMenus();
  const t = TRIP_DATA[key];
  if (!t) return;
  const idx = TRIP_ORDER.indexOf(key);
  const prev = TRIP_ORDER[(idx - 1 + TRIP_ORDER.length) % TRIP_ORDER.length];
  const next = TRIP_ORDER[(idx + 1) % TRIP_ORDER.length];
  const content = document.getElementById('tripModalContent');
  const modal = document.getElementById('tripModal');
  if (!content || !modal) return;
  content.innerHTML = `<div class="trip-onepage"><p class="kicker">Trip</p><h2>${t.title}</h2>${t.body}<div class="guide-next-row"><button class="pill" onclick="openTripCard('${prev}')">‹ Previous</button><button class="pill" onclick="openTripCard('${next}')">Next ›</button></div><p class="timestamp">Build · Version ${(typeof TRIP_BRAND!=='undefined'&&TRIP_BRAND.version)||'0.6 RC10'} · ${(typeof TRIP_BRAND!=='undefined'&&TRIP_BRAND.buildLabel)||'Phase 1 Release Candidate'}</p></div>`;
  modal.classList.add('show');
  const sheet=document.querySelector('#tripModal .trip-sheet');
  if(sheet) sheet.scrollTop=0;
  if (key === 'checklist') setTimeout(loadChecklist, 0);
}

function closeTripModal() {
  const modal = document.getElementById('tripModal');
  if (modal) modal.classList.remove('show');
}

function splitAll() {
  document.querySelectorAll('#expenseModal input[data-split]').forEach(x => x.checked = true);
  if(typeof window.updateSplitUI==='function') window.updateSplitUI();
}

function clearAllSplit() {
  document.querySelectorAll('#expenseModal input[data-split]').forEach(x => x.checked = false);
  if(typeof window.updateSplitUI==='function') window.updateSplitUI();
}

const MOODS=[
  ["🤩","Wow"],["😋","Delicious"],["😵","Exhausted"],["🔥","Amazing"],
  ["🤯","Unexpected"],["😶","Speechless"],["🥲","Oh no"],["🤬","Damn"]
];
let currentMood=[];
let editingExpenseIndex=null;

function renderMoodButtons(selected=[]){
  currentMood = selected || [];
  const box=document.getElementById('moodGrid');
  if(!box) return;
  box.innerHTML=MOODS.map(([emoji,label])=>{
    const on=currentMood.includes(label);
    return `<button type="button" class="mood-btn ${on?'active':''}" aria-pressed="${on?'true':'false'}" onclick="toggleMood('${label}')">${emoji} ${label}</button>`;
  }).join('');
}
function toggleMood(label){
  if(currentMood.includes(label)){
    currentMood=currentMood.filter(x=>x!==label);
  }else{
    if(currentMood.length>=2) currentMood.shift();
    currentMood.push(label);
  }
  renderMoodButtons(currentMood);
}
function moodLabel(labels=[]){
  return labels.map(l=>{
    const m=MOODS.find(x=>x[1]===l);
    return m?m[0]+' '+m[1]:l;
  }).join(' · ');
}
function formatTime(iso){
  if(!iso) return '';
  try{
    return new Date(iso).toLocaleString([], {dateStyle:'medium', timeStyle:'short'});
  }catch(e){return iso}
}

function renderDashboard(){
  const checks=[...document.querySelectorAll('[data-dashboard-check]')];
  if(!checks.length) return;
  const stored=JSON.parse(localStorage.getItem('checklist')||'[]');
  const done=stored.filter(Boolean).length;
  const total=10;
  const percent=Math.round((done/total)*100);
  const pct=document.getElementById('dashReadyPercent');
  const bar=document.getElementById('dashReadyBar');
  const count=document.getElementById('dashChecklistCount');
  if(pct) pct.textContent=percent+'%';
  if(bar) bar.style.width=percent+'%';
  if(count) count.textContent=`${done} / ${total} Checklist Completed`;
}

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

/* Stage 1 cleanup note: PLACES.general (the fallback "Moments" place card) used to be
   injected here at runtime. It is now defined canonically in data.js, so nothing to do here. */
// Renders a full place detail page (page-hero + quick-info-card + prose blocks)
// from PLACES data. Used by the shared place.html?id=... renderer and legacy standalone place pages
// so page content lives in ONE place (data.js) instead of being duplicated per file.
function renderPlacePage(key){
  const g = PLACES[key];
  const mount = document.getElementById('placeMain');
  if(!g || !mount) return;
  const sig = (g.signature||g.highlights||[]).map(x=>`<li>${x}</li>`).join('');
  const worth = (g.worth||g.tips||[]).map(x=>`<li>${x}</li>`).join('');
  mount.innerHTML = `
<button class="place-detail-close" type="button" aria-label="Close place detail" onclick="closePlaceDetail()">×</button>
<div class="page-hero"><p class="kicker">Guide</p><h1>${g.emoji} ${g.title}</h1><p class="lead">${g.sub||''}</p></div>
<section aria-label="Quick Info" class="quick-info-card">${quickInfoInnerHTML(g,key)}</section>
<section class="prose-block guide-overview"><h2>Overview</h2><p>${g.desc||''}</p></section>
<section class="prose-block"><h2>Highlights</h2><ul>${sig}</ul></section>
<section class="prose-block"><h2>Good to Know</h2><ul>${worth}</ul></section>`;
  document.title = `${g.title} · ${(typeof TRIP_BRAND!=='undefined'&&TRIP_BRAND.browserTitleSuffix)||'New Zealand Family Companion'}`;
}

function copyText(text){
  if(navigator.clipboard){navigator.clipboard.writeText(text).then(()=>alert('Address copied')).catch(()=>alert(text));}
  else alert(text);
}

/* v3.2 P0 workflow fixes: append Moments, latest-first Expenses, save-and-stay expense tool */
(function(){
  let editingMomentId = null;
  let currentMomentPhoto = null;
  let currentMomentContext = null;
  let momentSelectorDay = '1';
  let momentEntryIsPlanned = false; /* Stage 5B-2B2: true only while the composer was opened via the "Planned activity" landing card */
  const prototypePhotoUrls = new Map();
  function readJson(key, fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch(e){return fallback;}}
  function writeJson(key, value){localStorage.setItem(key, JSON.stringify(value));}
  function formatBytes(bytes){
    if(!Number.isFinite(bytes)) return '';
    if(bytes < 1024) return bytes + ' B';
    if(bytes < 1024*1024) return (bytes/1024).toFixed(bytes < 10240 ? 1 : 0) + ' KB';
    return (bytes/(1024*1024)).toFixed(1) + ' MB';
  }
  function clearMomentPhoto(revoke=true){
    if(currentMomentPhoto?.url && revoke && ![...prototypePhotoUrls.values()].includes(currentMomentPhoto.url)){
      try{ URL.revokeObjectURL(currentMomentPhoto.url); }catch(e){}
    }
    currentMomentPhoto = null;
    const inputCamera=document.getElementById('momentsPhotoCamera');
    const inputLibrary=document.getElementById('momentsPhotoLibrary');
    if(inputCamera) inputCamera.value='';
    if(inputLibrary) inputLibrary.value='';
    renderMomentPhotoPreview();
  }
  function renderMomentPhotoPreview(){
    const preview=document.getElementById('momentsPhotoPreview');
    if(!preview) return;
    if(!currentMomentPhoto){
      preview.hidden=true;
      preview.innerHTML='';
      return;
    }
    const meta=currentMomentPhoto.meta||{};
    preview.hidden=false;
    preview.innerHTML=`<div class="photo-prototype-card">
      <img src="${currentMomentPhoto.url}" alt="Compressed moment preview"/>
      <div class="photo-prototype-copy"><strong>✨ Looking good!</strong><span>${meta.width||'?'} × ${meta.height||'?'} · ${formatBytes(meta.bytes)}</span><small>${meta.originalBytes ? `Original ${formatBytes(meta.originalBytes)} → ` : ''}Compressed preview · local prototype</small></div>
      <button type="button" class="photo-remove" onclick="removeMomentPhoto()" aria-label="Remove photo">×</button>
    </div>`;
  }
  function loadImageFromFile(file){
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(file);
      const img=new Image();
      img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};
      img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not read this photo.'));};
      img.src=url;
    });
  }
  function canvasToBlob(canvas,type,quality){
    return new Promise(resolve=>canvas.toBlob(resolve,type,quality));
  }
  async function compressMomentPhoto(file){
    if(!file || !file.type.startsWith('image/')) throw new Error('Please choose a photo.');
    const img=await loadImageFromFile(file);
    const maxEdge=1600;
    const scale=Math.min(1,maxEdge/Math.max(img.naturalWidth,img.naturalHeight));
    const width=Math.max(1,Math.round(img.naturalWidth*scale));
    const height=Math.max(1,Math.round(img.naturalHeight*scale));
    const canvas=document.createElement('canvas');
    canvas.width=width; canvas.height=height;
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,width,height);
    ctx.drawImage(img,0,0,width,height);
    let type='image/webp', quality=.75;
    let blob=await canvasToBlob(canvas,type,quality);
    if(!blob){ type='image/jpeg'; quality=.82; blob=await canvasToBlob(canvas,type,quality); }
    for(const q of [.68,.60,.52]){
      if(blob && blob.size<=500*1024) break;
      const next=await canvasToBlob(canvas,type,q);
      if(next) blob=next;
    }
    if(!blob) throw new Error('Photo compression failed. Please try another photo.');
    return {blob,url:URL.createObjectURL(blob),meta:{name:file.name||'camera-photo',bytes:blob.size,width,height,type:blob.type,originalBytes:file.size||0}};
  }
  async function handleMomentPhotoFile(file){
    const zone=document.querySelector('#momentsModal .photo-capture-zone');
    if(zone) zone.classList.add('is-processing');
    try{
      const processed=await compressMomentPhoto(file);
      clearMomentPhoto(true);
      currentMomentPhoto=processed;
      renderMomentPhotoPreview();
    }catch(err){
      alert(err?.message||'Unable to prepare this photo.');
    }finally{
      if(zone) zone.classList.remove('is-processing');
      queueAppNavSync();
    }
  }
  function stabiliseAppNavAfterViewportChange(){
    const nav=document.querySelector('.app-nav');
    if(!nav) return;
    nav.classList.add('app-nav--layout-sync');
    void nav.offsetHeight;
    requestAnimationFrame(()=>requestAnimationFrame(()=>nav.classList.remove('app-nav--layout-sync')));
  }
  let appNavSyncTimer=0;
  function queueAppNavSync(){
    clearTimeout(appNavSyncTimer);
    appNavSyncTimer=setTimeout(stabiliseAppNavAfterViewportChange,80);
  }
  window.addEventListener('focus',queueAppNavSync);
  window.addEventListener('pageshow',queueAppNavSync);
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',queueAppNavSync);
    window.visualViewport.addEventListener('scroll',queueAppNavSync);
  }
  window.removeMomentPhoto=function(){ clearMomentPhoto(true); };
  function normaliseDayId(value){
    if(value == null) return null;
    const raw=String(value);
    if(/^day[1-5]$/.test(raw)) return raw;
    if(/^[1-5]$/.test(raw)) return 'day'+raw;
    return null;
  }
  function dayNumberFromId(dayId){
    const match=String(dayId||'').match(/day([1-5])/);
    return match ? match[1] : null;
  }
  function itineraryItems(){
    const out=[];
    Object.entries((typeof ITINERARY_DATA!=='undefined'&&ITINERARY_DATA)||{}).forEach(([dayNumber,day])=>{
      (day?.items||[]).forEach(item=>out.push({...item,_dayNumber:String(dayNumber),dayId:normaliseDayId(item.dayId)||('day'+dayNumber)}));
    });
    return out;
  }
  function stripMomentTitle(title){
    return String(title||'Moment').replace(/^[^\p{L}\p{N}]+/u,'').trim() || 'Moment';
  }
  function guideCandidates(placeKey){
    const links=(typeof DAY_LINKS!=='undefined'&&DAY_LINKS[placeKey])||[];
    return links.map(link=>{
      const href=Array.isArray(link)?link[1]:'';
      const dayMatch=String(href||'').match(/[?&]day=([1-5])/);
      const idMatch=String(href||'').match(/#([^#?&]+)/);
      if(!dayMatch||!idMatch) return null;
      const item=itineraryItems().find(x=>x._dayNumber===dayMatch[1]&&x.id===decodeURIComponent(idMatch[1]));
      return item||null;
    }).filter(Boolean);
  }
  function momentEntrySource(){
    const guideModalOpen=document.getElementById('guideModal')?.classList.contains('show');
    const path=(location.pathname||'').split('/').pop();
    if(guideModalOpen || path==='guide.html' || path==='place.html' || document.getElementById('placeMain')) return 'guide';
    if(path==='day.html') return 'days';
    return 'unknown';
  }
  function resolveMomentContext(key, sourceHint){
    const raw=key||'general';
    if(raw==='general') return {contextType:'custom',placeKey:null,activityId:null,dayId:null,displayTitleSnapshot:'Just this moment'};
    const source=sourceHint||momentEntrySource();
    if(source==='guide' && typeof PLACES!=='undefined' && PLACES[raw]){
      const candidates=guideCandidates(raw);
      const unique=new Map(candidates.map(x=>[x.dayId+'|'+x.id,x]));
      const only=unique.size===1?[...unique.values()][0]:null;
      return {contextType:'guide',placeKey:raw,activityId:only?.id||null,dayId:only?.dayId||null,displayTitleSnapshot:PLACES[raw].title||'Moment'};
    }
    const item=itineraryItems().find(x=>x.id===raw);
    if(item){
      return {contextType:'days',placeKey:item.placeId||null,activityId:item.id,dayId:item.dayId,displayTitleSnapshot:stripMomentTitle(item.title)};
    }
    if(typeof PLACES!=='undefined'&&PLACES[raw]){
      const candidates=guideCandidates(raw);
      const unique=new Map(candidates.map(x=>[x.dayId+'|'+x.id,x]));
      const only=unique.size===1?[...unique.values()][0]:null;
      return {contextType:'guide',placeKey:raw,activityId:only?.id||null,dayId:only?.dayId||null,displayTitleSnapshot:PLACES[raw].title||'Moment'};
    }
    return {contextType:'custom',placeKey:null,activityId:null,dayId:null,displayTitleSnapshot:'Just this moment'};
  }
  function plannedMomentContext(dayNumber,item){
    return {contextType:'planned-activity',placeKey:item.placeId||null,activityId:item.id,dayId:normaliseDayId(item.dayId)||('day'+dayNumber),displayTitleSnapshot:stripMomentTitle(item.title)};
  }
  function suggestedMomentDay(){
    return String(tripDayNumber());
  }
  function renderMomentContextSummary(){
    const box=document.getElementById('momentContextSummary');
    if(!box) return;
    const c=currentMomentContext||resolveMomentContext('general');
    if(c.contextType==='custom'){
      box.hidden=true;
      box.innerHTML='';
      box.closest('.moment-context-panel')?.classList.add('is-custom');
    } else {
      box.hidden=false;
      box.closest('.moment-context-panel')?.classList.remove('is-custom');
      box.innerHTML=`<span class="moment-context-dot">✓</span><span><strong>${c.displayTitleSnapshot}</strong><small>${c.dayId ? `Day ${dayNumberFromId(c.dayId)} · ` : ''}${c.contextType==='guide'?'From Guide':'Planned activity'}</small></span>`;
    }
  }
  function renderPlannedActivityPicker(){
    const host=document.getElementById('momentPlannedPicker');
    if(!host) return;
    const day=(typeof ITINERARY_DATA!=='undefined'?ITINERARY_DATA:null)?.[momentSelectorDay];
    const chips=(day?.items||[]).map(item=>`<button type="button" class="moment-activity-chip" onclick="chooseMomentActivity('${momentSelectorDay}','${String(item.id).replace(/'/g,"\'")}')"><span>${stripMomentTitle(item.title)}</span><small>${item.time||''}</small></button>`).join('');
    /* Stage 5B-2B2: the "Just this moment" chip is redundant when the composer was entered via the
       Planned activity card — returning to free capture is done by closing the composer and choosing
       the other card instead. Only render the chip for the general-entry "+Add planned activity" path. */
    const customChoiceHTML=momentEntryIsPlanned ? '' : `<button type="button" class="moment-custom-choice" onclick="clearMomentActivity()">✨ Just this moment</button>`;
    host.innerHTML=`${customChoiceHTML}<div class="moment-day-tabs">${['1','2','3','4','5'].map(n=>`<button type="button" class="moment-day-tab ${n===momentSelectorDay?'active':''}" onclick="setMomentSelectorDay('${n}')">Day ${n}</button>`).join('')}</div><div class="moment-activity-grid">${chips}</div>`;
  }
  function ensureMomentContextUI(){
    const form=document.querySelector('#momentsModal .moments-form');
    if(!form||form.querySelector('.moment-context-panel')) return;
    const panel=document.createElement('div');
    panel.className='moment-context-panel';
    panel.innerHTML=`<div id="momentContextSummary" class="moment-context-summary"></div><button type="button" id="momentPlannedToggle" class="moment-planned-toggle" onclick="toggleMomentPlannedPicker()">＋ Add planned activity</button><div id="momentPlannedPicker" class="moment-planned-picker" hidden></div>`;
    form.insertBefore(panel,form.firstChild);
  }
  window.toggleMomentPlannedPicker=function(){
    const picker=document.getElementById('momentPlannedPicker');
    const toggle=document.getElementById('momentPlannedToggle');
    if(!picker) return;
    picker.hidden=!picker.hidden;
    if(!picker.hidden){ renderPlannedActivityPicker(); if(toggle) toggle.textContent='− Hide planned activities'; }
    else if(toggle) toggle.textContent=currentMomentContext?.contextType==='custom'?'＋ Add planned activity':'Change planned activity';
  };
  window.openPlannedMomentCapture=function(){
    window.openMomentsModal('general');
    momentEntryIsPlanned=true;
    momentSelectorDay=suggestedMomentDay();
    const picker=document.getElementById('momentPlannedPicker');
    const toggle=document.getElementById('momentPlannedToggle');
    if(picker){
      picker.hidden=false;
      renderPlannedActivityPicker();
    }
    if(toggle) toggle.textContent='− Hide planned activities';
  };
  window.setMomentSelectorDay=function(dayNumber){ momentSelectorDay=String(dayNumber); renderPlannedActivityPicker(); };
  window.chooseMomentActivity=function(dayNumber,activityId){
    const item=((typeof ITINERARY_DATA!=='undefined'?ITINERARY_DATA:null)?.[String(dayNumber)]?.items||[]).find(x=>x.id===activityId);
    if(!item) return;
    currentMomentKey=item.id;
    currentMomentContext=plannedMomentContext(String(dayNumber),item);
    const title=document.getElementById('momentsTitle');
    if(title) title.textContent=currentMomentContext.displayTitleSnapshot;
    renderMomentContextSummary();
    const picker=document.getElementById('momentPlannedPicker');
    const toggle=document.getElementById('momentPlannedToggle');
    if(picker) picker.hidden=true;
    if(toggle) toggle.textContent='Change planned activity';
  };
  window.clearMomentActivity=function(){
    currentMomentKey='general';
    currentMomentContext=resolveMomentContext('general');
    const title=document.getElementById('momentsTitle'); if(title) title.textContent='Just this moment';
    renderMomentContextSummary();
    const picker=document.getElementById('momentPlannedPicker'); if(picker) picker.hidden=true;
    const toggle=document.getElementById('momentPlannedToggle'); if(toggle) toggle.textContent='＋ Add planned activity';
  };
  function enhanceMomentPhotoInput(){
    document.querySelectorAll('#momentsModal .photo-input').forEach(host=>{
      if(host.dataset.photoEnhanced==='true') return;
      host.dataset.photoEnhanced='true';
      host.classList.add('photo-capture-zone');
      host.innerHTML=`<div class="photo-capture-heading"><span class="photo-capture-spark">📸</span><span><strong>Add a happy snap</strong><small>We compress it before anything is saved.</small></span></div>
        <div class="photo-capture-actions">
          <label class="photo-capture-btn photo-capture-btn--camera">📷 Take Photo<input id="momentsPhotoCamera" type="file" accept="image/*" capture="environment" hidden></label>
          <label class="photo-capture-btn">🖼 Choose Photo<input id="momentsPhotoLibrary" type="file" accept="image/*" hidden></label>
        </div>
        <div id="momentsPhotoPreview" class="photo-prototype-preview" hidden></div>`;
      host.querySelectorAll('input[type=file]').forEach(input=>input.addEventListener('change',e=>{
        const file=e.target.files?.[0]; if(file) handleMomentPhotoFile(file);
      }));
    });
  }
  window.openMomentsModal = function(key){
    editingMomentId = null;
    momentEntryIsPlanned = false; /* Stage 5B-2B2: only openPlannedMomentCapture re-enables planned-entry mode, right after this call */
    currentMomentKey = key || 'general';
    currentMomentContext = resolveMomentContext(currentMomentKey);
    momentSelectorDay = dayNumberFromId(currentMomentContext.dayId) || suggestedMomentDay();
    const g = PLACES[currentMomentContext.placeKey||currentMomentKey] || PLACES.general || {title:'Moment'};
    const title = document.getElementById('momentsTitle');
    const friend = document.getElementById('momentsFriend');
    const text = document.getElementById('momentsText');
    if(title) title.textContent = currentMomentContext.displayTitleSnapshot || g.title || 'Moment';
    if(friend) friend.textContent = FRIENDS[getFriend()];
    if(text) text.value = '';
    ensureMomentContextUI();
    renderMomentContextSummary();
    const picker=document.getElementById('momentPlannedPicker'); if(picker) picker.hidden=true;
    const toggle=document.getElementById('momentPlannedToggle'); if(toggle) toggle.textContent=currentMomentContext.contextType==='custom'?'＋ Add planned activity':'Change planned activity';
    clearMomentPhoto(true);
    setStars(0);
    renderMoodButtons([]);
    const save=document.querySelector('#momentsModal .moments-form .btn');
    if(save) save.textContent='Save';
    const modal=document.getElementById('momentsModal');
    if(modal) modal.classList.add('show');
    try{ if(typeof window.simplifyMomentsAuthor === 'function') window.simplifyMomentsAuthor(); }catch(e){}
  };
  window.saveMoments = function(){
    const key = currentMomentKey || 'general';
    const g = PLACES[key] || PLACES.general || {title:'Moment'};
    const textEl=document.getElementById('momentsText');
    const ratingEl=document.getElementById('momentsRating');
    const now=new Date().toISOString();
    let arr=readJson('moments_list',[]);
    let entry={
      id:editingMomentId || ('m_'+Date.now()+'_'+Math.random().toString(36).slice(2,7)),
      itemKey:key,
      itemTitle:currentMomentContext?.displayTitleSnapshot || g.title || 'Moment',
      context:{...(currentMomentContext||resolveMomentContext(key))},
      friendLabel:FRIENDS[getFriend()],
      rating:Number(ratingEl?.value||0),
      moods:(currentMood||[]).slice(),
      text:textEl?.value||'',
      photoPrototype:currentMomentPhoto ? {...currentMomentPhoto.meta, retained:false} : null,
      createdAt:now
    };
    if(editingMomentId){
      const existing=arr.find(e=>e.id===editingMomentId);
      if(!currentMomentPhoto && existing?.photoPrototype) entry.photoPrototype=existing.photoPrototype;
      arr=arr.map(e=> e.id===editingMomentId ? {...e,...entry,createdAt:e.createdAt||now,editedAt:now} : e);
    }else{
      arr.push(entry);
    }
    if(currentMomentPhoto?.url) prototypePhotoUrls.set(entry.id,currentMomentPhoto.url);
    writeJson('moments_list',arr);
    localStorage.setItem('moment_latest_'+key, JSON.stringify(entry));
    editingMomentId=null;
    if(textEl) textEl.value='';
    currentMomentPhoto=null;
    renderMomentPhotoPreview();
    setStars(0); renderMoodButtons([]);
    const save=document.querySelector('#momentsModal .moments-form .btn');
    if(save) save.textContent='Save';
    closeMomentsModal(); renderMoments();
  };
  window.editMoment = function(id){
    const arr=readJson('moments_list',[]);
    const e=arr.find(x=>x.id===id);
    if(!e) return;
    editingMomentId=id;
    momentEntryIsPlanned = false; /* Stage 5B-2B2: editing an existing moment always keeps the full planned-activity picker */
    currentMomentKey=e.itemKey || 'general';
    currentMomentContext=e.context ? {...e.context} : resolveMomentContext(currentMomentKey);
    momentSelectorDay=dayNumberFromId(currentMomentContext.dayId)||suggestedMomentDay();
    ensureMomentContextUI();
    renderMomentContextSummary();
    const picker=document.getElementById('momentPlannedPicker'); if(picker) picker.hidden=true;
    const toggle=document.getElementById('momentPlannedToggle'); if(toggle) toggle.textContent=currentMomentContext.contextType==='custom'?'＋ Add planned activity':'Change planned activity';
    const title=document.getElementById('momentsTitle');
    const friend=document.getElementById('momentsFriend');
    const text=document.getElementById('momentsText');
    if(title) title.textContent=e.context?.displayTitleSnapshot || e.itemTitle || 'Moment';
    if(friend) friend.textContent=e.friendLabel || FRIENDS[getFriend()];
    if(text) text.value=e.text || '';
    clearMomentPhoto(true);
    const rememberedUrl=prototypePhotoUrls.get(e.id);
    if(rememberedUrl && e.photoPrototype){
      currentMomentPhoto={url:rememberedUrl,meta:e.photoPrototype};
      renderMomentPhotoPreview();
    }
    setStars(e.rating||0);
    renderMoodButtons(e.moods||[]);
    const save=document.querySelector('#momentsModal .moments-form .btn');
    if(save) save.textContent='Save Changes';
    const modal=document.getElementById('momentsModal');
    if(modal) modal.classList.add('show');
    try{ if(typeof window.simplifyMomentsAuthor === 'function') window.simplifyMomentsAuthor(); }catch(e){}
  };
  window.deleteMoment = function(idOrKey){
    let arr=readJson('moments_list',[]);
    const before=arr.length;
    arr=arr.filter(e=>e.id!==idOrKey);
    writeJson('moments_list',arr);
    if(before===arr.length && idOrKey && !idOrKey.startsWith('m_')) localStorage.removeItem('moment_'+idOrKey);
    const photoUrl=prototypePhotoUrls.get(idOrKey);
    if(photoUrl){try{URL.revokeObjectURL(photoUrl);}catch(e){} prototypePhotoUrls.delete(idOrKey);}
    renderMoments();
  };
  window.renderMoments = function(){
    const box=document.getElementById('momentsTimeline'); if(!box) return;
    let arr=readJson('moments_list',[]);
    // Include legacy one-per-place moments once so older saved data still appears.
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k && k.startsWith('moment_') && !k.startsWith('moment_latest_')){
        try{
          const e=JSON.parse(localStorage.getItem(k));
          if(e && !arr.some(x=>x.id===e.id || (x.createdAt===e.createdAt && x.itemKey===e.itemKey && x.text===e.text))){
            arr.push({...e,id:e.id||('legacy_'+k.replace('moment_',''))});
          }
        }catch(err){}
      }
    }
    arr.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    if(!arr.length){box.innerHTML='<p>No Moments yet.</p>';return;}
    box.innerHTML=arr.map(e=>`<div class="moments-entry">
      <strong>${escapeHTML(e.itemTitle||'Moment')}</strong>
      <p class="timestamp">${escapeHTML(e.friendLabel||'')} · ${formatTime(e.createdAt)}${e.editedAt?` · Edited ${formatTime(e.editedAt)}`:''}</p>
      ${e.photoPrototype ? (prototypePhotoUrls.get(e.id)
        ? `<img class="moment-prototype-photo" src="${prototypePhotoUrls.get(e.id)}" alt="Moment photo preview">`
        : `<p class="moment-photo-note">📸 Photo tested · preview was intentionally not kept after reload</p>`) : ''}
      <p class="moment-mood">${moodLabel(e.moods||[])}</p>
      <p class="moment-stars">${'⭐'.repeat(e.rating||0)}</p>
      <p class="moment-copy">${escapeHTML(e.text||'')}</p>
      <div class="entry-actions"><button class="mini-btn" onclick="editMoment('${e.id||e.itemKey}')">✏️ Edit</button><button class="mini-btn" onclick="deleteMoment('${e.id||e.itemKey}')">🗑 Delete</button></div>
    </div>`).join('');
  };
  /* Stage 4C-6: removed legacy v3.2 window.saveExpense; canonical handler is later in this file. */

  window.renderLatestExpenseMini = function(){
    const box=document.getElementById('latestExpenseMini'); if(!box) return;
    const arr=readJson('expenses',[]);
    const latest=arr.map((e,i)=>({...e,_idx:i})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).slice(0,3);
    if(!latest.length){box.innerHTML='<p class="timestamp">No transactions yet.</p>';return;}
    box.innerHTML=latest.map(e=>`<div class="expense-card">
      <strong>${escapeHTML(e.item)}</strong>
      <p class="timestamp">${formatTime(e.createdAt)}</p>
      <p>${Number(e.total).toLocaleString()} NZD · Paid by ${FRIENDS[e.paidBy]}</p>
      <div class="entry-actions"><button class="mini-btn" onclick="editExpense(${e._idx})">✏️ Edit</button><button class="mini-btn" onclick="deleteExpense(${e._idx})">🗑 Delete</button></div>
    </div>`).join('');
  };
  /* Stage 4C-6: removed legacy v3.2 window.renderExpenses; canonical handler is later in this file. */

  document.addEventListener('DOMContentLoaded',()=>{enhanceMomentPhotoInput();renderMoodButtons([]);renderMoments();renderExpenses();});
})();

/* Stage 4C-6: legacy v3.4 Expenses wrappers removed; Stage 4F-Q owns the single canonical Expenses module. */

/* v3.5 guard: bottom bar is summary navigation; buttons on summary pages open tools */
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.summary-link-row').forEach(x=>x.remove());
  try{ renderExpenses(); renderMoments(); }catch(e){}
});

/* v3.6 production polish: non-overriding expense copy polish only.
   Stage 4C-6 removed the old open/save wrappers from this block. */
(function(){
  function polishExpenseCopy(){
    document.querySelectorAll('button,a').forEach(el=>{
      if((el.textContent||'').includes('Add Expense') || (el.textContent||'').includes('Split Bill')){
        el.textContent='💰 What did we spend?';
      }
    });
    const title=document.getElementById('expenseModalTitle'); if(title) title.textContent='💰 What did we spend?';
    const intro=document.getElementById('expenseIntro'); if(intro) intro.textContent='Record each shared or personal expense. Personal Spend and Settlement update automatically.';
    const save=document.getElementById('expenseSaveButton'); if(save) save.textContent='Save';
  }
  document.addEventListener('DOMContentLoaded',polishExpenseCopy);
  window.polishExpenseCopy = polishExpenseCopy;
})();

/* Stage 4C-6: removed legacy v3.7 Expenses save/open wrappers. */

/* Stage 4F-A: removed stale legacy dayN.html swipe handler. Active day route is day.html?day=N. */

/* v3.9.6c Final UX Hotfix: current-user Moments author label.
   Stage 4C-6 removed the expense open/save/edit wrappers from this block;
   Expense current-user defaults are handled by the Stage 4F-Q module. */
(function(){
  const DEFAULT_FRIEND = 'lee';
  function currentUser(){
    try { return (typeof getFriend === 'function' ? getFriend() : localStorage.getItem('nz_friend')) || DEFAULT_FRIEND; }
    catch(e){ return DEFAULT_FRIEND; }
  }
  function friendLabel(k){
    try { return (typeof FRIENDS !== 'undefined' && FRIENDS[k]) ? FRIENDS[k] : (FRIENDS?.[DEFAULT_FRIEND] || '🏙️ Lee'); }
    catch(e){ return '🏙️ Lee'; }
  }
  function simplifyMomentsAuthor(){
    const row=document.querySelector('#momentsModal p:has(#momentsFriend)');
    const badge=document.getElementById('momentsFriend');
    if(badge) badge.textContent='By ' + friendLabel(currentUser());
    if(row){
      row.classList.add('moments-author-row');
      row.querySelectorAll('button').forEach(btn=>btn.remove());
    }
  }
  window.simplifyMomentsAuthor = simplifyMomentsAuthor;


  document.addEventListener('DOMContentLoaded',()=>{
    simplifyMomentsAuthor();
  });
})();

/* Stage 4C-6: removed legacy v3.9.6d paid-by wrapper chain. Paid-by UI is owned by the Stage 4F-Q canonical Expenses module. */

/* ============================================================================
   STAGE 1.5 — INFORMATION MIGRATION TEMPLATE: optional read-only helpers
   ----------------------------------------------------------------------------
   Added: 2026-07-09. See STAGE_1_5_INFORMATION_MIGRATION.md.

   These read BOOKINGS_DATA (data.js) and return plain data/strings. None of
   them are called anywhere else in this file, none are attached to any
   button/onclick, and none write to the DOM or localStorage. They exist so a
   future stage can wire a real booking-status UI without first inventing
   this lookup logic. Safe to delete if a future stage designs different
   helpers instead — nothing else in the app depends on these.
   ============================================================================ */

/** Returns an array of BOOKINGS_DATA entries whose dayId matches the given
 *  day id (e.g. 'day1'). Returns [] if BOOKINGS_DATA is missing/empty or
 *  no bookings match — never throws. */
function getBookingsForDay(dayId){
  try{
    if (typeof BOOKINGS_DATA === 'undefined' || !BOOKINGS_DATA) return [];
    return Object.values(BOOKINGS_DATA).filter(b => b && b.dayId === dayId);
  }catch(e){ return []; }
}

/** Returns an array of BOOKINGS_DATA entries whose placeId matches the given
 *  PLACES key. Returns [] if none match or BOOKINGS_DATA is missing. */
function getBookingsForPlace(placeId){
  try{
    if (typeof BOOKINGS_DATA === 'undefined' || !BOOKINGS_DATA) return [];
    return Object.values(BOOKINGS_DATA).filter(b => b && b.placeId === placeId);
  }catch(e){ return []; }
}

/** Maps a booking status code to a short display label + emoji. Falls back
 *  to the raw status string (or 'Unknown') for any value not in the map,
 *  so this never throws on unexpected data. Not currently rendered anywhere. */
function getBookingStatusLabel(status){
  const map = {
    confirmed: '✅ Confirmed',
    pending:   '🕒 Pending',
    toBook:    '📌 To Book',
    cancelled: '✖️ Cancelled'
  };
  return map[status] || (status || 'Unknown');
}

/* ============================================================================
   STAGE 4F-Q — EXPENSES SINGLE CANONICAL MODULE
   ----------------------------------------------------------------------------
   One active implementation owns the Expenses open/save/reset/render/edit/
   delete/history flow. Storage schema, UI copy, modal behaviour and calculations
   are unchanged from the deploy-tested Stage 4F-P baseline.
   ============================================================================ */
(function(){
  const FRIEND_ORDER=['lee','fowlers','yau'];
  const FRIEND_FALLBACK={lee:'🏙️ Lee',fowlers:'🌉 Fowlers',yau:'⚓ Yau'};

  function currentUser(){
    try{return (typeof getFriend==='function' ? getFriend() : localStorage.getItem('nz_friend')) || 'lee';}
    catch(e){return 'crystal';}
  }
  function labelFor(k){
    try{return (typeof FRIENDS!=='undefined' && FRIENDS[k]) ? FRIENDS[k] : (FRIEND_FALLBACK[k]||k||'');}
    catch(e){return FRIEND_FALLBACK[k]||k||'';}
  }
  function readExpenses(){
    try{return JSON.parse(localStorage.getItem('expenses')||'[]');}
    catch(e){return [];}
  }
  function writeExpenses(arr){
    localStorage.setItem('expenses',JSON.stringify(Array.isArray(arr)?arr:[]));
  }
  function timeLabel(iso){
    try{return (typeof formatTime==='function') ? formatTime(iso) : (iso?new Date(iso).toLocaleString():'');}
    catch(e){return iso||'';}
  }
  function setSelectValue(id,value){
    const el=document.getElementById(id); if(!el) return;
    el.value=value;
    Array.from(el.options||[]).forEach(opt=>{opt.selected=(opt.value===value);});
    try{el.dispatchEvent(new Event('change',{bubbles:true}));}catch(e){}
  }
  function updatePaidByDisplay(){
    const hidden=document.getElementById('expensePaidBy');
    const paid=hidden?.value || currentUser();
    const display=document.getElementById('paidByDisplayName');
    if(display) display.textContent=labelFor(paid);
    document.querySelectorAll('#paidByChoices button').forEach(btn=>{
      btn.classList.toggle('active',btn.dataset.friend===paid);
    });
  }
  function ensurePaidByUI(){
    const select=document.getElementById('expensePaidBy');
    if(!select) return;
    if(!document.getElementById('paidByDisplay')){
      select.classList.add('paid-by-hidden-select');
      select.setAttribute('aria-hidden','true');
      select.tabIndex=-1;
      const panel=document.createElement('div');
      panel.className='paid-by-panel';
      panel.innerHTML=`<div class="paid-by-display" id="paidByDisplay"><span class="paid-by-current" id="paidByDisplayName">${labelFor(select.value||currentUser())}</span><button type="button" class="paid-by-change" id="paidByChangeButton">Change</button></div><div class="paid-by-choices" id="paidByChoices" hidden>${FRIEND_ORDER.map(k=>`<button type="button" data-friend="${k}">${labelFor(k)}</button>`).join('')}</div>`;
      select.insertAdjacentElement('afterend',panel);
      panel.querySelector('#paidByChangeButton')?.addEventListener('click',()=>{
        const choices=panel.querySelector('#paidByChoices'); if(choices) choices.hidden=!choices.hidden;
        updatePaidByDisplay();
      });
      panel.querySelectorAll('#paidByChoices button').forEach(btn=>{
        btn.addEventListener('click',()=>{
          setSelectValue('expensePaidBy',btn.dataset.friend);
          try{if(typeof syncConsumedIfAuto==='function') syncConsumedIfAuto();}catch(e){}
          const choices=panel.querySelector('#paidByChoices'); if(choices) choices.hidden=true;
          updatePaidByDisplay();
        });
      });
      select.addEventListener('change',updatePaidByDisplay);
    }
    updatePaidByDisplay();
  }
  let expenseSplitMode='equal';
  let calculatorTargetId='expenseTotal';
  let calculatorExpression='';

  function selectedSplitParties(){
    return [...document.querySelectorAll('#expenseModal input[data-split]:checked')].map(x=>x.value);
  }
  function expenseTotalValue(){
    return Number(String(document.getElementById('expenseTotal')?.value||'').replace(/[^0-9.]/g,''))||0;
  }
  function setExportVisibility(){
    const btn=document.getElementById('expenseExportButton');
    if(btn) btn.hidden=currentUser()!=='lee';
  }
  window.refreshExpenseAdminUI=setExportVisibility;
  function splitSharesForExpense(e){
    const amount=Number(e.total||0);
    if(e.type==='personal'){
      const who=e.consumedBy || ((e.split||[])[0]) || e.paidBy;
      return {[who]:amount};
    }
    if(e.shares && typeof e.shares==='object') return e.shares;
    const split=(e.split&&e.split.length)?e.split:[e.paidBy];
    const share=split.length?amount/split.length:amount;
    return Object.fromEntries(split.map(k=>[k,share]));
  }
  function renderCustomSplitPanel(){
    const panel=document.getElementById('customSplitPanel');
    if(!panel) return;
    const parties=selectedSplitParties();
    panel.hidden=expenseSplitMode!=='custom';
    if(panel.hidden){panel.innerHTML='';return;}
    if(!parties.length){panel.innerHTML='<p class="split-helper">Choose at least one party.</p>';return;}
    const total=expenseTotalValue();
    const previous={};
    panel.querySelectorAll('input[data-custom-party]').forEach(i=>previous[i.dataset.customParty]=i.value);
    const last=parties[parties.length-1];
    let used=0;
    const rows=parties.map((k,idx)=>{
      const isLast=k===last;
      let value='';
      if(isLast){
        value=Math.max(0,total-used).toFixed(2);
      }else{
        value=previous[k]??'';
        used+=Number(value)||0;
      }
      const calcButton=isLast?'':`<button class="calc-open-btn" type="button" onclick="openExpenseCalculator('customShare_${k}')" aria-label="Open calculator">⌗</button>`;
      return `<label class="custom-split-row"><span>${labelFor(k)}</span><div class="expense-money-field"><input id="customShare_${k}" data-custom-party="${k}" inputmode="decimal" type="text" value="${value}" ${isLast?'readonly aria-readonly="true"':''} oninput="recalculateCustomSplit()"/>${calcButton}</div>${isLast?'<small>Auto remainder</small>':''}</label>`;
    }).join('');
    panel.innerHTML=rows+`<p class="split-helper" id="customSplitStatus"></p>`;
    const inputs=[...panel.querySelectorAll('input[data-custom-party]')];
    let manual=0;
    inputs.slice(0,-1).forEach(i=>manual+=Number(i.value)||0);
    const remainder=total-manual;
    const lastInput=inputs[inputs.length-1];
    if(lastInput) lastInput.value=Math.max(0,remainder).toFixed(2);
    const status=document.getElementById('customSplitStatus');
    if(status){
      status.textContent=remainder<0?`Over by ${Math.abs(remainder).toFixed(2)} NZD`:`Remaining ${Math.max(0,remainder).toFixed(2)} NZD assigned to ${labelFor(last)}.`;
      status.classList.toggle('error',remainder<0);
    }
  }
  window.recalculateCustomSplit=function(){
    const panel=document.getElementById('customSplitPanel');
    if(!panel || expenseSplitMode!=='custom') return;
    const inputs=[...panel.querySelectorAll('input[data-custom-party]')];
    if(!inputs.length) return;
    const total=expenseTotalValue();
    let manual=0;
    inputs.slice(0,-1).forEach(i=>manual+=Number(i.value)||0);
    const remainder=total-manual;
    const lastInput=inputs[inputs.length-1];
    if(lastInput) lastInput.value=Math.max(0,remainder).toFixed(2);
    const last=lastInput?.dataset.customParty;
    const status=document.getElementById('customSplitStatus');
    if(status){
      status.textContent=remainder<0?`Over by ${Math.abs(remainder).toFixed(2)} NZD`:`Remaining ${Math.max(0,remainder).toFixed(2)} NZD assigned to ${labelFor(last)}.`;
      status.classList.toggle('error',remainder<0);
    }
  };
  window.updateSplitUI=function(){
    document.querySelectorAll('[data-split-mode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.splitMode===expenseSplitMode));
    renderCustomSplitPanel();
  };
  window.setExpenseSplitMode=function(mode){
    expenseSplitMode=mode==='custom'?'custom':'equal';
    window.updateSplitUI();
  };
  window.openExpenseCalculator=function(targetId){
    calculatorTargetId=targetId||'expenseTotal';
    const target=document.getElementById(calculatorTargetId);
    calculatorExpression=String(target?.value||'').replace(/[^0-9.+\-*/()]/g,'');
    const display=document.getElementById('expenseCalculatorDisplay');
    if(display) display.textContent=calculatorExpression||'0';
    document.getElementById('expenseCalculatorModal')?.classList.add('show');
  };
  window.closeExpenseCalculator=function(){document.getElementById('expenseCalculatorModal')?.classList.remove('show');};
  function safeEvaluateExpression(expr){
    if(!expr || !/^[0-9.+\-*/()\s]+$/.test(expr)) throw new Error('Invalid');
    const value=Function(`"use strict";return (${expr})`)();
    if(!Number.isFinite(value)) throw new Error('Invalid');
    return value;
  }
  window.calcPress=function(key){
    if(key==='C') calculatorExpression='';
    else if(key==='⌫') calculatorExpression=calculatorExpression.slice(0,-1);
    else if(key==='='){
      try{calculatorExpression=String(Math.round(safeEvaluateExpression(calculatorExpression)*100)/100);}catch(e){calculatorExpression='';}
    }else calculatorExpression+=key;
    const display=document.getElementById('expenseCalculatorDisplay');
    if(display) display.textContent=calculatorExpression||'0';
  };
  window.useExpenseCalculatorResult=function(){
    try{
      const value=Math.round(safeEvaluateExpression(calculatorExpression)*100)/100;
      const target=document.getElementById(calculatorTargetId);
      if(target){target.value=value.toFixed(2);target.dispatchEvent(new Event('input',{bubbles:true}));}
      window.closeExpenseCalculator();
    }catch(e){alert('Please complete the calculation first.');}
  };

  function showExpenseSavedNote(){
    const sheet=document.querySelector('#expenseModal .tools-sheet');
    if(!sheet) return;
    let note=document.getElementById('expenseSavedNote');
    if(!note){
      note=document.createElement('div');
      note.id='expenseSavedNote';
      note.className='expense-saved-note';
      note.textContent='✓ Expense saved. Ready for the next one.';
      const form=sheet.querySelector('.expense-form');
      sheet.insertBefore(note,form||sheet.firstChild);
    }
    note.classList.add('show');
    setTimeout(()=>note.classList.remove('show'),1400);
  }
  function resetExpenseForm(){
    editingExpenseIndex=null;
    const user=currentUser();
    const item=document.getElementById('expenseItem'); if(item) item.value='';
    const total=document.getElementById('expenseTotal'); if(total) total.value='';
    setSelectValue('expensePaidBy',user);
    const personal=document.getElementById('expensePersonal'); if(personal) personal.checked=false;
    const consumed=document.getElementById('expenseConsumedBy');
    if(consumed){consumed.dataset.manual='false';setSelectValue('expenseConsumedBy',user);}
    try{splitAll();}
    catch(e){document.querySelectorAll('#expenseModal input[data-split]').forEach(x=>x.checked=true);}
    expenseSplitMode='equal';
    try{updateExpenseMode();}catch(e){}
    window.updateSplitUI();
    const title=document.getElementById('expenseModalTitle'); if(title) title.textContent='💰 What did we spend?';
    const save=document.getElementById('expenseSaveButton'); if(save) save.textContent='Save';
    ensurePaidByUI();
    updatePaidByDisplay();
  }
  function expenseCard(e){
    const personal=e.type==='personal';
    const split=e.split||[];
    const consumer=e.consumedBy || split[0] || e.paidBy;
    const who=personal ? `Consumed by ${labelFor(consumer)}` : `${e.splitMode==='custom'?'Custom':'Equal'} split: ${split.map(labelFor).join(' · ')}`;
    return `<div class="expense-card"><strong>${escapeHTML(e.item||'')}</strong><p class="timestamp">${timeLabel(e.createdAt)}${e.editedAt?` · Edited ${timeLabel(e.editedAt)}`:''}</p><p>${Number(e.total||0).toLocaleString()} NZD · Paid by ${labelFor(e.paidBy)}</p><p>${personal?'Personal Expense':'Shared Expense'} · ${who}</p><div class="entry-actions"><button class="mini-btn" onclick="editExpense(${e._idx})">✏️ Edit</button><button class="mini-btn" onclick="deleteExpense(${e._idx})">🗑 Delete</button></div></div>`;
  }
  function ensureToolHistory(){
    const sheet=document.querySelector('#expenseModal .tools-sheet');
    if(!sheet || document.getElementById('toolTransactionHistory')) return;
    const form=sheet.querySelector('.expense-form');
    const holder=document.createElement('div');
    holder.className='tool-transaction-history';
    holder.id='toolTransactionHistory';
    if(form && form.parentNode) form.parentNode.insertBefore(holder,form.nextSibling);
    else sheet.appendChild(holder);
  }

  window.openExpenseModal=function(){
    ensurePaidByUI();
    resetExpenseForm();
    const modal=document.getElementById('expenseModal');
    if(modal) modal.classList.add('show');
    try{if(typeof renderLatestExpenseMini==='function') renderLatestExpenseMini();}catch(e){}
    const first=document.getElementById('expenseItem'); if(first) setTimeout(()=>first.focus(),60);
  };

  window.saveExpense=function(){
    ensurePaidByUI();
    const item=(document.getElementById('expenseItem')?.value||'').trim();
    const total=Number(String(document.getElementById('expenseTotal')?.value||'').replace(/[^0-9.]/g,''));
    const paidBy=document.getElementById('expensePaidBy')?.value || currentUser();
    const personal=!!document.getElementById('expensePersonal')?.checked;
    const split=selectedSplitParties();
    const splitMode=personal?'personal':expenseSplitMode;
    let shares=null;
    if(!personal && splitMode==='custom'){
      shares={};
      split.forEach(k=>{shares[k]=Number(document.getElementById(`customShare_${k}`)?.value)||0;});
    }
    const consumedBy=document.getElementById('expenseConsumedBy')?.value || paidBy;
    if(!item || !total) return alert('Please complete item and total.');
    if(!personal && !split.length) return alert('Please choose who to split with.');
    if(!personal && splitMode==='custom'){
      const allocated=Object.values(shares||{}).reduce((a,b)=>a+Number(b||0),0);
      if(Math.abs(allocated-total)>0.01) return alert('Custom split must equal the total.');
    }

    const arr=readExpenses();
    const now=new Date().toISOString();
    const data={item,total,paidBy,type:personal?'personal':'shared',split:personal?[consumedBy]:split,splitMode,shares:personal?null:shares,consumedBy:personal?consumedBy:null,createdAt:now};
    if(editingExpenseIndex!==null && arr[editingExpenseIndex]){
      data.createdAt=arr[editingExpenseIndex].createdAt || now;
      data.editedAt=now;
      arr[editingExpenseIndex]=data;
      editingExpenseIndex=null;
    }else{
      arr.push(data);
    }
    writeExpenses(arr);
    window.renderExpenses();
    resetExpenseForm();
    showExpenseSavedNote();
    const first=document.getElementById('expenseItem'); if(first) setTimeout(()=>first.focus(),60);
    // Intentional: keep modal open for quick multiple expense entry.
  };

  window.renderToolTransactionHistory=function(){
    const box=document.getElementById('toolTransactionHistory');
    if(!box) return;
    const latest=readExpenses().map((e,i)=>({...e,_idx:i})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).slice(0,5);
    box.innerHTML=`<h3>Transaction History</h3>${latest.length?latest.map(expenseCard).join(''):'<p class="timestamp">No transactions yet.</p>'}`;
  };

  window.renderExpenses=function(){
    const pageBox=document.getElementById('expensePageList');
    const arr=readExpenses();
    const sorted=arr.map((e,i)=>({...e,_idx:i})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    if(pageBox){
      const total=arr.reduce((sum,e)=>sum+Number(e.total||0),0);
      const personalSpend={lee:0,fowlers:0,yau:0};
      const balance={lee:0,fowlers:0,yau:0};
      arr.forEach(e=>{
        const amount=Number(e.total||0);
        if(!balance[e.paidBy]) balance[e.paidBy]=0;
        balance[e.paidBy]+=amount;
        if(e.type==='personal'){
          const consumer=e.consumedBy || ((e.split||[])[0]) || e.paidBy;
          if(!personalSpend[consumer]) personalSpend[consumer]=0;
          if(!balance[consumer]) balance[consumer]=0;
          personalSpend[consumer]+=amount;
          balance[consumer]-=amount;
        }else{
          const shares=splitSharesForExpense(e);
          Object.entries(shares).forEach(([k,share])=>{if(!personalSpend[k]) personalSpend[k]=0;if(!balance[k]) balance[k]=0;personalSpend[k]+=Number(share||0);balance[k]-=Number(share||0);});
        }
      });
      const spendHtml=FRIEND_ORDER.map(k=>`<p>${labelFor(k)}<br><strong>${Math.round(personalSpend[k]||0).toLocaleString()} NZD</strong></p>`).join('');
      const balanceHtml=FRIEND_ORDER.map(k=>{const v=balance[k]||0;return `<p>${labelFor(k)}<br><strong>${v>=0?'Receive':'Owes'} ${Math.abs(Math.round(v)).toLocaleString()} NZD</strong></p>`;}).join('');
      pageBox.innerHTML=`<div class="expense-dashboard-v33"><div class="expense-total-card"><span>Trip Total</span><strong>${total.toLocaleString()} NZD</strong><small>Shared + personal expenses</small></div><div class="expense-focus-grid"><div class="expense-focus-card"><h3>Personal Spend</h3>${spendHtml}</div><div class="expense-focus-card"><h3>Settlement</h3>${balanceHtml}</div></div></div><div class="expense-history-block"><h3>Transaction History</h3><p class="timestamp">Newest transactions appear first.</p><div class="transaction-scroll">${sorted.length?sorted.map(expenseCard).join(''):'<p>No transactions yet.</p>'}</div></div>`;
    }
    ensureToolHistory();
    window.renderToolTransactionHistory();
  };

  window.exportExpenseData=function(){
    if(currentUser()!=='lee') return alert('Only Lee can export the complete expense data.');
    const arr=readExpenses();
    if(!arr.length) return alert('No expense data to export yet.');
    const quote=value=>`"${String(value??'').replace(/"/g,'""')}"`;
    const total=arr.reduce((sum,e)=>sum+Number(e.total||0),0);
    const personalSpend={lee:0,fowlers:0,yau:0};
    const balance={lee:0,fowlers:0,yau:0};
    arr.forEach(e=>{
      const amount=Number(e.total||0);
      if(!(e.paidBy in balance)) balance[e.paidBy]=0;
      balance[e.paidBy]+=amount;
      if(e.type==='personal'){
        const consumer=e.consumedBy || ((e.split||[])[0]) || e.paidBy;
        if(!(consumer in personalSpend)) personalSpend[consumer]=0;
        if(!(consumer in balance)) balance[consumer]=0;
        personalSpend[consumer]+=amount;
        balance[consumer]-=amount;
      }else{
        const shares=splitSharesForExpense(e);
        Object.entries(shares).forEach(([k,share])=>{
          if(!(k in personalSpend)) personalSpend[k]=0;
          if(!(k in balance)) balance[k]=0;
          personalSpend[k]+=Number(share||0);
          balance[k]-=Number(share||0);
        });
      }
    });
    const rows=[
      ['CCMV NEW ZEALAND EXPENSE SUMMARY'],
      ['Trip Total NZD',Math.round(total)],
      [],
      ['Personal Spend','Amount NZD'],
      ...FRIEND_ORDER.map(k=>[labelFor(k),Math.round(personalSpend[k]||0)]),
      [],
      ['Settlement','Position','Amount NZD'],
      ...FRIEND_ORDER.map(k=>{
        const v=balance[k]||0;
        return [labelFor(k),v>=0?'Receive':'Owes',Math.abs(Math.round(v))];
      }),
      [],
      ['TRANSACTION HISTORY'],
      ['Created At','Item','Total NZD','Paid By','Type','Split Mode','Split Between','Custom Shares','Consumed By','Edited At'],
      ...arr.map(e=>[
        e.createdAt||'',
        e.item||'',
        Number(e.total||0),
        labelFor(e.paidBy),
        e.type==='personal'?'Personal':'Shared',
        e.splitMode||'equal',
        (e.split||[]).map(labelFor).join(' | '),
        Object.entries(e.shares||{}).map(([k,v])=>`${labelFor(k)}: ${Number(v).toFixed(2)}`).join(' | '),
        e.consumedBy?labelFor(e.consumedBy):'',
        e.editedAt||''
      ])
    ];
    const csv='\uFEFF'+rows.map(row=>row.map(quote).join(',')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    const date=new Date().toISOString().slice(0,10);
    a.href=url;
    a.download=`CCMV-New-Zealand-Expenses-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };

  window.editExpense=function(i){
    const arr=readExpenses();
    const e=arr[i]; if(!e) return;
    editingExpenseIndex=i;
    ensurePaidByUI();
    const item=document.getElementById('expenseItem'); if(item) item.value=e.item||'';
    const total=document.getElementById('expenseTotal'); if(total) total.value=e.total||'';
    setSelectValue('expensePaidBy',e.paidBy||'lee');
    const personal=(e.type==='personal');
    const personalBox=document.getElementById('expensePersonal'); if(personalBox) personalBox.checked=personal;
    const consumed=document.getElementById('expenseConsumedBy');
    if(consumed){
      consumed.value=e.consumedBy || ((e.split||[])[0]) || e.paidBy || 'lee';
      consumed.dataset.manual=personal && consumed.value!==e.paidBy ? 'true':'false';
    }
    document.querySelectorAll('#expenseModal input[data-split]').forEach(x=>x.checked=(e.split||[]).includes(x.value));
    expenseSplitMode=e.splitMode==='custom'?'custom':'equal';
    try{updateExpenseMode();}catch(e){}
    window.updateSplitUI();
    if(expenseSplitMode==='custom' && e.shares){
      Object.entries(e.shares).forEach(([k,v])=>{const input=document.getElementById(`customShare_${k}`);if(input&&!input.readOnly) input.value=Number(v).toFixed(2);});
      window.updateSplitUI();
    }
    const title=document.getElementById('expenseModalTitle'); if(title) title.textContent='✏️ Edit Expense';
    const save=document.getElementById('expenseSaveButton'); if(save) save.textContent='Update Expense';
    const modal=document.getElementById('expenseModal'); if(modal) modal.classList.add('show');
    updatePaidByDisplay();
  };

  window.deleteExpense=function(i){
    const arr=readExpenses();
    if(!arr[i]) return;
    arr.splice(i,1);
    writeExpenses(arr);
    if(editingExpenseIndex===i) editingExpenseIndex=null;
    window.renderExpenses();
  };

  window.resetExpenseForm=resetExpenseForm;
  document.addEventListener('DOMContentLoaded',()=>{
    ensurePaidByUI();
    updatePaidByDisplay();
    setExportVisibility();
    window.updateSplitUI();
    window.renderExpenses();
  });
})();
