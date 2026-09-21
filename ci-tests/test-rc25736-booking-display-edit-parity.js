const fs=require('fs');
const s=fs.readFileSync('trip-runtime.js','utf8');
function ok(x,m){if(!x)throw new Error(m)}
// Superseded by RC25.7.39: only fields with functional/structured meaning stay independent.
const required=['nights','depositAmount','depositCurrency','depositAUD','depositPaid','balanceDue','discountAmount','cashbackAmount','netTotalAUD','address','website','phone','email','notes','dayId','adultPrice','childPrice','familyBreakdownText','vehicle','provider','pickupDateTime','returnDateTime','pickupDepotAddress','returnDepotAddress','pickupNavigationDestination','returnNavigationDestination','pickupInstructionsText','shuttleCollectionAddress'];
for(const name of required)ok(s.includes("'"+name+"'"),'Missing structured editable field: '+name);
for(const removed of ["bookingField('Guests / room occupancy','guestSummary'","bookingField('Charge date','chargeDate'","bookingField('Cancellation','cancellation'","bookingField('Time','time'","bookingField('Discount label','discountLabel'"])ok(!s.includes(removed),'RC25.7.39 redundant editor returned: '+removed);
ok(s.includes("bookingField('Notes / important information','notes'"),'Consolidated Notes editor missing');
ok(s.includes("bookingField('Discount / Cashback','cashbackAmount'"),'Discount / Cashback editor missing');
console.log('RC25.7.39 booking structured-field parity PASS');
