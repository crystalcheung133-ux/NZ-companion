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
  return window.BOOKING_AUTHORITY?BOOKING_AUTHORITY.get(bookingId,PRODUCTION_BOOKINGS&&PRODUCTION_BOOKINGS.byId):null;
}
function getBookingsByType(type){
  const items=window.BOOKING_AUTHORITY?BOOKING_AUTHORITY.byType(type,PRODUCTION_BOOKINGS&&PRODUCTION_BOOKINGS.byId):[];
  return items.sort(function(a,b){return String(a.date||'').localeCompare(String(b.date||''));});
}
function getBookingsByCategory(category){
  const target=String(category||'').toLowerCase();
  const items=window.BOOKING_AUTHORITY?BOOKING_AUTHORITY.all(PRODUCTION_BOOKINGS&&PRODUCTION_BOOKINGS.byId):[];
  return items.filter(function(item){
    const explicit=String((item&&item.bookingCategory)||(item&&item.category)||'').toLowerCase();
    const type=String(item&&item.type||'').toLowerCase();
    if(target==='accommodation')return explicit==='accommodation'||explicit==='stay'||explicit==='hotel'||type==='accommodation';
    if(target==='activities')return explicit==='activities'||explicit==='activity'||explicit==='experience'||type==='activity';
    if(target==='transport')return explicit==='transport'||explicit==='transfer'||type==='transport';
    if(target==='restaurants')return explicit==='restaurant'||explicit==='restaurants'||type==='restaurant';
    if(target==='spa')return explicit==='spa'||type==='spa';
    return false;
  }).sort(function(a,b){return String(a.date||'').localeCompare(String(b.date||''))||String(a.time||'').localeCompare(String(b.time||''));});
}
let activeBookingDetail=null;
function bookingReferenceLabel(booking){
  return booking&&booking.referenceLabel?booking.referenceLabel:'Booking reference';
}
function getAccommodationBookings(){
  return getBookingsByCategory('accommodation');
}
function buildAccommodationListHTML(){
  const bookings=getAccommodationBookings();
  if(!bookings.length) return '<p class="timestamp">No accommodation has been added yet.</p>';
  return '<div class="accommodation-picker" role="list">'+bookings.map(function(booking){
    const nights=Number(booking.nights||0);
    const nightsLabel=nights?`${nights} night${nights===1?'':'s'}`:'';
    const priceParts=[];
    if(booking.totalAmount||booking.price)priceParts.push(`Total ${booking.totalAmount||booking.price}`);
    if(booking.cashbackAmount||booking.cashback)priceParts.push(`Cashback ${booking.cashbackAmount||booking.cashback}`);
    if(booking.netTotalAUD||booking.netPrice)priceParts.push(`${booking.approximateNet?'≈ ':''}Net ${booking.netTotalAUD||booking.netPrice}`);
    const price=priceParts.join(' · ')||'Price not added yet';
    const statusLabel=booking.displayStatus||bookingStatusText(booking)||'';
    const statusClass=String(booking.status||'').replace(/[^a-z0-9-]/gi,'').toLowerCase();
    return `<button class="accommodation-picker-row" type="button" role="listitem" onclick="openAccommodationDetail('${escapeTripHTML(booking.id)}')"><span class="accommodation-picker-icon" aria-hidden="true">🏨</span><span class="accommodation-picker-copy"><strong>${escapeTripHTML(booking.title)}</strong><small>${escapeTripHTML(booking.stayDates||booking.date||'')}</small><span class="accommodation-picker-price">${escapeTripHTML(price)}</span></span><span class="accommodation-picker-meta accommodation-picker-meta--stack">${statusLabel?`<span class="accommodation-status-badge accommodation-status-badge--${escapeTripHTML(statusClass)}">${escapeTripHTML(statusLabel)}</span>`:''}<span class="accommodation-night-line">${escapeTripHTML(nightsLabel)} <b aria-hidden="true">›</b></span></span></button>`;
  }).join('')+'</div>';
}
function bookingBrowseNavigationHTML(bookings,index,openFunction){
  if(index<0)return '';
  const previous=index>0?bookings[index-1]:null;
  const next=index<bookings.length-1?bookings[index+1]:null;
  const prevButton=previous?`<button class="pill" type="button" onclick="${openFunction}('${escapeTripHTML(previous.id)}')">‹ Previous</button>`:`<button class="pill" type="button" disabled aria-disabled="true">‹ Previous</button>`;
  const nextButton=next?`<button class="pill" type="button" onclick="${openFunction}('${escapeTripHTML(next.id)}')">Next ›</button>`:`<button class="pill" type="button" disabled aria-disabled="true">Next ›</button>`;
  return `<div class="guide-browse-meta">${index+1} / ${bookings.length}</div><div class="guide-next-row booking-detail-navigation">${prevButton}${nextButton}</div>`;
}
function accommodationDetailNavigationHTML(bookingId){
  const bookings=getAccommodationBookings();
  const index=bookings.findIndex(function(item){return item.id===bookingId;});
  return bookingBrowseNavigationHTML(bookings,index,'openAccommodationDetail');
}
function normalizedBookingStatus(booking){
  const raw=String((booking&&booking.status)||'pending').toLowerCase();
  return raw==='confirmed'?'confirmed':'pending';
}
function bookingStatusText(booking){
  const raw=String((booking&&((booking.displayStatus||booking.status)))||'').replace(/-/g,' ').trim().toUpperCase();
  if(raw==='OPEN'||raw==='UNBOOKED'||raw==='DECIDE LATER'||raw==='TBD')return 'OPEN';
  return normalizedBookingStatus(booking)==='confirmed'?'CONFIRMED':'PENDING';
}
function bookingDayNumber(booking){
  const raw=String((booking&&booking.dayId)||'').replace('day','').replace(/\D/g,'');
  return raw||'';
}
function bookingPlace(booking){
  return (booking&&booking.placeId&&typeof PRODUCTION_TRIP.places!=='undefined')?PRODUCTION_TRIP.places[booking.placeId]||null:null;
}
function bookingAddress(booking,place){
  return (booking&&booking.address)||(booking&&booking.pickupAddress)||(place&&place.address)||'';
}
function bookingFactGridHTML(rows){
  return rows.filter(function(row){return row&&row[1]!==undefined&&row[1]!==null&&String(row[1]).trim()!=='';})
    .map(function(row){return `<div class="accommodation-fact"><small>${escapeTripHTML(row[0])}</small><strong>${escapeTripHTML(row[1])}</strong></div>`;}).join('');
}
function bookingSectionHTML(title,content,options){
  const opts=options||{};
  if(content===undefined||content===null||String(content).trim()==='')return '';
  const safe=opts.html?String(content):escapeTripHTML(content).replace(/\n/g,'<br>');
  return `<div class="accommodation-section"><h3>${escapeTripHTML(title)}</h3><p>${safe}</p></div>`;
}

