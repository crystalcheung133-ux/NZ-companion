const fs=require('fs');
const s=fs.readFileSync('trip-runtime.js','utf8');
function ok(x,m){if(!x)throw new Error(m)}
const required=['parking','guestSummary','nights','checkInInstructions','chargeDate','depositAmount','depositCurrency','depositAUD','depositPaid','balanceDue','discountLabel','discountAmount','cashbackAmount','netTotalAUD','fxNote','address','website','phone','officePhone','email','whatsapp','cancellation','notes','time','dayId','bookingMethod','adultPrice','childPrice','familyBreakdownText','vehicle','provider','pickupDateTime','returnDateTime','pickupDepotAddress','returnDepotAddress','pickupNavigationDestination','returnNavigationDestination','pickupInstructionsText','shuttleCollectionAddress'];
for(const name of required)ok(s.includes("'"+name+"'"),'Missing editable field: '+name);
ok(s.includes("bookingField('Parking','parking',booking.parking"),'Displayed accommodation Parking must be editable');
ok(s.includes("bookingField('Arrival instructions','checkInInstructions'"),'Arrival instructions must remain editable');
ok(s.includes("bookingField('Cancellation','cancellation'")&&s.includes("bookingField('Notes','notes'"),'Cancellation and Notes must be independently editable');
ok(!s.includes("next.cancellation='';delete next.importantInfo"),'Save must not collapse cancellation into notes');
ok(s.includes("next.familyBreakdown=")&&s.includes("next.pickupInstructions="),'Structured displayed fields must round-trip through editor');
console.log('RC25.7.36 booking display/edit field parity PASS');
