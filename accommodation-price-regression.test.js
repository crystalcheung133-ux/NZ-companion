const fs=require('fs');
const vm=require('vm');
const source=fs.readFileSync('data.js','utf8');
const context={};
vm.createContext(context);
vm.runInContext(source+'\nthis.__DATA__={PLACES,BOOKINGS_DATA};',context);
const {PLACES,BOOKINGS_DATA}=context.__DATA__;
const stays=Object.values(BOOKINGS_DATA).filter(b=>b&&b.type==='accommodation'&&b.placeId);
let failures=[];
for(const booking of stays){
  const place=PLACES[booking.placeId];
  if(!place) failures.push(`${booking.id}: missing place ${booking.placeId}`);
  if(!String(booking.price||'').trim()) failures.push(`${booking.id}: missing canonical booking price`);
  if(place && /see trip info/i.test(String(place.price||''))) failures.push(`${booking.placeId}: unresolved Guide price placeholder`);
}
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log(`PASS accommodation price integrity: ${stays.length}/${stays.length}`);