function bookingHumanValue(value,trueLabel){
  if(value===true)return trueLabel||'PAID';
  if(value===false||value===null||value===undefined)return '';
  return String(value);
}
function bookingDepositDisplay(booking){
  const amount=String(booking&&booking.depositAmount||'').replace(/,/g,'').trim();
  const currency=String(booking&&booking.depositCurrency||'').trim();
  let main='';
  if(amount&&/^\d+(?:\.\d+)?$/.test(amount)){
    main=`${Number(amount).toLocaleString('en-US')}${currency?` ${currency}`:''}`;
  }else{
    main=bookingHumanValue(booking&&booking.depositPaid,'PAID');
  }
  const aud=String(booking&&booking.depositAUD||'').trim();
  return [main,aud].filter(Boolean).join(' · ');
}
function accommodationPaymentHTML(booking){
  const status=bookingHumanValue(booking.paymentLabel||booking.paymentStatus||'');
  const rows=[
    ['Charge date',bookingHumanValue(booking.chargeDate||'')],
    ['Total',bookingHumanValue(booking.totalAmount||'')],
    ['Deposit',bookingDepositDisplay(booking)],
    ['Balance due',bookingHumanValue(booking.balanceDue||booking.payAtPickup||'')],
    [booking.discountLabel||'Discount',bookingHumanValue(booking.discountAmount||'')],
    ['Cashback',bookingHumanValue(booking.cashbackAmount||booking.cashback||'')],
    [booking.approximateNet?'≈ Net cost':'Net cost',bookingHumanValue(booking.netTotalAUD||booking.netPrice||'')]
  ].filter(function(row){return String(row[1]||'').trim();});
  if(!status&&!rows.length)return '';
  return `<section class="accommodation-payment-block"><div class="accommodation-payment-head"><h3>Payment</h3>${status?`<span>${escapeTripHTML(String(status).toUpperCase())}</span>`:''}</div>${rows.length?`<dl>${rows.map(function(row,index){return `<div class="${index===rows.length-1?'payment-net-row':''}"><dt>${escapeTripHTML(row[0])}</dt><dd>${escapeTripHTML(row[1])}</dd></div>`;}).join('')}</dl>`:''}${booking.fxNote?`<p class="payment-fx-note">${escapeTripHTML(booking.fxNote)}</p>`:''}</section>`;
}
function bookingGuideButtonHTML(booking){
  return booking&&booking.placeId?`<button class="pill trip-action-btn trip-action-btn--guide" type="button" onclick="openGuideModal('${escapeTripHTML(booking.placeId)}')">Guide</button>`:'';
}
function bookingDayButtonHTML(booking){
  const dayNumber=bookingDayNumber(booking);if(!dayNumber)return '';
  const anchor=booking.timelineItemId?`#${escapeTripHTML(booking.timelineItemId)}`:'';
  return `<a class="pill trip-action-btn trip-action-btn--day" href="day.html?day=${escapeTripHTML(dayNumber)}${anchor}">Day ${escapeTripHTML(dayNumber)} Timeline</a>`;
}
function bookingExpenseActionHTML(booking){
  if(!booking||!booking.id||typeof window.openBookingExpense!=='function')return '';
  const links=typeof window.getBookingExpenseLinks==='function'?window.getBookingExpenseLinks(booking.id):[];
  const linked=links.length;
  const newest=links.slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')))[0]||null;
  const viewHref=newest?.id?`expenses.html?expenseId=${encodeURIComponent(newest.id)}`:`expenses.html?bookingId=${encodeURIComponent(booking.id)}`;
  if(linked){
    const label=linked===1?'View Expense':`View ${linked} Expenses`;
    return `<div class="trip-action-row trip-action-row--booking-compact booking-expense-buttons booking-expense-buttons--compact"><a class="pill trip-action-btn trip-action-btn--expense" href="${viewHref}">${label}</a></div>`;
  }
  const hasPayment=Boolean(
    booking.depositPaid||booking.depositAmount||booking.paymentStatus||
    booking.totalAmount||booking.price||booking.cashbackAmount||booking.netTotalAUD
  );
  if(!hasPayment)return '';
  return `<div class="trip-action-row trip-action-row--booking-compact booking-expense-buttons booking-expense-buttons--compact"><button class="pill trip-action-btn trip-action-btn--expense" type="button" onclick="openBookingExpense('${escapeTripHTML(booking.id)}')">Add payment to Expenses</button></div>`;
}
function bookingActionButtonsHTML(booking,place,options={}){
  const includeDay=options.includeDay!==false;
  const whatsappContact=String(booking&&booking.whatsapp||'').trim();
  const whatsappDigits=whatsappContact.replace(/[^0-9]/g,'');
  const whatsapp=(whatsappContact&&whatsappDigits)?`https://wa.me/${whatsappDigits}`:'';
  const buttons=[
    includeDay?bookingDayButtonHTML(booking):'',
    booking&&booking.bookingUrl?`<a class="pill trip-action-btn trip-action-btn--book" href="${escapeTripHTML(booking.bookingUrl)}" target="_blank" rel="noopener">Book Online</a>`:'',
    whatsapp?`<a class="pill trip-action-btn trip-action-btn--whatsapp" href="${escapeTripHTML(whatsapp)}" target="_blank" rel="noopener">WhatsApp</a>`:'',
    booking&&booking.email?`<a class="pill trip-action-btn trip-action-btn--email" href="mailto:${escapeTripHTML(booking.email)}">Email</a>`:''
  ].filter(Boolean);
  return buttons.length?`<div class="trip-action-row trip-action-row--booking-compact">${buttons.join('')}</div>`:'';
}
function bookingContactSectionsHTML(booking,place){
  const phone=(booking&&booking.phone)||(place&&place.phone)||'';
  const email=(booking&&booking.email)||(place&&place.email)||'';
  const website=(booking&&booking.website)||(place&&place.website)||'';
  const contact=[phone,email].filter(Boolean).join('\n');
  const websiteHTML=website?`<a href="${escapeTripHTML(website)}" target="_blank" rel="noopener">${escapeTripHTML(website)}</a>`:'';
  return bookingSectionHTML('Booking contact',contact)+bookingSectionHTML('Website',websiteHTML,{html:true});
}
function buildAccommodationDetailHTML(booking){
  if(!booking)return '<p class="timestamp">Accommodation booking not found.</p>';
  const place=bookingPlace(booking);
  const address=bookingAddress(booking,place);
  const nights=Number(booking.nights||0);
  const nightsLabel=nights?`${nights} night${nights===1?'':'s'}`:'';
  const via=booking.bookingViaOther||booking.bookingWay||booking.platform||'';
  const arrival=[booking.checkIn||'',booking.checkOut||''].filter(Boolean).join(' → ');
  const reference=[booking.bookingName?`Booked under · ${booking.bookingName}`:'',booking.reference?`${bookingReferenceLabel(booking)} · ${booking.reference}`:''].filter(Boolean).join('\n');
  const facts=bookingFactGridHTML([
    ['Status',booking.displayStatus||bookingStatusText(booking)],
    ['Room',booking.roomType||''],
    ['Guests',booking.guestSummary||''],
    ['Host',booking.host||''],
    ['Check-in / out',arrival],
    ['Booking',reference],
    ['Platform',via],
    ['Parking',booking.parking||'']
  ]);
  const operationalNotes=[booking.cancellation||'',booking.notes||''].filter(Boolean).join('\n');
  const sections=[
    accommodationPaymentHTML(booking),
    bookingSectionHTML('Important',operationalNotes),
    bookingSectionHTML('Address',address)
  ].join('');
  return `<article class="fact stay-booking accommodation-detail-card accommodation-detail-card--compact"><div class="accommodation-detail-head"><div><span>${escapeTripHTML(booking.stayDates||booking.date||'')}</span></div>${nightsLabel?`<span class="accommodation-night-badge">${escapeTripHTML(nightsLabel)}</span>`:''}</div><div class="accommodation-facts">${facts}</div>${sections}${bookingActionButtonsHTML(booking,place,{includeDay:false})}${bookingExpenseActionHTML(booking)}${accommodationDetailNavigationHTML(booking.id)}</article>`;
}

