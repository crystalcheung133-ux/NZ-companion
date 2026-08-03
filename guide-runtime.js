/* ============================================================================
   TRAVEL ENGINE — GUIDE & PLACE MODULE
   Stage 7K-2D
   Owns Guide navigation context, category/place modal flow, shopping directory
   view, place page rendering and guide-specific copy/address behavior.
   Shared DOM/menu helpers remain in script.js and are available before this
   module loads.
   ============================================================================ */
const PRODUCTION_GUIDE=GenerationSelectionAdapter.view('guide');

function visitDayHTML(key){
  const days=GUIDE_NAVIGATION.dayLinks(key);
  if(!days.length) return '';
  const place=PRODUCTION_GUIDE.places[key]||{};
  const isStay=place.cat==='STAY';
  const booking=isStay&&window.BOOKING_AUTHORITY?BOOKING_AUTHORITY.byPlace(key):null;
  const buttons=days.map(([label,href])=>`<a class="day-jump-button" href="${href}">${label} →</a>`).join('');
  const nights=Number(booking?.nights||0);
  const stayLength=nights?`<span class="stay-length-note">Staying ${nights} night${nights===1?'':'s'}</span>`:'';
  return `<div class="quick-info-row visit-row"><span class="quick-info-icon">📅</span><span><span class="quick-info-label">${isStay?'Check-in Day':'Visit Day'}</span><span class="quick-info-value day-link-row">${buttons}${stayLength}</span></span></div>`;
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
      scrollY:Number.isFinite(Number(opts.scrollY))?Number(opts.scrollY):(window.scrollY||0),
      savedAt:Date.now()
    }));
  }catch(e){}
}
function openGuideGroupFromDay(keys,itemId){
  const excluded=new Set(TRIP_CONFIG.guide?.excludedPlaceIds||[]);
  const clean=[...new Set((Array.isArray(keys)?keys:[]).filter(key=>key&&typeof PRODUCTION_GUIDE.places!=='undefined'&&PRODUCTION_GUIDE.places[key]&&!excluded.has(key)))];
  if(!clean.length) return;
  const first=PRODUCTION_GUIDE.places[clean[0]]||{};
  const sourceUrl=NAVIGATION.currentRelativeUrl({hash:null});
  saveGuideNavigationContext(first.cat||'GUIDE',{sourceUrl,sourceType:'day',scrollY:window.scrollY||0});
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
  try{
    if(context?.sourceType==='day') STORAGE.session.set(GUIDE_NAV_REOPEN_KEY,JSON.stringify({scrollY:Number(context.scrollY)||0,savedAt:Date.now()}));
  }catch(e){}
  try{STORAGE.session.remove(GUIDE_NAV_CONTEXT_KEY);}catch(e){}
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
 const excluded=new Set(TRIP_CONFIG.guide?.excludedPlaceIds||[]);
 return (PRODUCTION_GUIDE.categories[cat]||[])
  .map(item=>{const key=typeof item==='string'?item:item&&item.key;return key&&PRODUCTION_GUIDE.places[key]?Object.assign({key},PRODUCTION_GUIDE.places[key]):null;})
  .filter(item=>item&&!excluded.has(item.key));
}
function guideCategoryHeading(cat){
 if(cat==='ATTRACTIONS') return 'SIGHTS';
 if(cat==='ACTIVITIES') return 'ACTIVITIES';
 return cat;
}

