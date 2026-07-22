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
function closePlaceDetail(){
  const context=readGuideNavigationContext();
  const target=context?.sourceUrl
    ? NAVIGATION.permittedReturnTarget(context.sourceUrl,NAVIGATION_CONFIG.fallback.placeClose)
    : NAVIGATION.build(NAVIGATION_CONFIG.fallback.placeClose);
  clearGuideNavigationContext();
  NAVIGATION.go(target);
}


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

function guideCategoryItems(cat){
 if(cat==='EXPLORE'){
  return [...(CATEGORIES.ATTRACTIONS||[]),...(CATEGORIES.ACTIVITIES||[])]
   .filter(item=>item&&!((TRIP_CONFIG.guide?.excludedPlaceIds||[]).includes(item.key)));
 }
 return CATEGORIES[cat]||[];
}
function guideCategoryHeading(cat){
 return cat==='EXPLORE'?'SIGHTS & ACTIVITIES':cat;
}
function openGuideCategory(cat){
 saveGuideNavigationContext(cat);
 const list=guideCategoryItems(cat).slice().sort((a,b)=>String(a.title||'').localeCompare(String(b.title||'')));
 if(cat==='SHOP'){
  const directoryRow=`<button onclick="openShoppingDirectoryView()"><span><span class="guide-list-title">🛍 Shopping Directory</span><span class="guide-list-sub">Optional shops · Near · Best with Day</span></span><span>↓</span></button>`;
  const rows=directoryRow+list.map(i=>`<button onclick="openGuideModal('${i.key}')"><span><span class="guide-list-title">${i.emoji} ${i.title}</span><span class="guide-list-sub">${i.sub||''}</span></span><span class="guide-list-meta">${guideStatusHTML(PLACES[i.key]||{})}<span class="guide-list-chevron">›</span></span></button>`).join('');
  $('guideModalContent').innerHTML=`<p class="kicker">Guide</p><h2>SHOP</h2><div class="category-pop-list">${rows}</div>`;
  closeMiniMenus();$('guideModal').classList.add('show');return;
 }
 const rows=list.map(i=>`<button onclick="openGuideModal('${i.key}')"><span><span class="guide-list-title">${i.emoji} ${i.title}</span><span class="guide-list-sub">${i.sub||''}</span></span><span class="guide-list-meta">${guideStatusHTML(PLACES[i.key]||{})}<span class="guide-list-chevron">›</span></span></button>`).join('');
 $('guideModalContent').innerHTML=`<p class="kicker">Guide</p><h2>${guideCategoryHeading(cat)}</h2><div class="category-pop-list">${rows}</div>`;
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
 const price=String(g.price||'').trim();
 const showPrice=price&&!/^(see|look at|refer to)\s+trip\s+info$/i.test(price);
 const priceRow=showPrice?`<div class="quick-info-row"><span class="quick-info-icon">💰</span><span><span class="quick-info-label">Price</span><span class="quick-info-value">${price}</span></span></div>`:'';
 return `<div class="quick-info-top"><span class="category-tag">${g.categoryLabel||g.cat||'Guide'}</span>${guideStatusHTML(g)}</div><div class="quick-info-grid"><div class="quick-info-row"><span class="quick-info-icon">📍</span><span><span class="quick-info-label">Address</span><span class="quick-info-value">${g.address||'Check before visit'}</span></span></div>${phoneRow}<div class="quick-info-row"><span class="quick-info-icon">🕘</span><span><span class="quick-info-label">Hours</span><span class="quick-info-value">${g.hours||'Check before visit'}</span></span></div>${priceRow}${visitDayHTML(key)}</div><div class="quick-info-actions"><button class="utility-button" type="button" onclick="copyGuideAddress('${key}')">📍 Copy Address</button><a class="map-button" href="${g.maps}" target="_blank" rel="noopener">🧭 Navigate</a>${callButton}${websiteButton}<button class="moment-button" aria-label="Add Moment" onclick="openMomentsModal('${key}')">✨ Moment</button></div>`;
}

function quickInfoHTML(g,key){
 return `<div class="quick-info-card">${quickInfoInnerHTML(g,key)}</div>`;
}