function openAccommodationList(){
  openTripCard('stay');
}
function openAccommodationDetail(bookingId,bookingOverride,showSaved){
  activeBookingDetail={type:'accommodation',id:bookingId};
  closeMiniMenus();
  const booking=bookingOverride||getBookingById(bookingId);
  const content=document.getElementById('tripModalContent');
  const modal=document.getElementById('tripModal');
  if(!content||!modal)return;
  if(!booking){ content.innerHTML='<p class="kicker">Trip</p><h2>Booking unavailable</h2><p>Please close and reopen Trip Booking.</p>'; modal.classList.add('show'); return; }
  content.innerHTML=`<div class="trip-onepage trip-onepage-stay accommodation-onepage-detail"><button class="accommodation-back" type="button" onclick="openAccommodationList()">‹ All accommodation</button><p class="kicker">Trip · Accommodation</p><h2>${escapeTripHTML(booking?booking.title:'Accommodation')}</h2>${showSaved?'<p class="timestamp booking-save-success" role="status">Saved ✓</p>':''}${buildAccommodationDetailHTML(booking)}<p class="timestamp trip-build-summary">${tripSyncSummary()}</p></div>`;
  modal.classList.add('show');
  const sheet=document.querySelector('#tripModal .trip-sheet');
  if(sheet)sheet.scrollTop=0;
}


function getActivityBookings(){
  return getBookingsByCategory('activities');
}
function buildActivityBookingListHTML(){
  const bookings=getActivityBookings();
  if(!bookings.length)return '<p class="timestamp">No activity bookings have been added yet.</p>';
  return '<div class="accommodation-picker activity-booking-picker" role="list">'+bookings.map(function(booking){
    return `<button class="accommodation-picker-row activity-booking-row" type="button" role="listitem" onclick="openActivityBookingDetail('${escapeTripHTML(booking.id)}')"><span class="accommodation-picker-icon" aria-hidden="true">🎟️</span><span class="accommodation-picker-copy"><strong>${escapeTripHTML(booking.title)}</strong><small>Day ${escapeTripHTML(String(booking.dayId||'').replace('day',''))} · ${escapeTripHTML(booking.date||'')}</small><span class="accommodation-picker-price">${escapeTripHTML((booking.netTotalAUD||booking.netPrice)?`${booking.approximateNet?'≈ ':''}Net ${booking.netTotalAUD||booking.netPrice}`:(booking.price||''))}</span></span><span class="accommodation-picker-meta"><span class="activity-status-badge">${escapeTripHTML(String(booking.status||'').toUpperCase())}</span><b aria-hidden="true">›</b></span></button>`;
  }).join('')+'</div>';
}
function activityFamilyBreakdownHTML(booking){
  const rows=Array.isArray(booking.familyBreakdown)?booking.familyBreakdown:[];
  if(!rows.length)return '';
  return `<div class="accommodation-section activity-price-breakdown"><h3>Family price breakdown</h3><div class="activity-family-grid">${rows.map(function(row){return `<div class="activity-family-row"><span><strong>${escapeTripHTML(row.label)}</strong><small>${escapeTripHTML(row.composition)}</small></span><b>${escapeTripHTML(row.total)}</b></div>`;}).join('')}</div><p class="timestamp">Adult: ${escapeTripHTML(booking.adultPrice||'')}<br>Child: ${escapeTripHTML(booking.childPrice||'')}</p></div>`;
}
function buildActivityBookingDetailHTML(booking){
  if(!booking)return '<p class="timestamp">Activity booking not found.</p>';
  const place=bookingPlace(booking);
  const facts=bookingFactGridHTML([
    ['Status',String(booking.status||'').toUpperCase()],['Day',bookingDayNumber(booking)?'Day '+bookingDayNumber(booking):''],['Date',booking.date||''],['Time',booking.time||''],
    ['Tour type',booking.tourType||''],['Guests',booking.guests?`${booking.guests} · ${booking.adults||0} adults · ${booking.children||0} children`:''],
    ['Booked under',booking.bookingName||''],[bookingReferenceLabel(booking),booking.reference||''],['Booked via',booking.bookingViaOther||booking.bookingWay||booking.platform||'']
  ]);
  const pickup=[booking.pickupNote||booking.pickupAddress||'',booking.dropOff||''].filter(Boolean).join('\n');
  const sections=[
    accommodationPaymentHTML(booking),activityFamilyBreakdownHTML(booking),bookingSectionHTML('Pickup & drop-off',pickup),bookingSectionHTML('Lunch',booking.lunchStatus||''),
    bookingSectionHTML('Cancellation',booking.cancellation||''),bookingSectionHTML('Notes',booking.notes||'')
  ].join('');
  return `<article class="fact stay-booking accommodation-detail-card activity-booking-detail"><div class="accommodation-detail-head"><div><strong>${escapeTripHTML(booking.title)}</strong><span>${escapeTripHTML(booking.date||'')}</span></div><span class="accommodation-night-badge activity-confirmed-badge">${escapeTripHTML(bookingStatusText(booking))}</span></div><div class="accommodation-facts">${facts}</div>${sections}${bookingActionButtonsHTML(booking,place)}${bookingExpenseActionHTML(booking)}${activityDetailNavigationHTML(booking.id)}</article>`;
}
function openActivityBookingDetail(bookingId,bookingOverride,showSaved){
  activeBookingDetail={type:'activity',id:bookingId};
  closeMiniMenus();
  const booking=bookingOverride||getBookingById(bookingId);
  const content=document.getElementById('tripModalContent');const modal=document.getElementById('tripModal');if(!content||!modal)return;
  content.innerHTML=`<div class="trip-onepage accommodation-onepage-detail"><button class="accommodation-back" type="button" onclick="openTripCard('activities')">‹ All activities</button><p class="kicker">Trip · Activities</p><h2>${escapeTripHTML(booking?booking.title:'Activity Booking')}</h2>${showSaved?'<p class="timestamp booking-save-success" role="status">Saved ✓</p>':''}${buildActivityBookingDetailHTML(booking)}<p class="timestamp trip-build-summary">${tripSyncSummary()}</p></div>`;
  modal.classList.add('show');const sheet=document.querySelector('#tripModal .trip-sheet');if(sheet)sheet.scrollTop=0;
}


