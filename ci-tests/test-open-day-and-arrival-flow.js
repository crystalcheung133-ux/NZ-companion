const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};vm.createContext(c);
vm.runInContext(fs.readFileSync('data.js','utf8')+'\n;globalThis.__X={I:ITINERARY_DATA,B:BOOKINGS_DATA,L:DAY_LINKS};',c);
const {I,B,L}=c.__X;
const ids=d=>Array.from(I[String(d)].items,x=>x.id);

// D1: arrival/currency -> Phở SOL -> Old Saigon -> optional Ivoire -> hotel reset -> Cafe Apartments -> 17:30 sunset Omakase.
assert.deepEqual(ids(1).slice(3,9),['pho-sol','post-office','ivoire','day1-hotel-reset','nha-suga','omakase-tiger']);
const cafe=I['1'].items.find(x=>x.id==='nha-suga');
assert(cafe.title.includes('Cafe Apartments')&&cafe.title.includes('Headspa'));
assert(cafe.time.includes('17:00'));
assert(cafe.route.includes('17:00')&&cafe.route.includes('Omakase Tiger'));
assert(I['1'].items.find(x=>x.id==='omakase-tiger').title.includes('First Seating'));
assert(!ids(1).includes('cafe-apartments'),'mandatory post-dinner Cafe Apartments revisit should be removed');

// D4: only morning anchors + one open list; no fixed food/spa/farewell schedule.
assert.equal(I['4'].heading,'Thảo Điền Open Day');
assert.deepEqual(ids(4),['running-bean','pink-church','push-push','thao-dien-open-list']);
const open=I['4'].items[3];
assert.equal(open.type,'openList');
assert(open.details.some(x=>x.includes('不設固定 lunch')));
assert(open.details.some(x=>x.includes('Walk-in Picks')&&x.includes('Mộc Hương')&&x.includes('Mojo')));
assert(open.details.some(x=>x.includes('蛋糕')));
assert(!B['bk-moc-huong'],'optional D4 spa must not appear as pending booking');
for(const id of ['moc-huong','mojo-spa','thao-dien-spa','golden-lotus-thao-dien'])
  assert(open.guideIds.includes(id),id+' missing from D4 spa Open List');

assert(!B['bk-little-bear'],'closed-Monday dinner must not appear as pending booking');

for(const key of ['ohquao','saigon-concept','louh','bakes','moc-huong']){
  assert(L[key]&&L[key][0][0]==='Day 4',key+' Guide day label drift');
  assert(L[key][0][1]==='day.html?day=4#thao-dien-open-list',key+' Guide must resolve to Open List');
}
console.log('OPEN DAY + ARRIVAL FLOW: PASS');
