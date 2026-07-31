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
let activeBookingDetail=null;
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
function bookingStatusText(booking){
  return String((booking&&((booking.displayStatus||booking.status)))||'').replace(/-/g,' ').toUpperCase();
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
function bookingGuideButtonHTML(booking){
  return booking&&booking.placeId?`<button class="pill trip-action-btn trip-action-btn--guide" type="button" onclick="NAVIGATION.goPage('place',{query:{placeId:'${escapeTripHTML(booking.placeId)}'}})">Guide</button>`:'';
}
function bookingDayButtonHTML(booking){
  const dayNumber=bookingDayNumber(booking);if(!dayNumber)return '';
  const anchor=booking.timelineItemId?`#${escapeTripHTML(booking.timelineItemId)}`:'';
  return `<a class="pill trip-action-btn trip-action-btn--day" href="day.html?day=${escapeTripHTML(dayNumber)}${anchor}">Day ${escapeTripHTML(dayNumber)} Timeline</a>`;
}
function bookingActionButtonsHTML(booking,place){
  const address=bookingAddress(booking,place);
  const phone=(booking&&booking.phone)||(place&&place.phone)||'';
  const email=(booking&&booking.email)||(place&&place.email)||'';
  const website=(booking&&booking.website)||(place&&place.website)||'';
  const buttons=[
    bookingGuideButtonHTML(booking),bookingDayButtonHTML(booking),
    address?`<a class="pill trip-action-btn" href="${escapeTripHTML(accommodationMapURL(address))}" target="_blank" rel="noopener">Navigate</a>`:'',
    address?`<button class="pill trip-action-btn" type="button" onclick="navigator.clipboard&&navigator.clipboard.writeText(${JSON.stringify(address).replace(/"/g,'&quot;')})">Copy Address</button>`:'',
    phone?`<a class="pill trip-action-btn trip-action-btn--contact" href="tel:${escapeTripHTML(String(phone).replace(/\s/g,''))}">Call</a>`:'',
    email?`<a class="pill trip-action-btn trip-action-btn--contact" href="mailto:${escapeTripHTML(email)}">Email</a>`:'',
    website?`<a class="pill trip-action-btn trip-action-btn--contact" href="${escapeTripHTML(website)}" target="_blank" rel="noopener">Website</a>`:'',
    bookingEditButtonHTML(booking)
  ].filter(Boolean);
  return buttons.length?`<div class="trip-action-row">${buttons.join('')}</div>`:'';
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
  const arrival=[booking.checkIn?`Check-in · ${booking.checkIn}`:'',booking.checkOut?`Check-out · ${booking.checkOut}`:''].filter(Boolean).join('\n');
  const reference=[booking.bookingName?`Booked under · ${booking.bookingName}`:'',booking.reference?`${bookingReferenceLabel(booking)} · ${booking.reference}`:''].filter(Boolean).join('\n');
  const payment=[booking.paymentStatus||'',booking.price||''].filter(Boolean).join('\n');
  const facts=bookingFactGridHTML([
    ['Status',bookingStatusText(booking)],['Stay',booking.stayDates||booking.date||''],
    ['Room',booking.roomType||''],['Arrival',arrival],
    ['Booking',reference],['Booked via',via],['Payment',payment]
  ]);
  const important=[booking.cancellation||'',booking.notes||''].filter(Boolean).join('\n');
  const sections=[
    bookingSectionHTML('Important information',important),bookingSectionHTML('Address',address),
    bookingSectionHTML('Arrival instructions',booking.checkInInstructions||''),bookingContactSectionsHTML(booking,place)
  ].join('');
  return `<article class="fact stay-booking accommodation-detail-card"><div class="accommodation-detail-head"><div><strong>${escapeTripHTML(booking.title)}</strong><span>${escapeTripHTML(booking.stayDates||booking.date||'')}</span></div>${nightsLabel?`<span class="accommodation-night-badge">${escapeTripHTML(nightsLabel)}</span>`:''}</div><div class="accommodation-facts">${facts}</div>${sections}${bookingActionButtonsHTML(booking,place)}${accommodationDetailNavigationHTML(booking.id)}</article>`;
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
  content.innerHTML=`<div class="trip-onepage trip-onepage-stay accommodation-onepage-detail"><button class="accommodation-back" type="button" onclick="openAccommodationList()">‹ All accommodation</button><p class="kicker">Trip · Accommodation</p><h2>${escapeTripHTML(booking?booking.title:'Accommodation')}</h2>${showSaved?'<p class="timestamp booking-save-success" role="status">Saved ✓</p>':''}${buildAccommodationDetailHTML(booking)}<p class="timestamp trip-build-summary">${tripSyncSummary()}</p></div>`;
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
  const place=bookingPlace(booking);
  const facts=bookingFactGridHTML([
    ['Status',bookingStatusText(booking)],['Day',bookingDayNumber(booking)?'Day '+bookingDayNumber(booking):''],['Date',booking.date||''],['Time',booking.time||''],
    ['Tour type',booking.tourType||''],['Guests',booking.guests?`${booking.guests} · ${booking.adults||0} adults · ${booking.children||0} children`:''],
    ['Booked under',booking.bookingName||''],[bookingReferenceLabel(booking),booking.reference||''],['Booked via',booking.bookingViaOther||booking.bookingWay||booking.platform||''],
    ['Payment',booking.paymentStatus||''],['Original total',booking.originalTotal||''],['Discount',booking.discount||''],['Balance due',booking.price||'']
  ]);
  const pickup=[booking.pickupNote||booking.pickupAddress||'',booking.dropOff||''].filter(Boolean).join('\n');
  const sections=[
    activityFamilyBreakdownHTML(booking),bookingSectionHTML('Pickup & drop-off',pickup),bookingSectionHTML('Lunch',booking.lunchStatus||''),
    bookingContactSectionsHTML(booking,place),bookingSectionHTML('Cancellation',booking.cancellation||''),bookingSectionHTML('Notes',booking.notes||'')
  ].join('');
  return `<article class="fact stay-booking accommodation-detail-card activity-booking-detail"><div class="accommodation-detail-head"><div><strong>${escapeTripHTML(booking.title)}</strong><span>${escapeTripHTML(booking.date||'')}</span></div><span class="accommodation-night-badge activity-confirmed-badge">${escapeTripHTML(bookingStatusText(booking))}</span></div><div class="accommodation-facts">${facts}</div>${sections}${bookingActionButtonsHTML(booking,place)}</article>`;
}
function openActivityBookingDetail(bookingId,bookingOverride,showSaved){
  activeBookingDetail={type:'activity',id:bookingId};
  closeMiniMenus();
  const booking=bookingOverride||getBookingById(bookingId);
  const content=document.getElementById('tripModalContent');const modal=document.getElementById('tripModal');if(!content||!modal)return;
  content.innerHTML=`<div class="trip-onepage accommodation-onepage-detail"><button class="accommodation-back" type="button" onclick="openTripCard('activities')">‹ All activities</button><p class="kicker">Trip · Activities</p><h2>${escapeTripHTML(booking?booking.title:'Activity Booking')}</h2>${showSaved?'<p class="timestamp booking-save-success" role="status">Saved ✓</p>':''}${buildActivityBookingDetailHTML(booking)}<p class="timestamp trip-build-summary">${tripSyncSummary()}</p></div>`;
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
  return booking&&window.isAdminMode&&window.isAdminMode()
    ?`<button class="pill trip-action-btn booking-edit-btn" type="button" onclick="openBookingEdit('${escapeTripHTML(booking.id)}')">Edit Booking</button>`:'';
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
    bookingField('Status','status',booking.status,{type:'select',choices:['pending','confirmed','backup-booked','monitoring','cancelled','waitlist','not required']}),
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
  if(!(window.isAdminMode&&window.isAdminMode()))return;
  const booking=getBookingById(bookingId);if(!booking)return;
  const content=document.getElementById('tripModalContent');const modal=document.getElementById('tripModal');if(!content||!modal)return;
  activeBookingDetail={type:booking.type,id:bookingId};
  content.innerHTML=`<div class="trip-onepage booking-edit-onepage"><button class="accommodation-back" type="button" onclick="requestBookingEditClose('${escapeTripHTML(bookingId)}')">‹ Booking details</button><p class="kicker">Trip Studio · Booking</p><h2>Edit ${escapeTripHTML(booking.title)}</h2><form id="bookingEditForm" class="booking-edit-form" novalidate onsubmit="return saveBookingEdit(event,'${escapeTripHTML(bookingId)}')"><div class="booking-edit-grid">${bookingEditFields(booking)}</div><div class="booking-edit-actions"><button class="pill" type="button" onclick="requestBookingEditClose('${escapeTripHTML(bookingId)}')">Cancel</button><button class="pill booking-edit-save" type="submit">Save Booking</button></div><p class="timestamp">Saving replaces the existing details for this booking ID. Guide and Timeline links are preserved.</p></form></div>`;
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
  if(booking.type==='activity')openActivityBookingDetail(bookingId,booking,showSaved);else openAccommodationDetail(bookingId,booking,showSaved);
}
function saveBookingEdit(event,bookingId){
  event.preventDefault();
  if(!(window.isAdminMode&&window.isAdminMode())){alert('Open Trip Studio before editing bookings.');return false;}
  const form=event.currentTarget;const current=getBookingById(bookingId);if(!current||!window.BOOKING_AUTHORITY){alert('Booking editor is not ready. Please close and reopen this booking.');return false;}
  const formData=new FormData(form);const next=Object.assign({},current);
  formData.forEach(function(value,key){next[key]=String(value).trim();});
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
document.addEventListener('travelengine:adminmodechange',function(){
  if(!activeBookingDetail)return;
  const modal=document.getElementById('tripModal');if(!modal||!modal.classList.contains('show'))return;
  returnToBookingDetail(activeBookingDetail.id);
});
document.addEventListener('DOMContentLoaded',reopenSavedBooking);

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
  if(sheet){ sheet.scrollTop=0; if(typeof window.applyNearFitModal==='function') window.applyNearFitModal(sheet,'trip-near-fit'); }
  if (key === 'checklist') setTimeout(loadChecklist, 0);
}

function closeTripModal() {
  if(isBookingEditActive() && !confirmDiscardBookingEdit()) return false;
  clearBookingEditSession();
  const modal = document.getElementById('tripModal');
  if (modal) modal.classList.remove('show');
  const guideModal=document.getElementById('guideModal');
  if(guideModal) guideModal.classList.remove('show');
  closeMiniMenus();
  document.body.classList.remove('admin-overlay-open');
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




