#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'data.js'),'utf8');
const trip=fs.readFileSync(path.join(root,'trip-runtime.js'),'utf8');
const guide=fs.readFileSync(path.join(root,'guide-runtime.js'),'utf8');
const adapter=fs.readFileSync(path.join(root,'generation-selection-adapter.js'),'utf8');
const context={};vm.createContext(context);
vm.runInContext(source+'\n;globalThis.__release={PLACES,CATEGORIES,GUIDE_ORDER,DAY_LINKS,BOOKINGS_DATA,ITINERARY_DATA};',context);
const {PLACES,CATEGORIES,GUIDE_ORDER,DAY_LINKS,BOOKINGS_DATA,ITINERARY_DATA}=context.__release;
const failures=[];const assert=(value,message)=>{if(!value)failures.push(message);};
const expected={
  'southwark-booking':'southwark','peppers-booking':'peppers','edgewater-booking':'edgewater',
  'sudima-booking':'sudima-five-mile','queenstown-booking':'queenstown-house','lakefront-booking':'lakefront-lodge'
};
const stayIds=(CATEGORIES.STAY||[]).map(item=>typeof item==='string'?item:item.key).sort();
const accommodationBookings=Object.values(BOOKINGS_DATA).filter(item=>item.type==='accommodation');
assert(JSON.stringify(stayIds)===JSON.stringify(Object.values(expected).sort()),'Guide STAY set is not the six active accommodations.');
assert(JSON.stringify(accommodationBookings.map(x=>x.id).sort())===JSON.stringify(Object.keys(expected).sort()),'Booking set is not the six active accommodations.');
for(const [bookingId,placeId] of Object.entries(expected)){
  const booking=BOOKINGS_DATA[bookingId];
  assert(booking&&booking.placeId===placeId,`${bookingId}: Booking link FAIL.`);
  assert(PLACES[placeId]&&stayIds.includes(placeId)&&GUIDE_ORDER.includes(placeId),`${bookingId}: Guide link FAIL.`);
  assert((DAY_LINKS[placeId]||[]).length>0,`${bookingId}: Guide day link FAIL.`);
  const items=Object.values(ITINERARY_DATA).flatMap(day=>day.items||[]);
  assert(items.some(item=>item.bookingId===bookingId),`${bookingId}: Timeline FAIL.`);
  const drives=Object.values(ITINERARY_DATA).map(day=>JSON.stringify(day.drive||{}));
  const routeNeedle={southwark:'Southwark',peppers:'Peppers',edgewater:'Edgewater','sudima-five-mile':'Sudima','queenstown-house':'Windsor','lakefront-lodge':'Lakefront'}[placeId];
  assert(drives.some(text=>text.includes(routeNeedle)),`${bookingId}: Driving Route FAIL.`);
  const nextNeedle={southwark:'Southwark',peppers:'Peppers',edgewater:'Edgewater','sudima-five-mile':'Sudima','queenstown-house':'Windsor Lodge','lakefront-lodge':'Lakefront Lodge'}[placeId];
  assert(items.some(item=>String(item.route||'').includes(nextNeedle)),`${bookingId}: Next Leg FAIL.`);
}
assert(!/archway/i.test(JSON.stringify({PLACES,CATEGORIES,GUIDE_ORDER,DAY_LINKS,BOOKINGS_DATA,ITINERARY_DATA})),'Archway remains in active trip data.');
const southwark=BOOKINGS_DATA['southwark-booking'];
assert(southwark.platform==='Expedia'&&southwark.paymentStatus!=='Not supplied','Southwark Expedia/payment regression remains.');
assert(southwark.cashback==='AUD 28.98'&&southwark.parking==='Confirmed · NZD 15 · pay at hotel','Southwark cashback/parking regression remains.');
assert(southwark.checkIn==='2:00 PM'&&southwark.checkOut==='10:00 AM','Southwark check-in/out regression remains.');
const southwarkGuide=PLACES.southwark;
for(const line of ['STAY · 2:00 PM → 10:00 AM','PARKING · Confirmed · NZD 15 · pay at hotel','NEARBY · C1 · 6 min walk','NEARBY · Riverside · 14 min walk','NEARBY · PAK’nSAVE Moorhouse · ~5 min drive'])assert((southwarkGuide.signature||[]).includes(line),`Southwark Guide line missing: ${line}`);
assert(guide.includes('function guideCoreSections')&&guide.includes('${coreSections}')&&guide.includes('${quickInfoInnerHTML(g,key)}'),'Standalone Guide pages omit accommodation practical content.');
assert(trip.includes("join(' → ')")&&!trip.includes('`Check-in · ${booking.checkIn}`'),'Shared booking timing is duplicated.');
assert(accommodationBookings.every(item=>!/^(?:Proposed )?\d{1,2}[^A-Za-z]{0,2}[A-Za-z]{3}.*(?:confirmed|booking|rooms?)/i.test(item.notes||'')),'Booking notes duplicate visit dates/status/room data.');
assert(adapter.includes('export:{')&&adapter.includes('itinerary:clone(days)')&&adapter.includes('bookings:{byId:clone(bookings)'), 'Canonical export projection contract is missing.');
if(failures.length){console.error('RC24.7.2 REGRESSION CONTRACT: FAILED');failures.forEach(x=>console.error('- '+x));process.exit(1);}
console.log('RC24.7.2 REGRESSION CONTRACT: PASS — six accommodations are consistent; Archway is removed.');