function guideDayNumber(item){
 const links=PRODUCTION_GUIDE.dayLinks[item.key]||[];
 const numbers=links.map(link=>{const match=String(link&&link[0]||'').match(/Day\s*(\d+)/i);return match?Number(match[1]):null;}).filter(Number.isFinite);
 return numbers.length?Math.min(...numbers):999;
}
function guideActivityGroup(item){
 const text=`${item.title||''} ${item.sub||''} ${item.categoryLabel||''}`.toLowerCase();
 if(/cruise|tour|4wd|glowworm|milford|doubtful|gold panning/.test(text)) return 'Tours & Cruises';
 if(/track|hike|walk|blue lakes|deer park/.test(text)) return 'Walks & Outdoor';
 return 'Experiences & Attractions';
}
function guideSortedCategoryItems(cat){
 const items=guideCategoryItems(cat).slice();
 if(cat==='ATTRACTIONS') return items.sort((a,b)=>guideDayNumber(a)-guideDayNumber(b)||String(a.title||'').localeCompare(String(b.title||'')));
 if(cat==='ACTIVITIES') return items.sort((a,b)=>guideActivityGroup(a).localeCompare(guideActivityGroup(b))||String(a.title||'').localeCompare(String(b.title||'')));
 return items.sort((a,b)=>String(a.title||'').localeCompare(String(b.title||'')));
}
function guideListRow(item){
 return `<button onclick="openGuideModal('${item.key}')"><span><span class="guide-list-title">${item.emoji} ${item.title}</span><span class="guide-list-sub">${item.sub||''}</span></span><span class="guide-list-meta">${guideStatusHTML(PRODUCTION_GUIDE.places[item.key]||{})}<span class="guide-list-chevron">›</span></span></button>`;
}
function groupedGuideRows(cat,list){
 if(cat==='ATTRACTIONS'){
  const groups=new Map();
  list.forEach(item=>{const day=guideDayNumber(item);const label=day===999?'Optional / Flexible':`Day ${day}`;(groups.get(label)||groups.set(label,[]).get(label)).push(item);});
  return [...groups.entries()].map(([label,items])=>`<section class="guide-category-group"><h3 class="guide-category-group-title">${label}</h3>${items.map(guideListRow).join('')}</section>`).join('');
 }
 if(cat==='ACTIVITIES'){
  const groups=new Map();
  list.forEach(item=>{const label=guideActivityGroup(item);(groups.get(label)||groups.set(label,[]).get(label)).push(item);});
  return [...groups.entries()].map(([label,items])=>`<section class="guide-category-group"><h3 class="guide-category-group-title">${label}</h3>${items.map(guideListRow).join('')}</section>`).join('');
 }
 return list.map(guideListRow).join('');
}
function openGuideCategory(cat){
 saveGuideNavigationContext(cat);
 const list=guideSortedCategoryItems(cat);
 if(cat==='SHOP'){
  const directoryRow=`<button onclick="openShoppingDirectoryView()"><span><span class="guide-list-title">🛍 Shopping Directory</span><span class="guide-list-sub">Optional shops · Near · Best with Day</span></span><span>↓</span></button>`;
  const rows=directoryRow+list.map(i=>`<button onclick="openGuideModal('${i.key}')"><span><span class="guide-list-title">${i.emoji} ${i.title}</span><span class="guide-list-sub">${i.sub||''}</span></span><span class="guide-list-meta">${guideStatusHTML(PRODUCTION_GUIDE.places[i.key]||{})}<span class="guide-list-chevron">›</span></span></button>`).join('');
  $('guideModalContent').innerHTML=`<p class="kicker">Guide</p><h2>SHOP</h2><div class="category-pop-list">${rows}</div>`;
  closeMiniMenus();$('guideModal').classList.add('show');return;
 }
 const rows=groupedGuideRows(cat,list);
 $('guideModalContent').innerHTML=`<p class="kicker">Guide</p><h2>${guideCategoryHeading(cat)}</h2><div class="category-pop-list guide-category-grouped">${rows}</div>`;
 closeMiniMenus();$('guideModal').classList.add('show');
}

