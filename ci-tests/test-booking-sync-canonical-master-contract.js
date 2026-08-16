const fs=require('fs'),assert=require('assert');
const authority=fs.readFileSync('booking-authority.js','utf8');
const sync=fs.readFileSync('booking-sync-runtime.js','utf8');
const trip=fs.readFileSync('trip-runtime.js','utf8');
const data=fs.readFileSync('data.js','utf8');
assert(authority.includes('const DEPLOY_MASTER=clone(master()||{})'),'immutable deploy booking master missing');
assert(authority.includes('bookingMasterRevision'),'booking master revision contract missing');
assert(authority.includes('mergeStaleState'),'stale-state merge missing');
assert(authority.includes('recordRevision(override)===masterRevision()'),'current-revision override gate missing');
for(const field of ['status','bookingName','depositPaid','depositAmount','depositCurrency','paymentStatus','reference','bookingReference'])
  assert(authority.includes("'"+field+"'"),'stale reservation-state field missing: '+field);
for(const field of ['bookingMethod','bookingContact','secondaryContact','notes'])
  assert(!authority.match(new RegExp("EDITABLE_STATE_FIELDS=[\\s\\S]{0,900}'"+field+"'")),'stale revisions must not preserve old handoff field: '+field);
assert(sync.includes('BOOKING_AUTHORITY.deployMaster'),'remote sync must resolve against immutable deploy master');
assert(sync.includes('remoteRevision===currentRevision'),'remote revision gate missing');
assert(sync.includes('copy._masterRevision'),'outgoing remote payload must carry master revision');
assert(trip.includes("if(booking&&booking.emoji)return String(booking.emoji)"),'Trip Booking must respect booking emoji');
for(const x of [
 '"title": "Pizza 4P’s Bến Thành"',
 '"time": "13:00"',
 '"time": "14:20"',
 '"emoji": "🥂"',
 '"emoji": "🍲"'
]) assert(data.includes(x),'master booking correction missing: '+x);
console.log('BOOKING SYNC CANONICAL MASTER CONTRACT: PASS');
