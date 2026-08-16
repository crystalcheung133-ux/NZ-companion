const fs=require('fs'),vm=require('vm'),assert=require('assert');
const raw=fs.readFileSync('data.js','utf8');
const c={};vm.createContext(c);vm.runInContext(raw+'\n;globalThis.__X={P:PLACES,B:BOOKINGS_DATA,I:ITINERARY_DATA};',c);
const {P,B,I}=c.__X;
const ids=d=>Array.from(I[String(d)].items,x=>x.id);

// Booking → Timeline exact ownership.
for(const [id,b] of Object.entries(B)){
  if(!b.timelineItemId)continue;
  assert(ids(b.day).includes(b.timelineItemId),`${id}: timeline anchor ${b.timelineItemId} not on assigned Day ${b.day}`);
  const expectedDate={1:'2026-10-30',2:'2026-10-31',3:'2026-11-01',4:'2026-11-02',5:'2026-11-03'}[b.day];
  assert.equal(b.date,expectedDate,`${id}: booking date/day mismatch`);
}

// D2 Fashion Guide ownership.
for(const id of ['com-tam-moc','garmentory','pizza4ps','moc-healing','lune'])
  assert(String(P[id].sub||'').includes('Day 2'),`${id}: Guide did not move to Day 2`);

// D4 Slow Lifestyle Guide ownership.
for(const id of ['running-bean','push-push','bakes','moc-huong','mojo-spa','thao-dien-spa','golden-lotus-thao-dien','ohquao','louh'])
  assert((String(P[id].sub||'')+' '+String(P[id].shoppingRoute||'')).includes('Day 4'),`${id}: Guide did not move to Day 4`);

assert(!B['bk-little-bear'],'Little Bear booking survived Monday closure');
assert(!ids(4).includes('little-bear'),'Little Bear Timeline stop survived Monday closure');
assert.deepEqual(ids(4),['running-bean','pink-church','push-push','thao-dien-open-list'],'D4 must have only morning anchors + one open list');
assert(String(P['little-bear'].sub).includes('Closed Monday'),'Little Bear Guide must explain why it is not D4 dinner');
assert(!B['bk-moc-huong'],'Mộc Hương must be an option, not a pending D4 booking');

const sd=fs.readFileSync('shopping-directory-data.js','utf8');
assert(sd.includes('Day 2 · Nguyễn Trãi shopping'),'Directory Fashion route did not move to D2');
assert(sd.includes('Day 4 · Thảo Điền Lifestyle Walk'),'Directory Thảo Điền route did not move to D4');

console.log('CROSS-SURFACE DAY CONSISTENCY: PASS — Timeline / Booking / Guide / Shopping Directory agree.');