function guideStatusHTML(g){
 const audit=String(g.audit||'');
 const optionalPattern=/optional|option|alternative|backup|recommended|flexible|weather-dependent/i;
 const status=(g.status==='optional'||(!g.status&&optionalPattern.test(audit)))?'OPTIONAL':'PLANNED';
 return `<span class="guide-status guide-status-${status.toLowerCase()}">${status}</span>`;
}
function copyGuideAddress(key){
 const g=PRODUCTION_GUIDE.places[key]; if(!g?.address)return;
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
 const unknown=/^(see|look at|refer to)\s+trip\s+info$|^check (current|live)|^prices? may vary$|^contact venue/i;
 const placePrice=String(g.price||'').trim();
 const accommodationBooking=(g.cat==='STAY'&&window.BOOKING_AUTHORITY)?BOOKING_AUTHORITY.byPlace(key):null;
 const bookingPrice=String(accommodationBooking?.price||'').trim();
 // Accommodation commercial details have one canonical owner: BOOKINGS_DATA.
 // This prevents Guide cards losing prices when place content is edited independently.
 const price=(bookingPrice&&!unknown.test(bookingPrice))?bookingPrice:placePrice;
 const showPrice=price&&!unknown.test(price);
 const priceRow=showPrice?`<div class="quick-info-row"><span class="quick-info-icon">💰</span><span><span class="quick-info-label">Price</span><span class="quick-info-value">${price}</span></span></div>`:'';
 const hours=String(g.hours||'').trim();
 const hoursRow=hours&&!unknown.test(hours)?`<div class="quick-info-row"><span class="quick-info-icon">🕘</span><span><span class="quick-info-label">Hours</span><span class="quick-info-value">${hours}</span></span></div>`:'';
 const address=String(g.address||'').trim();
 const addressRow=address?`<div class="quick-info-row"><span class="quick-info-icon">📍</span><span><span class="quick-info-label">Address</span><span class="quick-info-value">${address}</span></span></div>`:'';
 const copyButton=address?`<button class="utility-button" type="button" onclick="copyGuideAddress('${key}')">📍 Copy Address</button>`:'';
 const navButton=g.maps?`<a class="map-button" href="${g.maps}" target="_blank" rel="noopener">🧭 Navigate</a>`:'';
 const roleBadge=g.itineraryRole?`<span class="itinerary-role-badge">${g.itineraryRole}</span>`:'';
 const reminder=String(g.visitorReminder||'').trim();
 const reminderRow=reminder?`<p class="visitor-reminder"><strong>Reminder:</strong> ${reminder}</p>`:'';
 const linkedBooking=window.BOOKING_AUTHORITY?BOOKING_AUTHORITY.byPlace(key):null;
 const bookingStatus=linkedBooking?String(linkedBooking.displayStatus||linkedBooking.status||'').toUpperCase():'';
 const bookingRow=linkedBooking?`<div class="quick-info-row"><span class="quick-info-icon">🎟️</span><span><span class="quick-info-label">Booking</span><span class="quick-info-value">${bookingStatus||'DETAILS AVAILABLE'}</span></span></div>`:'';
 const bookingButton=linkedBooking?`<button class="utility-button" type="button" onclick="${linkedBooking.type==='activity'?'openActivityBookingDetail':'openAccommodationDetail'}('${linkedBooking.id}')">🎟️ Booking Details</button>`:'';
 const parking=g.parking;
 const parkingHTML=parking?`<div class="recommended-parking"><div class="recommended-parking-head"><span>🚗</span><span><strong>Recommended Parking</strong><small>${parking.name||''}</small></span></div><div class="recommended-parking-grid"><p><span>📍</span><span>${parking.address||''}</span></p><p><span>🚶</span><span>${parking.walk||''}</span></p><p><span>💰</span><span>${parking.fee||''}</span></p></div>${parking.note?`<p class="recommended-parking-note">${parking.note}</p>`:''}${parking.maps?`<a class="map-button recommended-parking-nav" href="${parking.maps}" target="_blank" rel="noopener">🧭 Navigate to Parking</a>`:''}</div>`:'';
 return `<div class="quick-info-top"><span class="category-tag">${g.categoryLabel||g.cat||'Guide'}</span>${roleBadge}${guideStatusHTML(g)}</div><div class="quick-info-grid">${addressRow}${phoneRow}${hoursRow}${priceRow}${bookingRow}${visitDayHTML(key)}</div>${reminderRow}${parkingHTML}<div class="quick-info-actions">${copyButton}${navButton}${bookingButton}${callButton}${websiteButton}</div>`;
}

function quickInfoHTML(g,key){
 return `<div class="quick-info-card">${quickInfoInnerHTML(g,key)}</div>`;
}

