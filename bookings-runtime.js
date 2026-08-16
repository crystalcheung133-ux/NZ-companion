/* Travel Engine — generic Booking Centre. VN RC1.1 grouped layout. */
(function(root){
  'use strict';
  const CATEGORY_ORDER=['Accommodation','Restaurants','Spa','Activities','Transport'];
  const CATEGORY_META={
    Accommodation:{icon:'🏨',label:'Accommodation'}, Restaurants:{icon:'🍽️',label:'Restaurants'},
    Spa:{icon:'💆',label:'Spa'}, Activities:{icon:'🎟️',label:'Activities'}, Transport:{icon:'🚐',label:'Transport'}
  };
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function source(){
    const view=(root.GenerationSelectionAdapter&&GenerationSelectionAdapter.view)?GenerationSelectionAdapter.view('bookings'):null;
    const byId=view&&view.byId?view.byId:(root.BOOKINGS_DATA||{});
    return root.BOOKING_AUTHORITY?BOOKING_AUTHORITY.all(byId):Object.values(byId||{});
  }
  function status(b){return String(b&&b.status||'pending').toLowerCase()==='confirmed'?'confirmed':'pending';}
  function category(b){
    const explicit=String((b&&b.bookingCategory)||(b&&b.category)||'').trim().toLowerCase();
    if(explicit==='restaurant'||explicit==='restaurants')return 'Restaurants'; if(explicit==='spa')return 'Spa';
    if(explicit==='activity'||explicit==='activities'||explicit==='experience')return 'Activities'; if(explicit==='transport'||explicit==='transfer')return 'Transport';
    if(explicit==='accommodation'||explicit==='stay'||explicit==='hotel')return 'Accommodation';
    const type=String(b&&b.type||'').toLowerCase(); if(type==='accommodation')return 'Accommodation'; if(type==='restaurant')return 'Restaurants';
    if(type==='spa')return 'Spa'; if(type==='transport'||type==='rentalcar')return 'Transport'; return 'Activities';
  }

  function entityIcon(b){if(b&&b.emoji)return String(b.emoji);const t=String(b&&b.type||'').toLowerCase(),n=String(b&&b.title||'').toLowerCase(); if(t==='restaurant')return n.includes('omakase')?'🍣':n.includes('pizza')?'🍕':n.includes('lune')?'🥂':'🍽️'; if(t==='spa')return n.includes('suga')||n.includes('head')?'💆‍♀️':n.includes('wellness')?'🌿':'🧖‍♀️'; if(t==='transport')return n.includes('airport')?'✈️':'🚐'; if(t==='activity'||t==='experience')return n.includes('cooking')?'👩‍🍳':'🎟️'; return CATEGORY_META[category(b)]?.icon||'📌';}
  function rows(){return source().filter(Boolean).map(b=>Object.assign({},b,{_category:category(b),_status:status(b)})).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||''))||String(a.time||'').localeCompare(String(b.time||'')));}
  function summary(all){const confirmed=all.filter(x=>x._status==='confirmed').length;return `${confirmed} confirmed · ${all.length-confirmed} pending`;}
  function dayNumber(b){return String(b.dayId||b.day||'').replace('day','').replace(/\D/g,'');}
  function metaText(b){const parts=[]; if(b.date)parts.push(b.date); if(b.time)parts.push(b.time); return parts.join(' · ');}
  function paymentLines(b){
    const lines=[];
    if(b.totalAmount||b.price) lines.push(`<span><small>Total</small><strong>${esc(b.totalAmount||b.price)}</strong></span>`);
    if(b.cashbackAmount||b.cashback) lines.push(`<span><small>Cashback</small><strong>${esc(b.cashbackAmount||b.cashback)}</strong></span>`);
    if(b.netTotalAUD||b.netPrice) lines.push(`<span class="booking-card-net"><small>Net payment</small><strong>${esc(b.netTotalAUD||b.netPrice)}</strong></span>`);
    else if(b.depositPaid) lines.push(`<span><small>Deposit paid</small><strong>${esc(b.depositPaid)}</strong></span>`);
    return lines.length?`<div class="booking-card-payment">${lines.join('')}</div>`:'';
  }
  function card(b){
    const day=dayNumber(b), dayBadge=day?`<span class="booking-day-button">DAY ${esc(day)}</span>`:'', deep=`trip.html?bookingId=${encodeURIComponent(b.id)}`;
    return `<article class="booking-card ${b._status}"><div class="booking-card-row"><a class="booking-card-main" href="${esc(deep)}"><span>${day?`<small class="booking-day-label">DAY ${esc(day)}</small>`:''}<strong>${entityIcon(b)} ${esc(b.title||'Booking')}</strong><small>${esc(metaText(b))}</small>${paymentLines(b)}</span><span class="booking-status ${b._status}">${b._status==='confirmed'?'✓ Confirmed':'• Pending'}</span></a>${dayBadge}</div></article>`;
  }
  function group(key,items){const meta=CATEGORY_META[key];return `<section class="booking-category-section" data-booking-group="${esc(key)}"><header class="booking-category-heading"><h2>${meta.icon} ${esc(meta.label)}</h2><span>${items.length}</span></header><div class="booking-category-list">${items.map(card).join('')}</div></section>`;}
  function render(){
    const all=rows(); const sum=document.getElementById('bookingSummary'); if(sum)sum.textContent=summary(all);
    const host=document.getElementById('bookingList'); if(!host)return;
    const cats=CATEGORY_ORDER.filter(key=>all.some(x=>x._category===key));
    host.innerHTML=cats.length?cats.map(key=>group(key,all.filter(x=>x._category===key))).join(''):'<p class="timestamp">No bookings have been added yet.</p>';
  }
  root.addEventListener('DOMContentLoaded',render); root.addEventListener('travelengine:bookingchange',render);
})(globalThis);