function guideCategoryKeys(key){
 const place=PLACES[key]||{};
 const category=place.cat;
 const categoryItems=(category==='ATTRACTIONS'||category==='ACTIVITIES')
  ? guideCategoryItems('EXPLORE')
  : ((category&&Array.isArray(CATEGORIES[category]))?CATEGORIES[category]:[]);
 const keys=categoryItems.map(item=>item&&item.key).filter(itemKey=>itemKey&&PLACES[itemKey]);
 return keys.length?keys:GUIDE_ORDER.filter(itemKey=>PLACES[itemKey]);
}
function guideNavModel(key){
 const keys=guideCategoryKeys(key);
 const idx=keys.indexOf(key);
 return {keys,idx,prev:idx>0?keys[idx-1]:'',next:idx>=0&&idx<keys.length-1?keys[idx+1]:'',position:idx>=0?idx+1:0,total:keys.length};
}
function guideNavButtons(key,mode){
 const nav=guideNavModel(key);
 if(nav.total<2||nav.idx<0)return '';
 const open=mode==='page'?'openAdjacentPlace':'openGuideModal';
 const prev=nav.prev?`<button class="pill" onclick="${open}('${nav.prev}')">‹ Previous</button>`:`<button class="pill" disabled aria-disabled="true">‹ Previous</button>`;
 const next=nav.next?`<button class="pill" onclick="${open}('${nav.next}')">Next ›</button>`:`<button class="pill" disabled aria-disabled="true">Next ›</button>`;
 return `<div class="guide-browse-meta">${nav.position} / ${nav.total}</div><div class="guide-next-row">${prev}${next}</div>`;
}
function openAdjacentPlace(key){
 if(!PLACES[key])return;
 NAVIGATION.go(placeHref(key));
}

function suggestedItems(g){
 const items=(g.signature||g.highlights||[]);
 return items.map(x=>String(x)).filter(x=>/^TRY\s*[·:]/i.test(x)).map(x=>x.replace(/^TRY\s*[·:]\s*/i,''));
}
function criticalGuideNotes(g){
 const rules=/booking|book ahead|sell out|last entry|last order|queue|check-in|reception|closed|closure|fuel|height|age restriction|weather|road condition|mobile reception|no petrol|arrive early|order timing/i;
 return usefulGoodToKnow(g.worth||g.tips||[]).filter(x=>rules.test(x));
}
function compactGuideSections(g){
 const suggested=suggestedItems(g).map(x=>`<li>${x}</li>`).join('');
 const notes=criticalGuideNotes(g).map(x=>`<li>${x}</li>`).join('');
 return `${suggested?`<h3>Suggested Dishes</h3><ul>${suggested}</ul>`:''}${notes?`<h3>Practical</h3><ul>${notes}</ul>`:''}`;
}

function openGuideModal(key){
 const g=PLACES[key]; if(!g)return;
 $('guideModalContent').innerHTML=`<div class="guide-onepage"><p class="kicker">Guide</p><h2>${g.emoji} ${g.title}</h2><p class="guide-onepage-sub"><strong>${g.sub}</strong></p>${quickInfoHTML(g,key)}<p class="guide-onepage-desc">${g.desc}</p>${compactGuideSections(g)}${guideNavButtons(key)}</div>`;
 $('guideModal').classList.add('show');
 const sheet=document.querySelector('#guideModal .guide-sheet');
 if(sheet) sheet.scrollTop=0;
}
function closeGuideModal(){
 const modal=$('guideModal');
 if(modal)modal.classList.remove('show');
 const tripModal=$('tripModal');
 if(tripModal)tripModal.classList.remove('show');
 closeMiniMenus();
 document.body.classList.remove('admin-overlay-open');
 clearGuideNavigationContext();
}

function renderPlacePage(key){
  const g = PLACES[key];
  const mount = document.getElementById('placeMain');
  if(!g || !mount) return;
  mount.innerHTML = `
<button class="place-detail-close" type="button" aria-label="Close place detail" onclick="closePlaceDetail()">×</button>
<div class="page-hero"><p class="kicker">Guide</p><h1>${g.emoji} ${g.title}</h1><p class="lead">${g.sub||''}</p></div>
<section aria-label="Quick Info" class="quick-info-card">${quickInfoInnerHTML(g,key)}</section>
<section class="prose-block guide-overview"><h2>Overview</h2><p>${g.desc||''}</p></section>
${compactGuideSections(g)}${guideNavButtons(key,'page')}`;
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
    return `<article class="place-group-card" id="guide-${key}">
      <div class="page-hero place-group-hero"><p class="kicker">Option ${index+1}</p><h1>${g.emoji} ${g.title}</h1><p class="lead">${g.sub||''}</p></div>
      <section aria-label="Quick Info" class="quick-info-card">${quickInfoInnerHTML(g,key)}</section>
      <section class="prose-block guide-overview"><h2>Overview</h2><p>${g.desc||''}</p></section>
      ${compactGuideSections(g)}
    </article>`;
  }).join('');
  mount.innerHTML=`<button class="place-detail-close" type="button" aria-label="Close guide options" onclick="closePlaceDetail()">×</button><div class="page-hero"><p class="kicker">Guide</p><h1>Choose an option</h1><p class="lead">Compare the planned choices, then use Navigate inside the restaurant card you choose.</p></div>${cards}`;
  document.title=`Guide options · ${TRIP_CONFIG.tripName}`;
}
