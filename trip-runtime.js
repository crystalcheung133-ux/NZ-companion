/* Travel Engine v1.0 — Stage 7M modular runtime. */
const PRODUCTION_TRIP=GenerationSelectionAdapter.view('trip');
const PRODUCTION_BOOKINGS=GenerationSelectionAdapter.view('bookings');
function saveChecklist(){const checks=[...document.querySelectorAll('[data-check]')].map(c=>c.checked);STORAGE.local.writeJSON(STORAGE_CONFIG.keys.checklist,checks);const done=checks.filter(Boolean).length;const total=checks.length;const ready=$('readyBox');if(ready)ready.classList.toggle('show',total>0&&checks.every(Boolean));const progress=$('checklistProgress');if(progress)progress.textContent=`${done} / ${total} Complete`;renderDashboard();}
function loadChecklist(){const stored=STORAGE.local.readJSON(STORAGE_CONFIG.keys.checklist,[]);document.querySelectorAll('[data-check]').forEach((c,i)=>c.checked=!!stored[i]);saveChecklist();}
document.addEventListener('DOMContentLoaded',()=>{updateFriendLabels();renderMoments();renderUnexpected();renderExpenses();loadChecklist();renderDashboard();});


function compactEmergencyHTML(html){
  const wrapper=document.createElement('div');
  wrapper.innerHTML=html||'';
  wrapper.classList.add('emergency-compact');
  const grids=[...wrapper.querySelectorAll('.emergency-grid')];
  grids.forEach((grid,gridIndex)=>{
    grid.classList.add('emergency-list');
    [...grid.querySelectorAll(':scope > .fact')].forEach((fact,index)=>{
      fact.classList.add('emergency-row');
      if(gridIndex===0&&index===0)fact.classList.add('emergency-primary');

      const title=fact.querySelector(':scope > strong');
      const titleHTML=title?title.outerHTML:'';
      const actionLinks=[...fact.querySelectorAll('a')].map(link=>link.cloneNode(true));
      const contentClone=fact.cloneNode(true);
      contentClone.querySelectorAll('strong,a,.trip-action-row').forEach(node=>node.remove());
      const detailHTML=contentClone.innerHTML
        .replace(/^(\s|<br\s*\/?\s*>)+|((\s|<br\s*\/?\s*>)+)$/gi,'')
        .trim();

      const actions=document.createElement('div');
      actions.className='emergency-actions';
      actionLinks.forEach(link=>{
        if((link.getAttribute('href')||'').startsWith('tel:')){
          link.classList.add('emergency-call');
          const number=(link.getAttribute('href')||'').replace(/^tel:/,'');
          const visible=(link.textContent||'').trim();
          const label=/\d/.test(visible)?visible:(gridIndex===0&&index<2?'Call '+number:'Call');
          link.innerHTML=`<span aria-hidden="true">☎</span><span>${label}</span>`;
        }else if((link.getAttribute('href')||'').includes('maps.google')){
          link.classList.add('emergency-navigate');
          link.innerHTML='<span aria-hidden="true">↗</span><span>Navigate</span>';
        }
        actions.appendChild(link);
      });

      fact.innerHTML=`<div class="emergency-copy">${titleHTML}${detailHTML?`<div class="emergency-details">${detailHTML}</div>`:''}</div>`;
      if(actions.children.length)fact.appendChild(actions);
    });
  });
  return wrapper.outerHTML;
}
function tripSyncSummary(){
  const state=(typeof TRIP_SYNC!=='undefined'&&TRIP_SYNC.getState)?TRIP_SYNC.getState():null;
  const status=(typeof TRIP_SYNC!=='undefined'&&TRIP_SYNC.statusLabel)?TRIP_SYNC.statusLabel():'Local data';
  const version=state&&Number.isFinite(Number(state.remoteVersion))?' · Version '+Number(state.remoteVersion):'';
  return `${TRIP_CONFIG.version} · ${status}${version}`;
}