function getTransportBookings(){ return getBookingsByCategory('transport'); }
function buildTransportBookingListHTML(){
  const bookings=getTransportBookings();
  if(!bookings.length)return '<p class="timestamp">No transport bookings have been added yet.</p>';
  return '<div class="accommodation-picker transport-booking-picker" role="list">'+bookings.map(function(booking){
    const price=booking.netTotalAUD||booking.netPrice||booking.totalAmount||booking.price||'';
    return `<button class="accommodation-picker-row transport-booking-row" type="button" role="listitem" onclick="openGenericBookingDetail('${escapeTripHTML(booking.id)}')"><span class="accommodation-picker-icon" aria-hidden="true">🚐</span><span class="accommodation-picker-copy"><strong>${escapeTripHTML(booking.title)}</strong><small>Day ${escapeTripHTML(bookingDayNumber(booking)||'')} · ${escapeTripHTML(booking.date||'')}</small>${price?`<span class="accommodation-picker-price">${escapeTripHTML(price)}</span>`:''}</span><span class="accommodation-picker-meta"><span class="activity-status-badge">${escapeTripHTML(bookingStatusText(booking))}</span><b aria-hidden="true">›</b></span></button>`;
  }).join('')+'</div>';
}

function bookingCategoryLabel(booking){
  const explicit=String((booking&&booking.bookingCategory)||(booking&&booking.category)||'').trim().toLowerCase();
  if(explicit==='restaurant'||explicit==='restaurants')return 'Restaurants';
  if(explicit==='spa')return 'Spa';
  if(explicit==='activity'||explicit==='activities'||explicit==='experience')return 'Activities';
  if(explicit==='transport'||explicit==='transfer')return 'Transport';
  if(explicit==='accommodation'||explicit==='stay'||explicit==='hotel')return 'Accommodation';
  const type=String((booking&&booking.type)||'').toLowerCase();
  if(type==='accommodation')return 'Accommodation';
  if(type==='restaurant')return 'Restaurants';
  if(type==='spa')return 'Spa';
  if(type==='transport'||type==='rentalcar')return 'Transport';
  return 'Activities';
}
function buildGenericBookingDetailHTML(booking){
  if(!booking)return '<p class="timestamp">Booking not found.</p>';
  const place=bookingPlace(booking);
  const facts=bookingFactGridHTML([
    ['Status',bookingStatusText(booking)],['Day',bookingDayNumber(booking)?'Day '+bookingDayNumber(booking):''],['Date',booking.date||''],['Time',booking.time||''],
    ['Booked under',booking.bookingName||''],[bookingReferenceLabel(booking),booking.reference||''],['Booking method',booking.bookingMethod||booking.bookingViaOther||booking.bookingWay||booking.platform||''],
    ['WhatsApp',booking.whatsapp||''],['Email',booking.email||'']
  ]);
  const payment=normalizedBookingStatus(booking)==='confirmed'?accommodationPaymentHTML(booking):'';
  const sections=[
    payment,
    bookingSectionHTML('Address',bookingAddress(booking,place)),
    bookingSectionHTML('Notes',booking.notes||''),
    bookingSectionHTML('Cancellation',booking.cancellation||'')
  ].join('');
  return `<article class="fact stay-booking accommodation-detail-card generic-booking-detail"><div class="accommodation-detail-head"><div><strong>${escapeTripHTML(booking.title)}</strong><span>${escapeTripHTML(booking.date||'')}</span></div><span class="accommodation-night-badge">${escapeTripHTML(bookingStatusText(booking))}</span></div><div class="accommodation-facts">${facts}</div>${sections}${bookingActionButtonsHTML(booking,place)}${bookingExpenseActionHTML(booking)}${genericBookingDetailNavigationHTML(booking)}</article>`;
}
function openGenericBookingDetail(bookingId,bookingOverride,showSaved){
  const booking=bookingOverride||getBookingById(bookingId);if(!booking)return;
  activeBookingDetail={type:'generic',id:bookingId};
  closeMiniMenus();
  const content=document.getElementById('tripModalContent');const modal=document.getElementById('tripModal');if(!content||!modal)return;
  content.innerHTML=`<div class="trip-onepage accommodation-onepage-detail"><button class="accommodation-back" type="button" onclick="openBookingCategoryCard('${escapeTripHTML(bookingCategoryLabel(booking))}')">‹ All ${escapeTripHTML(bookingCategoryLabel(booking).toLowerCase())}</button><p class="kicker">Trip · ${escapeTripHTML(bookingCategoryLabel(booking))}</p><h2>${escapeTripHTML(booking.title||'Booking')}</h2>${showSaved?'<p class="timestamp booking-save-success" role="status">Saved ✓</p>':''}${buildGenericBookingDetailHTML(booking)}<p class="timestamp trip-build-summary">${tripSyncSummary()}</p></div>`;
  modal.classList.add('show');const sheet=document.querySelector('#tripModal .trip-sheet');if(sheet)sheet.scrollTop=0;
}


let bookingEditSession=null;
function bookingEditFormSnapshot(form){
  if(!form) return '';
  const data=new FormData(form);
  return Array.from(data.entries()).map(function(entry){return String(entry[0])+'='+String(entry[1]);}).join('\n');
}
function isBookingEditActive(){
  return !!bookingEditSession && !!document.getElementById('bookingEditForm');
}
function isBookingEditDirty(){
  const form=document.getElementById('bookingEditForm');
  return isBookingEditActive() && bookingEditFormSnapshot(form)!==bookingEditSession.initialSnapshot;
}
function confirmDiscardBookingEdit(){
  if(!isBookingEditDirty()) return true;
  return window.confirm('Discard unsaved booking changes?');
}
function clearBookingEditSession(){ bookingEditSession=null; }
function requestBookingEditClose(bookingId){
  if(!confirmDiscardBookingEdit()) return false;
  clearBookingEditSession();
  returnToBookingDetail(bookingId);
  return true;
}
window.isBookingEditActive=isBookingEditActive;
window.isBookingEditDirty=isBookingEditDirty;
window.requestBookingEditClose=requestBookingEditClose;


