/* Travel Engine v1.0 — Stage 7M modular runtime. */
function saveChecklist(){const checks=[...document.querySelectorAll('[data-check]')].map(c=>c.checked);STORAGE.local.writeJSON(STORAGE_CONFIG.keys.checklist,checks);const done=checks.filter(Boolean).length;const ready=$('readyBox');if(ready)ready.classList.toggle('show',checks.length===7&&checks.every(Boolean));const progress=$('checklistProgress');if(progress)progress.textContent=`${done} / 7 Complete`;renderDashboard();renderBeforeTripCard();}
function loadChecklist(){const stored=STORAGE.local.readJSON(STORAGE_CONFIG.keys.checklist,[]);document.querySelectorAll('[data-check]').forEach((c,i)=>c.checked=!!stored[i]);saveChecklist();}
document.addEventListener('DOMContentLoaded',()=>{updateFriendLabels();renderMoments();renderUnexpected();renderExpenses();loadChecklist();renderDashboard();});

function openTripCard(key) {
  const t = TRIP_DATA[key];
  if (!t) return;
  const idx = TRIP_ORDER.indexOf(key);
  const prev = TRIP_ORDER[(idx - 1 + TRIP_ORDER.length) % TRIP_ORDER.length];
  const next = TRIP_ORDER[(idx + 1) % TRIP_ORDER.length];
  const content = document.getElementById('tripModalContent');
  const modal = document.getElementById('tripModal');
  if (!content || !modal) return;
  content.innerHTML = `<div class="trip-onepage"><p class="kicker">Trip</p><h2>${t.title}</h2>${t.body}<div class="guide-next-row"><button class="pill" onclick="openTripCard('${prev}')">‹ Previous</button><button class="pill" onclick="openTripCard('${next}')">Next ›</button></div><p class="timestamp">Build · Version ${TRIP_CONFIG.version} · ${TRIP_CONFIG.buildLabel}</p></div>`;
  modal.classList.add('show');
  const sheet=document.querySelector('#tripModal .trip-sheet');
  if(sheet) sheet.scrollTop=0;
  if (key === 'checklist') setTimeout(loadChecklist, 0);
}

function closeTripModal() {
  const modal = document.getElementById('tripModal');
  if (modal) modal.classList.remove('show');
}



function renderDashboard(){
  const checks=[...document.querySelectorAll('[data-dashboard-check]')];
  if(!checks.length) return;
  const stored=STORAGE.local.readJSON(STORAGE_CONFIG.keys.checklist,[]);
  const done=stored.filter(Boolean).length;
  const total=7;
  const percent=Math.round((done/total)*100);
  const pct=document.getElementById('dashReadyPercent');
  const bar=document.getElementById('dashReadyBar');
  const count=document.getElementById('dashChecklistCount');
  if(pct) pct.textContent=percent+'%';
  if(bar) bar.style.width=percent+'%';
  if(count) count.textContent=`${done} / ${total} Checklist Completed`;
}


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


function renderBeforeTripCard(){
  const card=document.getElementById('beforeTripCard');
  if(!card) return;
  const today=typeof tripDateParts==='function'?tripDateParts():new Date().toISOString().slice(0,10);
  const before=today<TRIP_CONFIG.startDate;
  card.hidden=!before;
  if(!before)return;
  const stored=STORAGE.local.readJSON(STORAGE_CONFIG.keys.checklist,[]);
  const done=stored.slice(0,7).filter(Boolean).length;
  const label=document.getElementById('beforeTripProgress');
  if(label)label.textContent=done===7?'Ready for departure':`${done} / 7 complete`;
  card.classList.toggle('is-ready',done===7);
}
document.addEventListener('DOMContentLoaded',renderBeforeTripCard);