function escapeTripHTML(value){
  return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];});
}
function accommodationMapURL(address){
  return 'https://maps.google.com/?q='+encodeURIComponent(address||'');
}
function getBookingById(bookingId){
  return (PRODUCTION_BOOKINGS&&PRODUCTION_BOOKINGS.byId)?PRODUCTION_BOOKINGS.byId[bookingId]||null:null;
}
function getBookingsByType(type){
  return (PRODUCTION_BOOKINGS&&PRODUCTION_BOOKINGS.byId?Object.values(PRODUCTION_BOOKINGS.byId):[])
    .filter(function(booking){return booking&&booking.type===type;})
    .sort(function(a,b){return String(a.date||'').localeCompare(String(b.date||''));});
}
function bookingReferenceLabel(booking){
  return booking&&booking.referenceLabel?booking.referenceLabel:'Booking reference';
}
function getAccommodationBookings(){
  return getBookingsByType('accommodation');
}
function buildAccommodationListHTML(){
  const bookings=getAccommodationBookings();
  if(!bookings.length) return '<p class="timestamp">No accommodation has been added yet.</p>';
  return '<div class="accommodation-picker" role="list">'+bookings.map(function(booking){
    const nights=Number(booking.nights||0);
    const nightsLabel=nights?`${nights} night${nights===1?'':'s'}`:'';
    const price=booking.price||'Price not added yet';
    return `<button class="accommodation-picker-row" type="button" role="listitem" onclick="openAccommodationDetail('${escapeTripHTML(booking.id)}')"><span class="accommodation-picker-icon" aria-hidden="true">🏨</span><span class="accommodation-picker-copy"><strong>${escapeTripHTML(booking.title)}</strong><small>${escapeTripHTML(booking.stayDates||booking.date||'')}</small><span class="accommodation-picker-price">${escapeTripHTML(price)}</span></span><span class="accommodation-picker-meta">${escapeTripHTML(nightsLabel)}<b aria-hidden="true">›</b></span></button>`;
  }).join('')+'</div>';
}
function accommodationDetailNavigationHTML(bookingId){
  const bookings=getAccommodationBookings();
  const index=bookings.findIndex(function(item){return item.id===bookingId;});
  if(index<0||bookings.length<2)return '';
  const previous=bookings[(index-1+bookings.length)%bookings.length];
  const next=bookings[(index+1)%bookings.length];
  return `<div class="guide-browse-meta">${index+1} / ${bookings.length}</div><div class="guide-next-row"><button class="pill" type="button" onclick="openAccommodationDetail('${escapeTripHTML(previous.id)}')">‹ Previous</button><button class="pill" type="button" onclick="openAccommodationDetail('${escapeTripHTML(next.id)}')">Next ›</button></div>`;
}
function buildAccommodationDetailHTML(booking){
  if(!booking)return '<p class="timestamp">Accommodation booking not found.</p>';
  const place=(typeof PRODUCTION_TRIP.places!=='undefined'&&booking.placeId)?PRODUCTION_TRIP.places[booking.placeId]:null;
  const address=booking.address||(place&&place.address)||'';
  const phone=booking.phone||(place&&place.phone)||'';
  const map=address?accommodationMapURL(address):'';
  const nights=Number(booking.nights||0);
  const nightsLabel=nights?`${nights} night${nights===1?'':'s'}`:'';
  const bookingStatus=booking.displayStatus||booking.status||'';
  const facts=[
    ['Status',bookingStatus],
    ['Stay',booking.stayDates||booking.date||''],
    ['Length',nightsLabel],
    ['Room',booking.roomType||booking.notes||'Not added yet'],
    ['Check-in',booking.checkIn||booking.time||'Not added yet'],
    ['Check-out',booking.checkOut||'Not added yet'],
    [bookingReferenceLabel(booking),booking.reference||'Not added yet'],
    ['Price',booking.price||'Not added yet'],
    ['Cancellation',booking.cancellation||'']
  ].filter(function(row){return row[1];});
  const factHTML=facts.map(function(row){return `<div class="accommodation-fact"><small>${escapeTripHTML(row[0])}</small><strong>${escapeTripHTML(row[1])}</strong></div>`;}).join('');
  const actions=[
    map?`<a class="pill" href="${escapeTripHTML(map)}" target="_blank" rel="noopener">Navigate</a>`:'',
    address?`<button class="pill" type="button" onclick="navigator.clipboard&&navigator.clipboard.writeText(${JSON.stringify(address).replace(/"/g,'&quot;')})">Copy Address</button>`:'',
    phone?`<a class="pill" href="tel:${escapeTripHTML(phone.replace(/\s/g,''))}">Call</a>`:''
  ].join('');
  return `<article class="fact stay-booking accommodation-detail-card"><div class="accommodation-detail-head"><div><strong>${escapeTripHTML(booking.title)}</strong><span>${escapeTripHTML(booking.stayDates||'')}</span></div><span class="accommodation-night-badge">${escapeTripHTML(nightsLabel)}</span></div><div class="accommodation-facts">${factHTML}</div><div class="accommodation-section"><h3>Address</h3><p>${escapeTripHTML(address||'Not added yet')}</p></div><div class="accommodation-section"><h3>Check-in instructions</h3><p>${escapeTripHTML(booking.checkInInstructions||'Not added yet')}</p></div>${actions?`<div class="trip-action-row">${actions}</div>`:''}${accommodationDetailNavigationHTML(booking.id)}</article>`;
}
function openAccommodationList(){
  openTripCard('stay');
}
function openAccommodationDetail(bookingId){
  closeMiniMenus();
  const booking=getBookingById(bookingId);
  const content=document.getElementById('tripModalContent');
  const modal=document.getElementById('tripModal');
  if(!content||!modal)return;
  content.innerHTML=`<div class="trip-onepage trip-onepage-stay accommodation-onepage-detail"><button class="accommodation-back" type="button" onclick="openAccommodationList()">‹ All accommodation</button><p class="kicker">Trip · Accommodation</p><h2>${escapeTripHTML(booking?booking.title:'Accommodation')}</h2>${buildAccommodationDetailHTML(booking)}<p class="timestamp trip-build-summary">${tripSyncSummary()}</p></div>`;
  modal.classList.add('show');
  const sheet=document.querySelector('#tripModal .trip-sheet');
  if(sheet)sheet.scrollTop=0;
}


