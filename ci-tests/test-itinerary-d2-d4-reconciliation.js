const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('data.js','utf8')+'\n;globalThis.__I=ITINERARY_DATA;globalThis.__B=BOOKINGS_DATA;globalThis.__P=PLACES;';
const c={console};vm.createContext(c);vm.runInContext(src,c);
const I=c.__I,B=c.__B,P=c.__P;
const ids=d=>Array.from(I[String(d)].items,x=>x.id);

assert.equal(I['2'].heading,'Fashion Day');
assert.equal(I['2'].kicker,'Day 2 · 31 Oct • Saturday');
assert.deepEqual(ids(2),['com-tam-moc','garmentory','shopping-tqd','pizza4ps','moc-healing','shopping-nguyen-trai','hotel-reset','lune']);

assert.equal(I['4'].heading,'Thảo Điền Open Day');
assert.equal(I['4'].kicker,'Day 4 · 2 Nov • Monday');
assert.deepEqual(ids(4),['running-bean','pink-church','push-push','thao-dien-open-list']);
assert(!ids(4).includes('little-bear'),'Little Bear is closed Monday and must not be scheduled');

for(const [id,day,date,time,event] of [
 ['bk-pizza4ps',2,'2026-10-31','13:00','pizza4ps'],
 ['bk-moc-healing',2,'2026-10-31','14:20','moc-healing'],
 ['bk-lune',2,'2026-10-31','18:30','lune'],
]){
 assert(B[id],id+' missing');
 assert.equal(B[id].day,day,id+' day drift');
 assert.equal(B[id].date,date,id+' date drift');
 assert.equal(B[id].time,time,id+' time drift');
 assert.equal(B[id].timelineItemId,event,id+' timeline anchor drift');
 assert(ids(day).includes(event),id+' anchor does not exist on assigned day');
}
assert(!B['bk-little-bear']); assert(!B['bk-moc-huong'],'D4 open day must not carry a pending spa booking');

assert(I['2'].items.find(x=>x.id==='pizza4ps').route.includes('Mộc Healing'),'D2 lunch must walk to Mộc Healing');
assert(I['4'].items.find(x=>x.id==='thao-dien-open-list').type==='openList','D4 must collapse Thảo Điền into one open-list card');

const sd=fs.readFileSync('shopping-directory-data.js','utf8');
assert(sd.includes('Day 2 · Nguyễn Trãi'),'Shopping Directory must move Fashion route to D2');
assert(sd.includes('Day 4 · Thảo Điền'),'Shopping Directory must move Thảo Điền route to D4');
assert(!sd.includes('Pizza 4P’s Hai Bà Trưng'),'stale Pizza branch route survived');
console.log('D2/D4 CANONICAL RECONCILIATION: PASS');