function bookingEditButtonHTML(booking){
  return booking&&window.BOOKING_PERMISSIONS&&BOOKING_PERMISSIONS.canEdit()
    ?`<button class="pill trip-action-btn booking-edit-btn" type="button" onclick="openBookingEdit('${escapeTripHTML(booking.id)}')">${escapeTripHTML(BOOKING_PERMISSIONS.editLabel())}</button>`:'';
}
function bookingField(label,name,value,options){
  const opts=options||{};
  const val=value==null?'':String(value);
  if(opts.type==='select'){
    const values=(opts.choices||[]).slice();if(val&&!values.includes(val))values.unshift(val);
    const choices=values.map(function(choice){return `<option value="${escapeTripHTML(choice)}"${choice===val?' selected':''}>${escapeTripHTML(choice)}</option>`;}).join('');
    return `<label class="booking-edit-field"><span>${escapeTripHTML(label)}</span><select name="${escapeTripHTML(name)}">${choices}</select></label>`;
  }
  if(opts.type==='textarea')return `<label class="booking-edit-field booking-edit-field--wide"><span>${escapeTripHTML(label)}</span><textarea name="${escapeTripHTML(name)}" rows="3">${escapeTripHTML(val)}</textarea></label>`;
  return `<label class="booking-edit-field${opts.wide?' booking-edit-field--wide':''}"><span>${escapeTripHTML(label)}</span><input name="${escapeTripHTML(name)}" type="${escapeTripHTML(opts.type||'text')}" value="${escapeTripHTML(val)}"${opts.inputmode?` inputmode="${escapeTripHTML(opts.inputmode)}"`:''}></label>`;
}
function bookingViaValue(booking){
  const raw=String(booking.bookingViaOther||booking.bookingWay||booking.platform||'').trim();
  const choices=['Official website','Trip.com','Booking.com','Agoda','Expedia','Klook','KKday','Airbnb','Luxury Escapes','WhatsApp','Email','Phone','Walk-in'];
  return choices.includes(raw)?raw:(raw?'Other':'');
}
function bookingImportantInfo(booking){
  return [booking.cancellation||'',booking.notes||''].filter(Boolean).join('\n');
}
function bookingEditFields(booking){
  const via=bookingViaValue(booking);
  const rawVia=String(booking.bookingViaOther||booking.bookingWay||booking.platform||'').trim();
  const common=[
    bookingField('Status','status',normalizedBookingStatus(booking),{type:'select',choices:['pending','confirmed']}),
    bookingField('Date','date',booking.date),
    bookingField('Booking title','title',booking.title,{wide:true}),
    bookingField('Booked under','bookingName',booking.bookingName),bookingField('Booking reference','reference',booking.reference),
    bookingField('Booked via','bookingVia',via,{type:'select',choices:['','Official website','Trip.com','Booking.com','Agoda','Expedia','Klook','KKday','Airbnb','Luxury Escapes','WhatsApp','Email','Phone','Walk-in','Other']}),
    bookingField('Other booking method / platform','bookingViaOther',via==='Other'?rawVia:'',{wide:true}),
    bookingField('Payment / deposit status','paymentStatus',booking.paymentStatus),bookingField('Total / balance','price',booking.price),
    bookingField('Website / booking link','website',booking.website,{wide:true,inputmode:'url'}),
    bookingField('Phone','phone',booking.phone),bookingField('Email','email',booking.email,{type:'email'}),
    bookingField('Notes / cancellation / important information','importantInfo',bookingImportantInfo(booking),{type:'textarea'})
  ];
  if(booking.type==='accommodation')common.splice(3,0,
    bookingField('Stay dates','stayDates',booking.stayDates,{wide:true}),
    bookingField('Room','roomType',booking.roomType,{wide:true}),
    bookingField('Check-in','checkIn',booking.checkIn),bookingField('Check-out','checkOut',booking.checkOut),
    bookingField('Address','address',booking.address,{type:'textarea'}),bookingField('Arrival instructions','checkInInstructions',booking.checkInInstructions,{type:'textarea'})
  );
  if(booking.type==='activity')common.splice(3,0,
    bookingField('Time','time',booking.time),bookingField('Related day','dayId',booking.dayId),bookingField('Tour type','tourType',booking.tourType,{wide:true}),
    bookingField('Guests','guests',booking.guests,{type:'number',inputmode:'numeric'}),bookingField('Adults','adults',booking.adults,{type:'number',inputmode:'numeric'}),
    bookingField('Children','children',booking.children,{type:'number',inputmode:'numeric'}),bookingField('Original total','originalTotal',booking.originalTotal),
    bookingField('Discount','discount',booking.discount),bookingField('Pickup / meeting point','pickupNote',booking.pickupNote||booking.pickupAddress,{type:'textarea'}),
    bookingField('Drop-off','dropOff',booking.dropOff,{type:'textarea'}),bookingField('Lunch','lunchStatus',booking.lunchStatus,{type:'textarea'})
  );
  return common.join('');
}
function openBookingEdit(bookingId){
  if(!(window.BOOKING_PERMISSIONS&&BOOKING_PERMISSIONS.canEdit()))return;
  const booking=getBookingById(bookingId);if(!booking)return;
  const content=document.getElementById('tripModalContent');const modal=document.getElementById('tripModal');if(!content||!modal)return;
  activeBookingDetail={type:booking.type,id:bookingId};
  content.innerHTML=`<div class="trip-onepage booking-edit-onepage"><button class="accommodation-back" type="button" onclick="requestBookingEditClose('${escapeTripHTML(bookingId)}')">‹ Booking details</button><p class="kicker">Trip Studio · Booking</p><h2>Edit ${escapeTripHTML(booking.title)}</h2><form id="bookingEditForm" class="booking-edit-form" novalidate onsubmit="return saveBookingEdit(event,'${escapeTripHTML(bookingId)}')"><div class="booking-edit-grid">${bookingEditFields(booking)}</div><div class="booking-edit-actions"><button class="pill" type="button" onclick="requestBookingEditClose('${escapeTripHTML(bookingId)}')">Cancel</button><button class="pill booking-delete-btn" type="button" onclick="deleteBookingRecord('${escapeTripHTML(bookingId)}')">Delete Booking</button><button class="pill booking-edit-save" type="submit">Save Booking</button></div><p class="timestamp">Pending and not booked are the same state. Remove bookings that are cancelled and no longer needed.</p></form></div>`;
  modal.classList.add('show');
  const form=document.getElementById('bookingEditForm');
  bookingEditSession={bookingId:bookingId,initialSnapshot:bookingEditFormSnapshot(form)};
  const viaSelect=form&&form.elements&&form.elements.bookingVia;
  const otherField=form&&form.elements&&form.elements.bookingViaOther;
  function syncBookingViaOther(){
    if(!otherField)return;
    const label=otherField.closest('.booking-edit-field');
    const show=viaSelect&&viaSelect.value==='Other';
    if(label)label.hidden=!show;
    if(!show)otherField.value='';
  }
  if(viaSelect){viaSelect.addEventListener('change',syncBookingViaOther);syncBookingViaOther();}
  bookingEditSession.initialSnapshot=bookingEditFormSnapshot(form);
  const sheet=document.querySelector('#tripModal .trip-sheet');if(sheet)sheet.scrollTop=0;
}
function returnToBookingDetail(bookingId,bookingOverride,showSaved){
  const booking=bookingOverride||getBookingById(bookingId);if(!booking)return;
  if(booking.type==='accommodation')return openAccommodationDetail(bookingId,booking,showSaved);
  if(booking.type==='activity'&&bookingCategoryLabel(booking)==='Activities')return openActivityBookingDetail(bookingId,booking,showSaved);
  if(booking.type==='rentalCar')return openTripCard('vehicle');
  return openGenericBookingDetail(bookingId,booking,showSaved);
}
window.returnToBookingDetail=returnToBookingDetail;
async function deleteBookingRecord(bookingId){
  if(!(window.BOOKING_PERMISSIONS&&BOOKING_PERMISSIONS.canEdit()))return false;
  const booking=getBookingById(bookingId);if(!booking||!window.BOOKING_AUTHORITY||typeof BOOKING_AUTHORITY.remove!=='function')return false;
  if(!window.confirm('Delete this booking from the current trip?'))return false;
  const liveTarget=typeof PRODUCTION_BOOKINGS!=='undefined'&&PRODUCTION_BOOKINGS&&PRODUCTION_BOOKINGS.byId?PRODUCTION_BOOKINGS.byId:null;
  try{
    if(window.BOOKING_SYNC&&BOOKING_SYNC.enabled()){
      const remote=await BOOKING_SYNC.remove(booking);
      if(!remote||!remote.ok)throw new Error('remote-delete-failed');
    }
    const result=BOOKING_AUTHORITY.remove(bookingId,liveTarget);
    if(!result||!result.ok)throw new Error((result&&result.reason)||'delete-failed');
    clearBookingEditSession();activeBookingDetail=null;closeTripModal();renderTripMenuFromConfig();return true;
  }catch(error){console.error('Booking delete failed',error);alert('Could not delete this booking. Please check your connection and try again.');return false;}
}
window.deleteBookingRecord=deleteBookingRecord;
async function saveBookingEdit(event,bookingId){
  event.preventDefault();
  if(!(window.BOOKING_PERMISSIONS&&BOOKING_PERMISSIONS.canEdit())){alert(window.BOOKING_PERMISSIONS?BOOKING_PERMISSIONS.denialMessage():'Booking editing is not available.');return false;}
  const form=event.currentTarget;const current=getBookingById(bookingId);if(!current||!window.BOOKING_AUTHORITY){alert('Booking editor is not ready. Please close and reopen this booking.');return false;}
  const formData=new FormData(form);const next=Object.assign({},current);
  formData.forEach(function(value,key){next[key]=String(value).trim();});
  next.status=String(next.status||'pending').toLowerCase()==='confirmed'?'confirmed':'pending';
  const viaChoice=next.bookingVia||'';
  const viaOther=next.bookingViaOther||'';
  const viaValue=viaChoice==='Other'?viaOther:viaChoice;
  next.bookingWay=viaValue;next.platform=viaValue;next.bookingViaOther=viaChoice==='Other'?viaOther:'';
  delete next.bookingVia;
  if(Object.prototype.hasOwnProperty.call(next,'importantInfo')){next.notes=next.importantInfo;next.cancellation='';delete next.importantInfo;}
  ['nights','guests','adults','children'].forEach(function(key){if(Object.prototype.hasOwnProperty.call(next,key)){const value=Number(next[key]);next[key]=Number.isFinite(value)?value:0;}});
  if(next.dayId&&!/^day\d+$/.test(next.dayId))next.dayId='day'+String(next.dayId).replace(/\D/g,'');
  next.updatedBy=(window.getFriend&&window.getFriend())||'admin';next.updatedAt=new Date().toISOString();
  const liveTarget=typeof PRODUCTION_BOOKINGS!=='undefined'&&PRODUCTION_BOOKINGS&&PRODUCTION_BOOKINGS.byId?PRODUCTION_BOOKINGS.byId:null;
  const saveButton=form.querySelector('.booking-edit-save');
  if(saveButton){saveButton.disabled=true;saveButton.textContent='Saving…';}
  let result;
  try{
    if(window.BOOKING_SYNC&&BOOKING_SYNC.enabled()){
      const remote=await BOOKING_SYNC.push(next);
      if(!remote||!remote.ok)throw new Error('remote-save-failed');
      next=remote.booking||next;
    }
    result=BOOKING_AUTHORITY.save(bookingId,next,liveTarget);
    if(!result||!result.ok)throw new Error((result&&result.reason)||'save-failed');
    clearBookingEditSession();
    if(saveButton)saveButton.textContent='Saved ✓';
    document.dispatchEvent(new CustomEvent('travelengine:bookingchange',{detail:{bookingId:bookingId,booking:result.booking}}));
    setTimeout(function(){returnToBookingDetail(bookingId,result.booking,true);},180);
  }catch(error){
    if(saveButton){saveButton.disabled=false;saveButton.textContent='Save Booking';}
    console.error('Booking save failed',error);
    alert('Could not finish saving the booking. Please try again.');
  }
  return false;
}
function reopenSavedBooking(){
  const marker=STORAGE.session.readJSON('travel_engine_booking_reopen_v1',null);if(!marker||!marker.bookingId)return;
  STORAGE.session.remove('travel_engine_booking_reopen_v1');
  setTimeout(function(){returnToBookingDetail(marker.bookingId);},80);
}
document.addEventListener('travelengine:bookingpermissionchange',function(){
  if(!activeBookingDetail)return;
  const modal=document.getElementById('tripModal');if(!modal||!modal.classList.contains('show'))return;
  returnToBookingDetail(activeBookingDetail.id);
});
document.addEventListener('travelengine:adminmodechange',function(){
  if(!activeBookingDetail)return;
  const modal=document.getElementById('tripModal');if(!modal||!modal.classList.contains('show'))return;
  returnToBookingDetail(activeBookingDetail.id);
});
document.addEventListener('DOMContentLoaded',reopenSavedBooking);
function openDeepLinkedBooking(){
  const bookingId=new URLSearchParams(window.location.search).get('bookingId');
  if(!bookingId)return;
  const booking=getBookingById(bookingId);
  if(!booking)return;
  setTimeout(function(){returnToBookingDetail(bookingId,booking);},0);
}
document.addEventListener('DOMContentLoaded',openDeepLinkedBooking);


