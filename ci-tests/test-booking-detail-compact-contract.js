const fs=require('fs'),vm=require('vm'),assert=require('assert');

const data=fs.readFileSync('data.js','utf8')+'\n;globalThis.__B=BOOKINGS_DATA;globalThis.__I=ITINERARY_DATA;';
const c={console};vm.createContext(c);vm.runInContext(data,c);
const B=c.__B,I=c.__I;
const trip=fs.readFileSync('trip-runtime.js','utf8');

// ---- DATA CHANNEL POLICY ----
// A booking is operationally usable with website OR email OR explicitly verified WhatsApp.
// Phone/Zalo alone never satisfy the contract.
for(const [id,b] of Object.entries(B)){
  const usable=String(b.bookingUrl||'').trim()||String(b.email||'').trim()||String(b.whatsapp||'').trim();
  assert(usable,id+': requires website/email/verified WhatsApp');
  if(/\bonline\b|website|klook/i.test(String(b.bookingMethod||'')))
    assert(String(b.bookingUrl||'').trim(),id+': online/website method requires bookingUrl');
  if(/whatsapp/i.test(String(b.bookingMethod||'')))
    assert(String(b.whatsapp||'').trim(),id+': WhatsApp method requires explicit verified whatsapp field');
  if(b.timelineItemId){
    const day=String(b.day||String(b.dayId||'').replace(/\D/g,''));
    assert((I[day]?.items||[]).some(x=>x.id===b.timelineItemId),id+': Timeline anchor drift');
  }
}

// ---- GENERIC BOOKING UI ALLOW-LIST ----
const generic=(trip.match(/function buildGenericBookingDetailHTML\(booking\)\{[\s\S]*?\n\}/)||[''])[0];
const actions=(trip.match(/function bookingActionButtonsHTML\(booking,place,options=\{\}\)\{[\s\S]*?\n\}/)||[''])[0];
assert(generic&&actions,'generic Booking renderer missing');

// Fact labels: only this operational set may be rendered for generic bookings.
// bookingReferenceLabel(booking) is the one intentional dynamic label.
const allowedFacts=new Set(['Status','Day','Date','Time','Booked under','Booking method','WhatsApp','Email']);
const factBlock=(generic.match(/bookingFactGridHTML\(\[([\s\S]*?)\]\)/)||[])[1]||'';
const factLabels=[...factBlock.matchAll(/\['([^']+)'/g)].map(m=>m[1]);
for(const label of factLabels) assert(allowedFacts.has(label),'Generic Booking added unapproved fact: '+label);
assert(generic.includes('[bookingReferenceLabel(booking),booking.reference'), 'booking reference fact missing');

// Sections: Payment may be injected through accommodationPaymentHTML; only these text sections are legal.
const allowedSections=new Set(['Address','Notes','Cancellation']);
const sectionLabels=[...generic.matchAll(/bookingSectionHTML\('([^']+)'/g)].map(m=>m[1]);
for(const label of sectionLabels) assert(allowedSections.has(label),'Generic Booking added unapproved section: '+label);

// Actions: Timeline + actual booking channel only. Anything else is a product-contract change.
assert(actions.includes('bookingDayButtonHTML(booking)'),'Timeline action missing');
for(const required of ['trip-action-btn--book','trip-action-btn--whatsapp','trip-action-btn--email'])
  assert(actions.includes(required),'Booking action channel missing: '+required);
for(const forbidden of ['bookingGuideButtonHTML','bookingEditButtonHTML','Navigate</a>','Copy Address','trip-action-btn--call'])
  assert(!actions.includes(forbidden),'Generic Booking action outside allow-list: '+forbidden);
assert(!generic.includes('How to book / handoff')&&!trip.includes("bookingSectionHTML('How to book / handoff'"),
  'HOW TO BOOK / HANDOFF paragraph is outside Booking allow-list');

// Compact expense rule.
assert(trip.includes('booking-expense-buttons--compact'),'Expense linkage must stay compact');
assert(trip.includes("if(!hasPayment)return ''"),'Untouched pending bookings must not render expense panel');

// High-risk regression that has recurred before: Omakase canonical payment/name truth.
const tiger=B['bk-omakase-tiger'];
assert.equal(tiger.bookingName,'Crystal Cheung');
assert.equal(tiger.bookingMethod,'WhatsApp');
assert.equal(tiger.whatsapp,'+84 93 201 4124');
assert.equal(tiger.depositPaid,'Paid');
assert.equal(tiger.depositAmount,'2000000');
assert.equal(tiger.depositCurrency,'VND');
assert.equal(tiger.depositAUD,'AUD 112');
assert.notEqual(typeof tiger.depositPaid,'boolean');

console.log('BOOKING SURFACE ALLOW-LIST: PASS — compact legal surface + usable channels + Omakase regression guard.');
