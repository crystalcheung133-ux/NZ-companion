/* ============================================================================
   TRAVEL ENGINE — GUIDE & PLACE MODULE
   Stage 7K-2D
   Owns Guide navigation context, category/place modal flow, shopping directory
   view, place page rendering and guide-specific copy/address behavior.
   Shared DOM/menu helpers remain in script.js and are available before this
   module loads.
   ============================================================================ */

function visitDayHTML(key){
  const days=DAY_LINKS[key]||[];
  if(!days.length) return '';
  const buttons=days.map(([label,href])=>`<a class="day-jump-button" href="${href}">${label} →</a>`).join('');
  return `<div class="quick-info-row visit-row"><span class="quick-info-icon">📅</span><span><span class="quick-info-label">Visit Day</span><span class="quick-info-value day-link-row">${buttons}</span></span></div>`;
}


function placeHref(key){
  return NAVIGATION.build('place',{query:{placeId:key}});
}
const GUIDE_NAV_CONTEXT_KEY=STORAGE_CONFIG.keys.guideNavContext;
const GUIDE_NAV_REOPEN_KEY=STORAGE_CONFIG.keys.guideNavReopen;
function saveGuideNavigationContext(category, options){
  const opts=options||{};
  try{
    STORAGE.session.set(GUIDE_NAV_CONTEXT_KEY,JSON.stringify({
      category,
      sourceUrl:opts.sourceUrl||NAVIGATION.currentAbsoluteUrl(),
      sourceType:opts.sourceType||'guide',
      savedAt:Date.now()
    }));
  }catch(e){}
}
function openGuideFromDay(key,itemId){
  const place=(typeof PLACES!=='undefined'&&PLACES[key])||{};
  const sourceUrl=NAVIGATION.currentRelativeUrl({hash:itemId||null});
  saveGuideNavigationContext(place.cat||'GUIDE',{sourceUrl,sourceType:'day'});
  NAVIGATION.go(placeHref(key));
}
function openGuideGroupFromDay(keys,itemId){
  const clean=[...new Set((Array.isArray(keys)?keys:[]).filter(key=>key&&typeof PLACES!=='undefined'&&PLACES[key]))];
  if(!clean.length) return;
  const first=PLACES[clean[0]]||{};
  const sourceUrl=NAVIGATION.currentRelativeUrl({hash:itemId||null});
  saveGuideNavigationContext(first.cat||'GUIDE',{sourceUrl,sourceType:'day'});
  // RC11K: confirmed single destinations open immediately. Only genuine alternatives show a choice page.
  NAVIGATION.go(clean.length===1 ? placeHref(clean[0]) : NAVIGATION.build('place',{query:{placeIds:clean.join(',')}}));
}
function readGuideNavigationContext(){
  try{return STORAGE.session.readJSON(GUIDE_NAV_CONTEXT_KEY,null);}
  catch(e){return null;}
}
function clearGuideNavigationContext(){
  try{
    STORAGE.session.remove(GUIDE_NAV_CONTEXT_KEY);
    STORAGE.session.remove(GUIDE_NAV_REOPEN_KEY);
  }catch(e){}
}
function goPlace(key){
  NAVIGATION.go(placeHref(key));
}
function closePlaceDetail(){
  const context=readGuideNavigationContext();
  if(context?.category&&context?.sourceUrl){
    if(context.sourceType!=='day'){
      try{STORAGE.session.set(GUIDE_NAV_REOPEN_KEY,context.category);}catch(e){}
    }else{
      try{STORAGE.session.remove(GUIDE_NAV_CONTEXT_KEY);}catch(e){}
    }
    NAVIGATION.go(NAVIGATION.permittedReturnTarget(context.sourceUrl,NAVIGATION_CONFIG.fallback.placeClose));
    return;
  }
  NAVIGATION.goPage(NAVIGATION_CONFIG.fallback.placeClose);
}
function restoreGuideNavigationLayer(){
  let category='';
  try{
    category=STORAGE.session.get(GUIDE_NAV_REOPEN_KEY,'');
    STORAGE.session.remove(GUIDE_NAV_REOPEN_KEY);
  }catch(e){}
  if(category)requestAnimationFrame(()=>openGuideCategory(category));
}
document.addEventListener('DOMContentLoaded',restoreGuideNavigationLayer);

function applyGuideHashView(){
 const directory=document.getElementById('shopping-directory');
 const main=directory?.closest('main');
 if(!directory||!main)return;
 const directoryOnly=NAVIGATION.hasHash('shoppingDirectory');
 Array.from(main.children).forEach(el=>{el.hidden=directoryOnly&&el!==directory;});
 document.body.classList.toggle('shopping-directory-view',directoryOnly);
 if(directoryOnly)requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'auto'}));
}
function openShoppingDirectoryView(){
 closeGuideModal();closeMiniMenus();
 const onGuide=NAVIGATION.isPage('guide');
 if(!onGuide){NAVIGATION.goPage('guide',{hash:'shoppingDirectory'});return;}
 if(NAVIGATION.hasHash('shoppingDirectory'))applyGuideHashView();
 else NAVIGATION.setHash('shoppingDirectory');
}
window.addEventListener('hashchange',applyGuideHashView);
document.addEventListener('DOMContentLoaded',applyGuideHashView);