function guideCategoryForKey(key){return GUIDE_NAVIGATION.categoryFor(key);}
function guideCategoryKeys(key){return GUIDE_NAVIGATION.sequenceFor(key);}
function guideNavModel(key){
 const nav=GUIDE_NAVIGATION.neighbours(key);
 return {keys:nav.sequence,idx:nav.position?nav.position-1:-1,prev:nav.previous||'',next:nav.next||'',position:nav.position,total:nav.total};
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
 if(!PRODUCTION_GUIDE.places[key])return;
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
 return `${suggested?`<h3>Suggested Dishes</h3><ul>${suggested}</ul>`:''}${notes?`<h3>Before You Go</h3><ul>${notes}</ul>`:''}`;
}

function routeStopsHTML(g){
 const stops=Array.isArray(g.routeStops)?g.routeStops:[];
 if(!stops.length)return '';
 const rows=stops.map((stop,index)=>`<li class="walking-route-stop"><span class="walking-route-number">${index+1}</span><span><strong>${stop.name||''}</strong><small>📍 ${stop.address||''}${stop.time?` · ⏱ ${stop.time}`:''}</small><p>${stop.look||''}</p></span></li>`).join('');
 return `<section class="walking-route-card"><h3>Suggested Walking Order</h3><ol>${rows}</ol></section>`;
}

function openGuideModal(key){
 const g=PRODUCTION_GUIDE.places[key]; if(!g)return;
 $('guideModalContent').innerHTML=`<div class="guide-onepage"><p class="kicker">Guide</p><h2>${g.emoji} ${g.title}</h2><p class="guide-onepage-sub"><strong>${g.sub}</strong></p><p class="guide-onepage-desc">${g.desc}</p>${quickInfoHTML(g,key)}${routeStopsHTML(g)}${compactGuideSections(g)}${guideNavButtons(key)}</div>`;
 $('guideModal').classList.add('show');
 const sheet=document.querySelector('#guideModal .guide-sheet');
 if(sheet){ sheet.scrollTop=0; if(typeof window.applyNearFitModal==='function') window.applyNearFitModal(sheet,'guide-near-fit'); }
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
  const g = PRODUCTION_GUIDE.places[key];
  const mount = document.getElementById('placeMain');
  if(!g || !mount) return;
  mount.innerHTML = `
<button class="place-detail-close" type="button" aria-label="Close place detail" onclick="closePlaceDetail()">×</button>
<div class="page-hero"><p class="kicker">Guide</p><h1>${g.emoji} ${g.title}</h1><p class="lead">${g.sub||''}</p></div>
<section class="prose-block guide-overview"><h2>Why Go</h2><p>${g.desc||''}</p></section>
<section aria-label="Quick Info" class="quick-info-card">${quickInfoInnerHTML(g,key)}</section>
${routeStopsHTML(g)}${compactGuideSections(g)}${guideNavButtons(key,'page')}`;
  document.title = `${g.title} · ${TRIP_CONFIG.tripName}`;
}

function renderPlaceGroupPage(keys){
  const clean=[...new Set((Array.isArray(keys)?keys:[]).filter(key=>key&&PRODUCTION_GUIDE.places[key]))];
  const mount=document.getElementById('placeMain');
  if(!clean.length||!mount) return;
  // Defensive auto-routing for old/shared links containing a single id.
  if(clean.length===1){ renderPlacePage(clean[0]); return; }
  const cards=clean.map((key,index)=>{
    const g=PRODUCTION_GUIDE.places[key];
    return `<article class="place-group-card" id="guide-${key}">
      <div class="page-hero place-group-hero"><p class="kicker">Option ${index+1}</p><h1>${g.emoji} ${g.title}</h1><p class="lead">${g.sub||''}</p></div>
      <section class="prose-block guide-overview"><h2>Why Go</h2><p>${g.desc||''}</p></section>
      <section aria-label="Quick Info" class="quick-info-card">${quickInfoInnerHTML(g,key)}</section>
      ${routeStopsHTML(g)}${compactGuideSections(g)}
    </article>`;
  }).join('');
  mount.innerHTML=`<button class="place-detail-close" type="button" aria-label="Close guide options" onclick="closePlaceDetail()">×</button><div class="page-hero"><p class="kicker">Guide</p><h1>Choose an option</h1><p class="lead">Compare the planned choices, then use Navigate inside the restaurant card you choose.</p></div>${cards}`;
  document.title=`Guide options · ${TRIP_CONFIG.tripName}`;
}


