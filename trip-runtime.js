/* Travel Engine v1.0 — Stage 7M modular runtime. */
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
function accommodationReferenceLabel(booking){
  return booking.id==='queenstown-booking'?'Airbnb reference':(booking.id==='lakefront-booking'?'Luxury Escapes reference':'Booking reference');
}
function getAccommodationBookings(){
  return (typeof BOOKINGS_DATA==='undefined'?[]:Object.values(BOOKINGS_DATA))
    .filter(function(booking){return booking&&booking.type==='accommodation';})
    .sort(function(a,b){return String(a.date||'').localeCompare(String(b.date||''));});
}
function buildAccommodationListHTML(){
  const bookings=getAccommodationBookings();
  if(!bookings.length) return '<p class="timestamp">No accommodation has been added yet.</p>';
  return '<div class="accommodation-picker" role="list">'+bookings.map(function(booking){
    const nights=Number(booking.nights||0);
    const nightsLabel=nights?`${nights} night${nights===1?'':'s'}`:'';
    return `<button class="accommodation-picker-row" type="button" role="listitem" onclick="openAccommodationDetail('${escapeTripHTML(booking.id)}')"><span class="accommodation-picker-icon" aria-hidden="true">🏨</span><span class="accommodation-picker-copy"><strong>${escapeTripHTML(booking.title)}</strong><small>${escapeTripHTML(booking.stayDates||booking.date||'')}</small></span><span class="accommodation-picker-meta">${escapeTripHTML(nightsLabel)}<b aria-hidden="true">›</b></span></button>`;
  }).join('')+'</div>';
}
function buildAccommodationDetailHTML(booking){
  if(!booking)return '<p class="timestamp">Accommodation booking not found.</p>';
  const place=(typeof PLACES!=='undefined'&&booking.placeId)?PLACES[booking.placeId]:null;
  const address=booking.address||(place&&place.address)||'';
  const phone=booking.phone||(place&&place.phone)||'';
  const map=address?accommodationMapURL(address):'';
  const nights=Number(booking.nights||0);
  const nightsLabel=nights?`${nights} night${nights===1?'':'s'}`:'';
  const facts=[
    ['Stay',booking.stayDates||booking.date||''],
    ['Length',nightsLabel],
    ['Room',booking.roomType||booking.notes||'Not added yet'],
    ['Check-in',booking.checkIn||booking.time||'Not added yet'],
    ['Check-out',booking.checkOut||'Not added yet'],
    [accommodationReferenceLabel(booking),booking.reference||'Not added yet'],
    ['Price',booking.price||'Not added yet']
  ].filter(function(row){return row[1];});
  const factHTML=facts.map(function(row){return `<div class="accommodation-fact"><small>${escapeTripHTML(row[0])}</small><strong>${escapeTripHTML(row[1])}</strong></div>`;}).join('');
  const actions=[
    map?`<a class="pill" href="${escapeTripHTML(map)}" target="_blank" rel="noopener">Navigate</a>`:'',
    address?`<button class="pill" type="button" onclick="navigator.clipboard&&navigator.clipboard.writeText(${JSON.stringify(address).replace(/"/g,'&quot;')})">Copy Address</button>`:'',
    phone?`<a class="pill" href="tel:${escapeTripHTML(phone.replace(/\s/g,''))}">Call</a>`:''
  ].join('');
  return `<article class="fact stay-booking accommodation-detail-card"><div class="accommodation-detail-head"><div><strong>${escapeTripHTML(booking.title)}</strong><span>${escapeTripHTML(booking.stayDates||'')}</span></div><span class="accommodation-night-badge">${escapeTripHTML(nightsLabel)}</span></div><div class="accommodation-facts">${factHTML}</div><div class="accommodation-section"><h3>Address</h3><p>${escapeTripHTML(address||'Not added yet')}</p></div><div class="accommodation-section"><h3>Check-in instructions</h3><p>${escapeTripHTML(booking.checkInInstructions||'Not added yet')}</p></div>${actions?`<div class="trip-action-row">${actions}</div>`:''}</article>`;
}
function openAccommodationList(){
  openTripCard('stay');
}
function openAccommodationDetail(bookingId){
  closeMiniMenus();
  const booking=(typeof BOOKINGS_DATA==='undefined')?null:BOOKINGS_DATA[bookingId];
  const content=document.getElementById('tripModalContent');
  const modal=document.getElementById('tripModal');
  if(!content||!modal)return;
  content.innerHTML=`<div class="trip-onepage trip-onepage-stay accommodation-onepage-detail"><button class="accommodation-back" type="button" onclick="openAccommodationList()">‹ All accommodation</button><p class="kicker">Trip · Accommodation</p><h2>${escapeTripHTML(booking?booking.title:'Accommodation')}</h2>${buildAccommodationDetailHTML(booking)}<p class="timestamp trip-build-summary">${tripSyncSummary()}</p></div>`;
  modal.classList.add('show');
  const sheet=document.querySelector('#tripModal .trip-sheet');
  if(sheet)sheet.scrollTop=0;
}

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
  const body=key==='emergency'?compactEmergencyHTML(t.body):(key==='stay'?buildAccommodationListHTML():t.body);
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