function openGuideCategory(cat){
 saveGuideNavigationContext(cat);
 const list=(CATEGORIES[cat]||[]).slice().sort((a,b)=>String(a.title||'').localeCompare(String(b.title||'')));
 if(cat==='SHOP'){
  const directoryRow=`<button onclick="openShoppingDirectoryView()"><span><span class="guide-list-title">🛍 Shopping Directory</span><span class="guide-list-sub">Optional shops · Near · Best with Day</span></span><span>↓</span></button>`;
  const rows=directoryRow+list.map(i=>`<button onclick="goPlace('${i.key}')"><span><span class="guide-list-title">${i.emoji} ${i.title}</span><span class="guide-list-sub">${i.sub||''}</span></span><span class="guide-list-meta">${guideStatusHTML(PLACES[i.key]||{})}<span class="guide-list-chevron">›</span></span></button>`).join('');
  $('guideModalContent').innerHTML=`<p class="kicker">Guide</p><h2>SHOP</h2><div class="category-pop-list">${rows}</div>`;
  closeMiniMenus();$('guideModal').classList.add('show');return;
 }
 const rows=list.map(i=>`<button onclick="goPlace('${i.key}')"><span><span class="guide-list-title">${i.emoji} ${i.title}</span><span class="guide-list-sub">${i.sub||''}</span></span><span class="guide-list-meta">${guideStatusHTML(PLACES[i.key]||{})}<span class="guide-list-chevron">›</span></span></button>`).join('');
 $('guideModalContent').innerHTML=`<p class="kicker">Guide</p><h2>${cat}</h2><div class="category-pop-list">${rows}</div>`;
 closeMiniMenus();$('guideModal').classList.add('show');
}

function guideStatusHTML(g){
 const audit=String(g.audit||'');
 const optionalPattern=/optional|option|alternative|backup|recommended|flexible|weather-dependent/i;
 const status=(g.status==='optional'||(!g.status&&optionalPattern.test(audit)))?'OPTIONAL':'PLANNED';
 return `<span class="guide-status guide-status-${status.toLowerCase()}">${status}</span>`;
}
function copyGuideAddress(key){
 const g=PLACES[key]; if(!g?.address)return;
 const text=`${g.title}\n${g.address}`;
 const done=()=>{if(typeof showToast==='function')showToast('Address copied');};
 if(navigator.clipboard?.writeText){navigator.clipboard.writeText(text).then(done).catch(()=>fallbackCopy(text,done));}
 else fallbackCopy(text,done);
}
function fallbackCopy(text,done){const box=document.createElement('textarea');box.value=text;box.setAttribute('readonly','');box.style.position='fixed';box.style.opacity='0';document.body.appendChild(box);box.select();try{document.execCommand('copy');done();}catch(e){}box.remove();}
function usefulGoodToKnow(items){
 const generic=[/currently planned/i,/recommended only/i,/optional rather than essential/i,/keep .* flexible/i,/validation build/i];
 return (items||[]).filter(x=>x&&generic.every(rule=>!rule.test(x)));
}
function quickInfoInnerHTML(g,key){
 const phoneRow=g.phone?`<div class="quick-info-row"><span class="quick-info-icon">☎️</span><span><span class="quick-info-label">Phone</span><span class="quick-info-value">${g.phone}</span></span></div>`:'';
 const callButton=g.phone?`<a class="utility-button" href="tel:${String(g.phone).replace(/[^+\d]/g,'')}">☎️ Call</a>`:'';
 const websiteButton=g.website?`<a class="utility-button" href="${g.website}" target="_blank" rel="noopener">🌐 Website</a>`:'';
 return `<div class="quick-info-top"><span class="category-tag">${g.categoryLabel||g.cat||'Guide'}</span>${guideStatusHTML(g)}</div><div class="quick-info-grid"><div class="quick-info-row"><span class="quick-info-icon">📍</span><span><span class="quick-info-label">Address</span><span class="quick-info-value">${g.address||'Check before visit'}</span></span></div>${phoneRow}<div class="quick-info-row"><span class="quick-info-icon">🕘</span><span><span class="quick-info-label">Hours</span><span class="quick-info-value">${g.hours||'Check before visit'}</span></span></div><div class="quick-info-row"><span class="quick-info-icon">💰</span><span><span class="quick-info-label">Price</span><span class="quick-info-value">${g.price||'Varies'}</span></span></div>${visitDayHTML(key)}</div><div class="quick-info-actions"><button class="utility-button" type="button" onclick="copyGuideAddress('${key}')">📍 Copy Address</button><a class="map-button" href="${g.maps}" target="_blank" rel="noopener">🧭 Navigate</a>${callButton}${websiteButton}<button class="moment-button" aria-label="Add Moment" onclick="openMomentsModal('${key}')">✨ Moment</button></div>`;
}

