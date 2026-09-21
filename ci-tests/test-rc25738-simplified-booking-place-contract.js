const fs=require('fs');
function must(ok,msg){if(!ok)throw new Error(msg);}
const trip=fs.readFileSync('trip-runtime.js','utf8');
const guide=fs.readFileSync('guide-runtime.js','utf8');
must(trip.includes("Notes / important information"),'simplified Notes field missing');
['Parking\',\'parking','Arrival instructions\',\'checkInInstructions','FX note\',\'fxNote','Booking method note\',\'bookingMethod'].forEach(x=>must(!trip.includes("bookingField('"+x),'legacy specific editor still exposed: '+x));
must(trip.includes("bookingField('Address','address'"),'Booking Address editor missing');
must(trip.includes("bookingField('Website','website'"),'Booking Website editor missing');
must(trip.includes("bookingField('Phone','phone'"),'Booking Phone editor missing');
must(trip.includes("['parking','checkInInstructions','bookingMethod','fxNote']"),'legacy consolidation clear contract missing');
must(guide.includes('function guideResolvedPlace(key)'),'Guide shared-place resolver missing');
['address','phone','website'].forEach(f=>must(guide.includes("['address','phone','website']"),'shared place field overlay missing'));
must(guide.includes('BOOKING_AUTHORITY.byPlace(key)'),'Guide does not resolve linked Booking place facts');
console.log('RC25.7.38 simplified Booking + shared Place contract PASS');