function buildRentalCarHTML(){
  const booking=getBookingsByType('rentalCar')[0]||null;
  if(!booking)return '<p class="timestamp">Rental-car booking unavailable.</p>';
  const facts=bookingFactGridHTML([
    ['Status',bookingStatusText(booking)],
    ['Vehicle',booking.vehicle||''],
    ['Booking',booking.reference||booking.bookingNumber||''],
    ['Provider',booking.provider||''],
    ['Pickup',booking.pickupDateTime||''],
    ['Return',booking.returnDateTime||'']
  ]);
  const depots=`<div class="fact-grid rental-depot-grid"><div class="fact rental-depot-card"><strong>Pickup depot</strong>${escapeTripHTML(booking.pickupDepotAddress||booking.pickupAddress||'')}<div class="trip-action-row rental-depot-actions"><a class="pill" href="${escapeTripHTML(booking.pickupNavigationDestination||accommodationMapURL(booking.pickupDepotAddress||booking.pickupAddress||''))}" target="_blank" rel="noopener">Navigate to pickup</a></div></div><div class="fact rental-depot-card"><strong>Return depot</strong>${escapeTripHTML(booking.returnDepotAddress||booking.returnAddress||'')}<div class="trip-action-row rental-depot-actions"><a class="pill" href="${escapeTripHTML(booking.returnNavigationDestination||accommodationMapURL(booking.returnDepotAddress||booking.returnAddress||''))}" target="_blank" rel="noopener">Navigate to return</a></div></div></div>`;
  const instructions=Array.isArray(booking.pickupInstructions)?booking.pickupInstructions.filter(Boolean):[];
  const pickup=instructions.length?`<h3>Pickup instructions</h3><ol>${instructions.map(line=>`<li>${escapeTripHTML(line)}</li>`).join('')}</ol>${booking.shuttleCollectionAddress?`<p class="timestamp">Shuttle collection point: ${escapeTripHTML(booking.shuttleCollectionAddress)}</p>`:''}`:'';
  return `<article class="fact stay-booking accommodation-detail-card rental-booking-detail"><div class="accommodation-facts">${facts}</div>${accommodationPaymentHTML(booking)}${depots}${pickup}</article>`;
}
function activityDetailNavigationHTML(bookingId){
  const bookings=getActivityBookings();
  const index=bookings.findIndex(function(item){return item.id===bookingId;});
  return bookingBrowseNavigationHTML(bookings,index,'openActivityBookingDetail');
}
function genericBookingDetailNavigationHTML(booking){
  if(!booking)return '';
  const category=bookingCategoryLabel(booking);
  const bookings=getBookingsByCategory(category);
  const index=bookings.findIndex(function(item){return item.id===booking.id;});
  return bookingBrowseNavigationHTML(bookings,index,'openGenericBookingDetail');
}
function tripHubEntries(){
  const cards=PRODUCTION_TRIP.cards||{};
  const modules=TRIP_CONFIG.tripModules||{};
  const enabled=(name,fallback)=>Object.prototype.hasOwnProperty.call(modules,name)?modules[name]!==false:fallback;
  const entries=[];
  if(cards.flights)entries.push({id:'flights',action:"openTripCard('flights')"});
  if(enabled('stay',!!getAccommodationBookings().length)&&getAccommodationBookings().length)entries.push({id:'stay',action:"openTripCard('stay')"});
  if(getBookingsByCategory('restaurants').length)entries.push({id:'restaurants',action:"openBookingCategoryCard('Restaurants')"});
  if(getBookingsByCategory('spa').length)entries.push({id:'spa',action:"openBookingCategoryCard('Spa')"});
  const groups=Array.isArray(TRIP_CONFIG.tripMenuGroups)?TRIP_CONFIG.tripMenuGroups:[];
  const groupedModules=new Set();
  groups.forEach(group=>{
    const mods=Array.isArray(group&&group.modules)?group.modules:[];
    const hasActivity=mods.includes('activities')&&enabled('activities',!!getActivityBookings().length)&&getActivityBookings().length;
    const hasTransport=mods.includes('transport')&&enabled('transport',!!getTransportBookings().length)&&getTransportBookings().length;
    if(hasActivity||hasTransport){entries.push({id:'group:'+group.id,action:`openTripModuleGroup('${group.id}')`});mods.forEach(m=>groupedModules.add(m));}
  });
  if(!groupedModules.has('activities')&&enabled('activities',!!getActivityBookings().length)&&getActivityBookings().length)entries.push({id:'activities',action:"openTripCard('activities')"});
  if(!groupedModules.has('transport')&&enabled('transport',!!getTransportBookings().length)&&getTransportBookings().length)entries.push({id:'transport',action:"openTripCard('transport')"});
  if(enabled('rentalCar',!!cards.vehicle)&&cards.vehicle)entries.push({id:'vehicle',action:"openTripCard('vehicle')"});
  return entries;
}
function tripHubNavigationHTML(currentId){
  const entries=tripHubEntries();
  const index=entries.findIndex(entry=>entry.id===currentId);
  if(index<0||!entries.length)return '';
  const previous=index>0?entries[index-1]:null,next=index<entries.length-1?entries[index+1]:null;
  const prev=previous?`<button class="pill" type="button" onclick="${previous.action}">‹ Previous</button>`:`<button class="pill" type="button" disabled aria-disabled="true">‹ Previous</button>`;
  const nxt=next?`<button class="pill" type="button" onclick="${next.action}">Next ›</button>`:`<button class="pill" type="button" disabled aria-disabled="true">Next ›</button>`;
  return `<div class="guide-browse-meta">${index+1} / ${entries.length}</div><div class="guide-next-row trip-hub-navigation">${prev}${nxt}</div>`;
}