function quickInfoHTML(g,key){
 return `<div class="quick-info-card">${quickInfoInnerHTML(g,key)}</div>`;
}

function guideNavButtons(key){const idx=GUIDE_ORDER.indexOf(key); if(idx<0)return ''; const prev=GUIDE_ORDER[(idx-1+GUIDE_ORDER.length)%GUIDE_ORDER.length]; const next=GUIDE_ORDER[(idx+1)%GUIDE_ORDER.length]; return `<div class="guide-next-row"><button class="pill" onclick="openGuideModal('${prev}')">‹ Previous</button><button class="pill" onclick="openGuideModal('${next}')">Next ›</button></div>`;}
function openGuideModal(key){
 const g=PLACES[key]; if(!g)return;
 const sig=(g.signature||[]).map(x=>`<li>${x}</li>`).join('');
 const worth=usefulGoodToKnow(g.worth||[]).map(x=>`<li>${x}</li>`).join('');
 $('guideModalContent').innerHTML=`<p class="kicker">Guide</p><h2>${g.emoji} ${g.title}</h2><p><strong>${g.sub}</strong></p>${quickInfoHTML(g,key)}<p>${g.desc}</p>${sig?`<h3>Highlights</h3><ul>${sig}</ul>`:''}${worth?`<h3>Good to Know</h3><ul>${worth}</ul>`:''}${guideNavButtons(key)}`;
 $('guideModal').classList.add('show');
 const sheet=document.querySelector('#guideModal .guide-sheet');
 if(sheet) sheet.scrollTop=0;
}
function closeGuideModal(){$('guideModal').classList.remove('show');clearGuideNavigationContext()}

function renderPlacePage(key){
  const g = PLACES[key];
  const mount = document.getElementById('placeMain');
  if(!g || !mount) return;
  const sig = (g.signature||g.highlights||[]).map(x=>`<li>${x}</li>`).join('');
  const worth = usefulGoodToKnow(g.worth||g.tips||[]).map(x=>`<li>${x}</li>`).join('');
  mount.innerHTML = `
<button class="place-detail-close" type="button" aria-label="Close place detail" onclick="closePlaceDetail()">×</button>
<div class="page-hero"><p class="kicker">Guide</p><h1>${g.emoji} ${g.title}</h1><p class="lead">${g.sub||''}</p></div>
<section aria-label="Quick Info" class="quick-info-card">${quickInfoInnerHTML(g,key)}</section>
<section class="prose-block guide-overview"><h2>Overview</h2><p>${g.desc||''}</p></section>
<section class="prose-block"><h2>Highlights</h2><ul>${sig}</ul></section>
${worth?`<section class="prose-block"><h2>Good to Know</h2><ul>${worth}</ul></section>`:``}`;
  document.title = `${g.title} · ${TRIP_CONFIG.tripName}`;
}

function renderPlaceGroupPage(keys){
  const clean=[...new Set((Array.isArray(keys)?keys:[]).filter(key=>key&&PLACES[key]))];
  const mount=document.getElementById('placeMain');
  if(!clean.length||!mount) return;
  // Defensive auto-routing for old/shared links containing a single id.
  if(clean.length===1){ renderPlacePage(clean[0]); return; }
  const cards=clean.map((key,index)=>{
    const g=PLACES[key];
    const sig=(g.signature||g.highlights||[]).map(x=>`<li>${x}</li>`).join('');
    const worth=usefulGoodToKnow(g.worth||g.tips||[]).map(x=>`<li>${x}</li>`).join('');
    return `<article class="place-group-card" id="guide-${key}">
      <div class="page-hero place-group-hero"><p class="kicker">Option ${index+1}</p><h1>${g.emoji} ${g.title}</h1><p class="lead">${g.sub||''}</p></div>
      <section aria-label="Quick Info" class="quick-info-card">${quickInfoInnerHTML(g,key)}</section>
      <section class="prose-block guide-overview"><h2>Overview</h2><p>${g.desc||''}</p></section>
      <section class="prose-block"><h2>Highlights</h2><ul>${sig}</ul></section>
      ${worth?`<section class="prose-block"><h2>Good to Know</h2><ul>${worth}</ul></section>`:``}
    </article>`;
  }).join('');
  mount.innerHTML=`<button class="place-detail-close" type="button" aria-label="Close guide options" onclick="closePlaceDetail()">×</button><div class="page-hero"><p class="kicker">Guide</p><h1>Choose an option</h1><p class="lead">Compare the planned choices, then use Navigate inside the restaurant card you choose.</p></div>${cards}`;
  document.title=`Guide options · ${TRIP_CONFIG.tripName}`;
}

function copyText(text){
  if(navigator.clipboard){navigator.clipboard.writeText(text).then(()=>alert('Address copied')).catch(()=>alert(text));}
  else alert(text);
}