function getActivityBookings(){
  return getBookingsByType('activity');
}
function buildActivityBookingListHTML(){
  const bookings=getActivityBookings();
  if(!bookings.length)return '<p class="timestamp">No activity bookings have been added yet.</p>';
  return '<div class="accommodation-picker activity-booking-picker" role="list">'+bookings.map(function(booking){
    return `<button class="accommodation-picker-row activity-booking-row" type="button" role="listitem" onclick="openActivityBookingDetail('${escapeTripHTML(booking.id)}')"><span class="accommodation-picker-icon" aria-hidden="true">🎟️</span><span class="accommodation-picker-copy"><strong>${escapeTripHTML(booking.title)}</strong><small>Day ${escapeTripHTML(String(booking.dayId||'').replace('day',''))} · ${escapeTripHTML(booking.date||'')}</small><span class="accommodation-picker-price">${escapeTripHTML(booking.price||'')}</span></span><span class="accommodation-picker-meta"><span class="activity-status-badge">${escapeTripHTML(String(booking.status||'').toUpperCase())}</span><b aria-hidden="true">›</b></span></button>`;
  }).join('')+'</div>';
}
function activityFamilyBreakdownHTML(booking){
  const rows=Array.isArray(booking.familyBreakdown)?booking.familyBreakdown:[];
  if(!rows.length)return '';
  return `<div class="accommodation-section activity-price-breakdown"><h3>Family price breakdown</h3><div class="activity-family-grid">${rows.map(function(row){return `<div class="activity-family-row"><span><strong>${escapeTripHTML(row.label)}</strong><small>${escapeTripHTML(row.composition)}</small></span><b>${escapeTripHTML(row.total)}</b></div>`;}).join('')}</div><p class="timestamp">Adult: ${escapeTripHTML(booking.adultPrice||'')}<br>Child: ${escapeTripHTML(booking.childPrice||'')}<br>${escapeTripHTML(booking.discount||'')}</p></div>`;
}
function buildActivityBookingDetailHTML(booking){
  if(!booking)return '<p class="timestamp">Activity booking not found.</p>';
  const place=(typeof PRODUCTION_TRIP.places!=='undefined'&&booking.placeId)?PRODUCTION_TRIP.places[booking.placeId]:null;
  const facts=[
    ['Status',String(booking.status||'').toUpperCase()],['Day','Day '+String(booking.dayId||'').replace('day','')],['Date',booking.date||''],['Time',booking.time||''],['Tour type',booking.tourType||''],['Guests',booking.guests?`${booking.guests} · ${booking.adults||0} adults · ${booking.children||0} children`:''],['Booking name',booking.bookingName||''],['Booking reference',booking.reference||''],['Booking way',booking.bookingWay||''],['Payment',booking.paymentStatus||''],['Original total',booking.originalTotal||''],['Discount',booking.discount||''],['Balance due',booking.price||'']
  ].filter(function(row){return row[1];});
  const factsHTML=facts.map(function(row){return `<div class="accommodation-fact"><small>${escapeTripHTML(row[0])}</small><strong>${escapeTripHTML(row[1])}</strong></div>`;}).join('');
  const guideButton=booking.placeId?`<button class="pill" type="button" onclick="NAVIGATION.goPage('place',{query:{placeId:'${escapeTripHTML(booking.placeId)}'}})">Guide</button>`:'';
  const dayNumber=String(booking.dayId||'').replace('day','');
  const dayButton=dayNumber?`<a class="pill" href="day.html?day=${escapeTripHTML(dayNumber)}#${escapeTripHTML(booking.timelineItemId||'')}">Day ${escapeTripHTML(dayNumber)} Timeline</a>`:'';
  const phone=booking.phone?`<a class="pill" href="tel:${escapeTripHTML(String(booking.phone).replace(/\s/g,''))}">Call</a>`:'';
  const email=booking.email?`<a class="pill" href="mailto:${escapeTripHTML(booking.email)}">Email</a>`:'';
  const website=booking.website?`<a class="pill" href="${escapeTripHTML(booking.website)}" target="_blank" rel="noopener">Tour Website</a>`:'';
  return `<article class="fact stay-booking accommodation-detail-card activity-booking-detail"><div class="accommodation-detail-head"><div><strong>${escapeTripHTML(booking.title)}</strong><span>${escapeTripHTML(booking.date||'')}</span></div><span class="accommodation-night-badge activity-confirmed-badge">CONFIRMED</span></div><div class="accommodation-facts">${factsHTML}</div>${activityFamilyBreakdownHTML(booking)}<div class="accommodation-section"><h3>Pickup & drop-off</h3><p>${escapeTripHTML(booking.pickupNote||booking.pickupAddress||'')}</p><p>${escapeTripHTML(booking.dropOff||'')}</p></div><div class="accommodation-section"><h3>Lunch</h3><p>${escapeTripHTML(booking.lunchStatus||'')}</p></div><div class="accommodation-section"><h3>Booking contact</h3><p>${escapeTripHTML(booking.phone||'')}<br>${escapeTripHTML(booking.email||'')}</p></div><div class="accommodation-section"><h3>Cancellation</h3><p>${escapeTripHTML(booking.cancellation||'')}</p></div><div class="trip-action-row">${guideButton}${dayButton}${phone}${email}${website}</div></article>`;
}
function openActivityBookingDetail(bookingId){
  closeMiniMenus();
  const booking=getBookingById(bookingId);
  const content=document.getElementById('tripModalContent');const modal=document.getElementById('tripModal');if(!content||!modal)return;
  content.innerHTML=`<div class="trip-onepage accommodation-onepage-detail"><button class="accommodation-back" type="button" onclick="openTripCard('activities')">‹ All activities</button><p class="kicker">Trip · Activities</p><h2>${escapeTripHTML(booking?booking.title:'Activity Booking')}</h2>${buildActivityBookingDetailHTML(booking)}<p class="timestamp trip-build-summary">${tripSyncSummary()}</p></div>`;
  modal.classList.add('show');const sheet=document.querySelector('#tripModal .trip-sheet');if(sheet)sheet.scrollTop=0;
}

