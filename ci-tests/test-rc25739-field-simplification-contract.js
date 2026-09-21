const fs=require('fs');
function must(x,m){if(!x)throw new Error(m)}
const s=fs.readFileSync('trip-runtime.js','utf8');
for(const old of ["bookingField('Guests / room occupancy','guestSummary'","bookingField('Time','time'","bookingField('Charge date','chargeDate'","bookingField('Cancellation','cancellation'","bookingField('Discount label','discountLabel'"]) must(!s.includes(old),'redundant editor still present: '+old);
must(s.includes("bookingField('Related day','dayId'"),'Related day relationship must remain');
must(s.includes("bookingField('Notes / important information','notes'"),'Notes editor missing');
must(s.includes("add('Cancellation',booking&&booking.cancellation)"),'legacy cancellation is not migrated/surfaced in Notes');
must(s.includes("'fxNote','cancellation'"),'legacy cancellation is not cleared after Notes migration save');
must(s.includes("bookingField('Discount / Cashback','cashbackAmount'"),'combined Discount / Cashback field missing');
must(!s.includes("['Charge date',bookingHumanValue(booking.chargeDate"),'Charge date still displayed as structured payment fact');
console.log('RC25.7.39 field simplification contract PASS');