function openTripCard(key) {
  const guideModal=document.getElementById('guideModal');
  if(guideModal?.classList.contains('show')) guideModal.classList.remove('show');
  closeMiniMenus();
  const t = PRODUCTION_TRIP.cards[key];
  if (!t) return;

  const content = document.getElementById('tripModalContent');
  const modal = document.getElementById('tripModal');
  if (!content || !modal) return;
  const body=key==='emergency'?compactEmergencyHTML(t.body):(key==='stay'?buildAccommodationListHTML():(key==='activities'?buildActivityBookingListHTML():(key==='transport'?buildTransportBookingListHTML():(key==='vehicle'?buildRentalCarHTML():t.body))));
  content.innerHTML = `<div class="trip-onepage trip-onepage-${key}"><p class="kicker">Trip</p><h2>${t.title}</h2>${body}${tripHubNavigationHTML(key)}<p class="timestamp trip-build-summary">${tripSyncSummary()}</p></div>`;
  modal.classList.add('show');
  const sheet=document.querySelector('#tripModal .trip-sheet');
  if(sheet){ sheet.scrollTop=0; if(typeof window.applyNearFitModal==='function') window.applyNearFitModal(sheet,'trip-near-fit'); }
  if (key === 'checklist') setTimeout(loadChecklist, 0);
}