function openTripCard(key) {
  closeMiniMenus();
  const t = PRODUCTION_TRIP.cards[key];
  if (!t) return;
  const idx = PRODUCTION_TRIP.order.indexOf(key);
  const prev = PRODUCTION_TRIP.order[(idx - 1 + PRODUCTION_TRIP.order.length) % PRODUCTION_TRIP.order.length];
  const next = PRODUCTION_TRIP.order[(idx + 1) % PRODUCTION_TRIP.order.length];
  const content = document.getElementById('tripModalContent');
  const modal = document.getElementById('tripModal');
  if (!content || !modal) return;
  const body=key==='emergency'?compactEmergencyHTML(t.body):(key==='stay'?buildAccommodationListHTML():(key==='activities'?buildActivityBookingListHTML():t.body));
  content.innerHTML = `<div class="trip-onepage trip-onepage-${key}"><p class="kicker">Trip</p><h2>${t.title}</h2>${body}<div class="guide-next-row"><button class="pill" onclick="openTripCard('${prev}')">‹ Previous</button><button class="pill" onclick="openTripCard('${next}')">Next ›</button></div><p class="timestamp trip-build-summary">${tripSyncSummary()}</p></div>`;
  modal.classList.add('show');
  const sheet=document.querySelector('#tripModal .trip-sheet');
  if(sheet) sheet.scrollTop=0;
  if (key === 'checklist') setTimeout(loadChecklist, 0);
}

function closeTripModal() {
  const modal = document.getElementById('tripModal');
  if (modal) modal.classList.remove('show');
  const guideModal=document.getElementById('guideModal');
  if(guideModal) guideModal.classList.remove('show');
  closeMiniMenus();
  document.body.classList.remove('admin-overlay-open');
}



function renderDashboard(){
  const checks=[...document.querySelectorAll('[data-dashboard-check]')];
  if(!checks.length) return;
  const stored=STORAGE.local.readJSON(STORAGE_CONFIG.keys.checklist,[]);
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




