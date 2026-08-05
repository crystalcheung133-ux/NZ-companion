#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'data.js'),'utf8');
const trip=fs.readFileSync(path.join(root,'trip-runtime.js'),'utf8');
const guide=fs.readFileSync(path.join(root,'guide-runtime.js'),'utf8');
const context={};vm.createContext(context);
vm.runInContext(source+'\n;globalThis.__release={PLACES,CATEGORIES,BOOKINGS_DATA};',context);
const {PLACES,CATEGORIES,BOOKINGS_DATA}=context.__release;
const failures=[];const assert=(value,message)=>{if(!value)failures.push(message);};
const activeGuideIds=new Set(Object.values(CATEGORIES).flat().map(item=>typeof item==='string'?item:item&&item.key).filter(Boolean));
const matched=Object.values(BOOKINGS_DATA).filter(booking=>booking.placeId&&activeGuideIds.has(booking.placeId));
const expected=['archway-booking','edgewater-booking','lakefront-booking','luxe-milford-booking','peppers-booking','queenstown-booking','southwark-booking'];
assert(JSON.stringify(matched.map(x=>x.id).sort())===JSON.stringify(expected),'Active Guide/Booking relationship set changed unexpectedly.');
for(const booking of matched){
  assert(PLACES[booking.placeId],`${booking.id} points to missing Guide place ${booking.placeId}.`);
  assert(Object.values(BOOKINGS_DATA).filter(x=>x.placeId===booking.placeId).length===1,`${booking.placeId} does not resolve to exactly one booking.`);
}
assert(trip.includes("GUIDE_NAVIGATION.categoryFor(booking.placeId)"),'Booking → Guide is not gated by active Guide membership.');
assert(trip.includes('href="${escapeTripHTML(NAVIGATION.build(\'place\''),'Booking → Guide does not use a native stable-ID URL.');
assert(trip.includes('booking-deep-link-target')&&trip.includes("target.focus({preventScroll:true})"),'Exact booking focus contract is missing.');
assert(trip.includes("history.replaceState(null,'',NAVIGATION.build('trip'))"),'Invalid booking target is not safely cleared.');
assert(guide.includes('guide-deep-link-target')&&guide.includes('data-place-id'),'Exact Guide focus contract is missing.');
assert(trip.includes("['Check-in / out',arrivalHTML,{html:true}]")&&trip.includes('aria-label="Check-in'),'Compact visible timing lacks accessible semantics.');
assert(!trip.includes('Booked under ·')&&!trip.includes('Booking reference ·'),'Accommodation booking labels remain duplicated inside BOOKING.');
if(failures.length){console.error('RC24.7.1 CORRECTIVE CONTRACT: FAILED');failures.forEach(x=>console.error('- '+x));process.exit(1);}
console.log(`RC24.7.1 CORRECTIVE CONTRACT: PASS — ${matched.length} active stable-ID Guide/Booking relationships verified.`);
