const fs=require('fs'),vm=require('vm'),assert=require('assert');
const context={console,globalThis:null};context.globalThis=context;vm.createContext(context);
for(const f of ['locale-config.js','asset-config.js','theme-config.js','engine-integrity.js','trip-config.js','data.js'])
  vm.runInContext(fs.readFileSync(f,'utf8'),context,{filename:f});
const a=context.TRAVEL_ENGINE_ACCEPTANCE;
assert(a&&a.valid===true,'NZ production data must pass TravelEngineIntegrity');
assert.strictEqual(a.blockingErrorCount,0,'NZ production data has blocking integrity errors');
assert.strictEqual(a.warningCount,0,'NZ production data must migrate with zero integrity warnings');

const admin=fs.readFileSync('admin.js','utf8');
const booking=fs.readFileSync('booking-authority.js','utf8');
const trip=fs.readFileSync('trip-runtime.js','utf8');
const guide=fs.readFileSync('guide-runtime.js','utf8');
const moments=fs.readFileSync('moments.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
const cfg=fs.readFileSync('trip-config.js','utf8');

assert(admin.includes('getTripStudioModal'),'25.6 dedicated Studio shell missing');
assert(css.includes('#tripStudioModal{'),'25.6 Studio shell CSS missing');
assert(cfg.includes('bookingMasterRevision: 1'),'booking master revision missing');
assert(booking.includes('bookingMasterRevision'),'revision-aware Booking Authority missing');
assert(moments.includes('MOMENT_PLANNED_ALLOWED_TYPES'),'Moments activity semantics missing');
assert(guide.includes("window.GUIDE_MODAL_ORIGIN='timeline'"),'Timeline Guide origin tracking missing');
assert(trip.includes("window.GUIDE_MODAL_ORIGIN=null"),'Booking return-to-origin cleanup missing');
assert(trip.includes('trip-action-row--booking-compact'),'compact Booking legal surface missing');
const actionStart=trip.indexOf('function bookingActionButtonsHTML');
const actionEnd=trip.indexOf('function bookingContactSectionsHTML',actionStart);
const legalSurface=trip.slice(actionStart,actionEnd);
for(const forbidden of ['trip-action-btn--guide','Copy Address','>Navigate<'])
  assert(!legalSurface.includes(forbidden),'legacy generic Booking action resurrected in legal surface: '+forbidden);

console.log('NZ ENGINE 25.6 MIGRATION: PASS — production integrity + canonical architecture contracts.');