function closeTripModal() {
  if(isBookingEditActive() && !confirmDiscardBookingEdit()) return false;
  clearBookingEditSession();
  const modal = document.getElementById('tripModal');
  if (modal) modal.classList.remove('show');
  document.body.classList.remove('guide-booking-stack-open');
  const returnToGuide=window.TRIP_MODAL_RETURN_TO_GUIDE===true;
  window.TRIP_MODAL_RETURN_TO_GUIDE=false;
  const guideModal=document.getElementById('guideModal');
  if(guideModal&&!returnToGuide){
    guideModal.classList.remove('show');
    window.GUIDE_MODAL_ORIGIN=null;
    if(typeof window.restoreGuideTimelineOrigin==='function') window.restoreGuideTimelineOrigin();
  }
  closeMiniMenus();
  document.body.classList.remove('admin-overlay-open');
  if(returnToGuide){
    const sheet=document.querySelector('#guideModal .guide-sheet');
    if(sheet) requestAnimationFrame(function(){sheet.focus?.({preventScroll:true});});
  }
  return true;
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




function bookingEntityIcon(booking,category){
  if(booking&&booking.emoji)return String(booking.emoji);
  const type=String(booking&&booking.type||'').toLowerCase();
  const title=String(booking&&booking.title||'').toLowerCase();
  if(type==='restaurant')return title.includes('omakase')?'🍣':title.includes('little bear')?'🧸':title.includes('pizza')?'🍕':title.includes('lune')?'🇫🇷':'🍽️';
  if(type==='spa')return title.includes('suga')||title.includes('head')?'🫧':title.includes('mộc hương')||title.includes('moc huong')||title.includes('wellness')?'🌿':title.includes('hạ spa')||title.includes('ha spa')?'💆‍♀️':'💆';
  if(type==='transport')return title.includes('airport')?'✈️':'🚐';
  if(type==='activity'||type==='experience')return title.includes('cooking')?'👩‍🍳':'🎟️';
  return bookingCategoryIcon(category);
}
function bookingCategoryIcon(category){
  const key=String(category||'').toLowerCase();
  return key==='restaurants'?'🍽️':key==='spa'?'💆':key==='activities'?'🎟️':key==='transport'?'🚐':'📋';
}
function buildBookingCategoryListHTML(category){
  const bookings=getBookingsByCategory(category);
  if(!bookings.length)return `<p class="timestamp">No ${escapeTripHTML(String(category).toLowerCase())} bookings have been added yet.</p>`;
  return '<div class="accommodation-picker booking-category-picker" role="list">'+bookings.map(function(booking){
    const priceParts=[];
    if(booking.totalAmount||booking.price)priceParts.push(`Total ${booking.totalAmount||booking.price}`);
    if(booking.cashbackAmount||booking.cashback)priceParts.push(`Cashback ${booking.cashbackAmount||booking.cashback}`);
    if(booking.netTotalAUD||booking.netPrice)priceParts.push(`Net ${booking.netTotalAUD||booking.netPrice}`);
    const price=priceParts.join(' · ');
    return `<button class="accommodation-picker-row booking-category-row" type="button" role="listitem" onclick="openGenericBookingDetail('${escapeTripHTML(booking.id)}')"><span class="accommodation-picker-icon" aria-hidden="true">${bookingEntityIcon(booking,category)}</span><span class="accommodation-picker-copy"><strong>${escapeTripHTML(booking.title)}</strong><small>${bookingDayNumber(booking)?`Day ${escapeTripHTML(bookingDayNumber(booking))} · `:''}${escapeTripHTML(booking.date||'')}${booking.time?` · ${escapeTripHTML(booking.time)}`:''}</small>${price?`<span class="accommodation-picker-price">${escapeTripHTML(price)}</span>`:''}</span><span class="accommodation-picker-meta"><span class="activity-status-badge">${escapeTripHTML(bookingStatusText(booking))}</span><b aria-hidden="true">›</b></span></button>`;
  }).join('')+'</div>';
}
function openBookingCategoryCard(category){
  closeMiniMenus();
  const content=document.getElementById('tripModalContent'),modal=document.getElementById('tripModal');
  if(!content||!modal)return;
  const hubId=String(category||'').toLowerCase()==='restaurants'?'restaurants':String(category||'').toLowerCase()==='spa'?'spa':'';
  content.innerHTML=`<div class="trip-onepage trip-onepage-booking-category"><p class="kicker">Trip · Booking</p><h2>${bookingCategoryIcon(category)} ${escapeTripHTML(category)}</h2>${buildBookingCategoryListHTML(category)}${hubId?tripHubNavigationHTML(hubId):''}<p class="timestamp trip-build-summary">${tripSyncSummary()}</p></div>`;
  modal.classList.add('show');
  const sheet=document.querySelector('#tripModal .trip-sheet');if(sheet)sheet.scrollTop=0;
}


function buildTripModuleGroupHTML(group){
 const modules=Array.isArray(group&&group.modules)?group.modules:[];
 const sections=[];
 if(modules.includes('activities'))sections.push(`<section class="trip-group-section"><p class="kicker">Activity</p>${buildActivityBookingListHTML()}</section>`);
 if(modules.includes('transport'))sections.push(`<section class="trip-group-section"><p class="kicker">Transport</p>${buildTransportBookingListHTML()}</section>`);
 return sections.join('');
}
function openTripModuleGroup(groupId){
 const groups=Array.isArray(TRIP_CONFIG.tripMenuGroups)?TRIP_CONFIG.tripMenuGroups:[];
 const group=groups.find(g=>g&&g.id===groupId); if(!group)return;
 closeMiniMenus();
 const content=document.getElementById('tripModalContent'),modal=document.getElementById('tripModal'); if(!content||!modal)return;
 content.innerHTML=`<div class="trip-onepage trip-module-group"><p class="kicker">Trip</p><h2>${escapeTripHTML(group.icon||'📋')} ${escapeTripHTML(group.title||'Trip info')}</h2>${buildTripModuleGroupHTML(group)}${tripHubNavigationHTML('group:'+group.id)}</div>`;
 modal.classList.add('show'); const sheet=document.querySelector('#tripModal .trip-sheet'); if(sheet)sheet.scrollTop=0;
}

/* Engine 25.2.9 — trip-data-driven menu. Prevents NZ-only Rental Car/route labels
   from leaking into trips that do not have those modules. */
function renderTripMenuFromConfig(){
 const host=document.getElementById('tripMenu'); if(!host)return;
 const cards=PRODUCTION_TRIP&&PRODUCTION_TRIP.cards||{};
 const cfg=TRIP_CONFIG.tripModules||{};
 const enabled=(key,fallback)=>Object.prototype.hasOwnProperty.call(cfg,key)?!!cfg[key]:fallback;
 const rows=[];
 const push=(action,icon,title,sub,href)=>rows.push(`<a href="${href||'#'}"${action?` onclick="${action};return false;"`:''}><span><span class="menu-title">${icon} ${title}</span>${sub?`<span class="menu-sub">${sub}</span>`:''}</span><span>›</span></a>`);
 if(cards.flights)push("openTripCard('flights')",'✈️','Flights','Flight details');
 if(enabled('stay',!!getAccommodationBookings().length))push("openTripCard('stay')",'🏨','Stay','Accommodation');
 if(getBookingsByCategory('restaurants').length)push("openBookingCategoryCard('Restaurants')",'🍽️','Restaurants','Restaurant bookings');
 if(getBookingsByCategory('spa').length)push("openBookingCategoryCard('Spa')",'💆','Spa','Spa bookings');
 const groupedModules=new Set();
 const groups=Array.isArray(TRIP_CONFIG.tripMenuGroups)?TRIP_CONFIG.tripMenuGroups:[];
 groups.forEach(group=>{
   const modules=Array.isArray(group&&group.modules)?group.modules:[];
   const hasActivity=modules.includes('activities')&&enabled('activities',!!getActivityBookings().length)&&getActivityBookings().length;
   const hasTransport=modules.includes('transport')&&enabled('transport',!!getTransportBookings().length)&&getTransportBookings().length;
   if(hasActivity||hasTransport){push(`openTripModuleGroup('${group.id}')`,group.icon||'📋',group.title||'Trip info',group.sub||'');modules.forEach(m=>groupedModules.add(m));}
 });
 if(!groupedModules.has('activities')&&enabled('activities',!!getActivityBookings().length))push("openTripCard('activities')",'🎟️','Activities','Activity bookings');
 if(!groupedModules.has('transport')&&enabled('transport',!!getTransportBookings().length))push("openTripCard('transport')",'🚐','Transport','Booked transport');
 if(enabled('rentalCar',!!cards.vehicle)&&cards.vehicle)push("openTripCard('vehicle')",'🚙','Rental Car','Vehicle details');
 host.innerHTML=rows.join('');
}
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderTripMenuFromConfig);
 else renderTripMenuFromConfig();
}
