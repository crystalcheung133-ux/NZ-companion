const fs=require('fs'),vm=require('vm');
const src=fs.readFileSync('booking-authority.js','utf8');
const state={};
const base={b:{id:'b',type:'accommodation',title:'Base',parking:'NZD 28'}};
const ctx={console,BOOKINGS_DATA:JSON.parse(JSON.stringify(base)),CustomEvent:function(){},TRIP_CONFIG:{bookingMasterRevision:4},STORAGE_CONFIG:{keys:{bookingOverrides:'k'}},STORAGE:{local:{readJSON:(k,d)=>state[k]===undefined?d:JSON.parse(JSON.stringify(state[k])),writeJSON:(k,v)=>(state[k]=JSON.parse(JSON.stringify(v)),true),remove:k=>(delete state[k],true)}},globalThis:null};ctx.globalThis=ctx;
vm.createContext(ctx);vm.runInContext(src,ctx);
const fields={
 parking:'Valet Parking NZD35',nights:2,guestSummary:'4 guests',chargeDate:'2026-09-22',depositAUD:'AUD 20',discountLabel:'Promo',discountAmount:'AUD 10',fxNote:'Locked FX',officePhone:'+64 3 123',whatsapp:'+64 21 123',bookingMethod:'Official website',adultPrice:'NZD 100',childPrice:'NZD 50',familyBreakdown:[{label:'Family',composition:'2A2C',total:'NZD 300'}],vehicle:'ASX',provider:'Rental Cars 247',pickupDateTime:'22 Sep 17:30',returnDateTime:'1 Oct 17:00',pickupDepotAddress:'Pickup depot',returnDepotAddress:'Return depot',pickupNavigationDestination:'https://maps.example/pickup',returnNavigationDestination:'https://maps.example/return',pickupInstructions:['Call office','Wait at pickup'],shuttleCollectionAddress:'264 Russley Road'
};
let r=ctx.BOOKING_AUTHORITY.save('b',Object.assign({},ctx.BOOKING_AUTHORITY.get('b'),fields),ctx.BOOKINGS_DATA);if(!r.ok)throw Error('save failed');
for(const [k,v] of Object.entries(fields))if(JSON.stringify(ctx.BOOKING_AUTHORITY.get('b')[k])!==JSON.stringify(v))throw Error('local roundtrip failed: '+k);
const snapshot=ctx.BOOKING_AUTHORITY.read();ctx.BOOKING_AUTHORITY.clear();ctx.BOOKINGS_DATA=JSON.parse(JSON.stringify(base));ctx.BOOKING_AUTHORITY.replaceState(snapshot,ctx.BOOKINGS_DATA);
for(const [k,v] of Object.entries(fields))if(JSON.stringify(ctx.BOOKING_AUTHORITY.get('b')[k])!==JSON.stringify(v))throw Error('remote replacement roundtrip failed: '+k);
const allowed=new Set(ctx.BOOKING_AUTHORITY.editableStateFields);for(const k of Object.keys(fields))if(!allowed.has(k))throw Error('field missing from authority: '+k);
console.log('RC25.7.37 booking round-trip persistence PASS');
