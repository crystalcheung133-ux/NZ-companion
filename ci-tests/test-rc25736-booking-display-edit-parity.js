const fs=require('fs');
const s=fs.readFileSync('trip-runtime.js','utf8');
function ok(x,m){if(!x)throw new Error(m)}
// RC25.7.38 supersedes the original one-field-per-display rule: structured fields remain
// editable, while note-like legacy fields are intentionally consolidated into one Notes field.
const required=['guestSummary','nights','chargeDate','depositAmount','depositCurrency','depositAUD','depositPaid','balanceDue','discountLabel','discountAmount','cashbackAmount','netTotalAUD','address','website','phone','email','cancellation','notes','time','dayId','adultPrice','childPrice','familyBreakdownText','vehicle','provider','pickupDateTime','returnDateTime','pickupDepotAddress','returnDepotAddress','pickupNavigationDestination','returnNavigationDestination','pickupInstructionsText','shuttleCollectionAddress'];
for(const name of required)ok(s.includes("'"+name+"'"),'Missing structured editable field: '+name);
ok(s.includes("bookingField('Notes / important information','notes'"),'Consolidated Notes editor missing');
for(const old of ["bookingField('Parking','parking'","bookingField('Arrival instructions','checkInInstructions'","bookingField('FX note','fxNote'","bookingField('Booking method note','bookingMethod'"])ok(!s.includes(old),'Legacy note-like field should be consolidated: '+old);
ok(s.includes("bookingField('Cancellation','cancellation'"),'Cancellation remains independently structured');
ok(s.includes('next.familyBreakdown=')&&s.includes('next.pickupInstructions='),'Structured displayed fields must round-trip through editor');
console.log('RC25.7.36/38 booking display/edit parity PASS');
