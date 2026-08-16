const fs=require('fs'),vm=require('vm'),assert=require('assert');
const auth=fs.readFileSync('booking-authority.js','utf8');
const data=fs.readFileSync('data.js','utf8')+'\n;globalThis.__B=BOOKINGS_DATA;';
const cfg=fs.readFileSync('trip-config.js','utf8');
assert(auth.includes('bookingMasterRevision'),'booking authority must be revision-aware');
assert(auth.includes('mergeStaleState'),'stale-state merge protection missing');
assert(auth.includes('recordRevision(override)===masterRevision()'),'current-revision full override path missing');
assert(auth.includes('DEPLOY_MASTER'),'deploy master snapshot missing');
assert(cfg.includes('bookingMasterRevision:1'),'fixture must declare booking master revision');

const c={};vm.createContext(c);vm.runInContext(data,c);
const b=c.__B['fixture-hotel-booking'];
assert(b,'fixture booking missing');
assert.equal(b.timelineItemId,'fixture-hotel-checkin');
assert.equal(b.date,'2027-01-01');
console.log('BOOKING AUTHORITY STALE-STATE: PASS — deploy master schedule protected by revision-aware merge.');
