const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
function loadData(){const src=fs.readFileSync(path.join(ROOT,'data.js'),'utf8').replace(/const (PLACES|CATEGORIES|GUIDE_ORDER|DAY_LINKS|FRIENDS|BOOKINGS_DATA|TRIP_DATA|TRIP_ORDER|ITINERARY_DATA)=/g,'globalThis.$1=');const ctx={globalThis:{},console};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(src,ctx);return ctx;}
const d=loadData();
assert.equal(d.PLACES.scroggin.address,'71 Ardmore Street, Wānaka 9305, New Zealand');
const d4=d.ITINERARY_DATA['4'].items.find(x=>x.id==='wanaka-breakfast');assert.equal(d4.placeId,'scroggin');assert.deepEqual(Array.from(d4.guideIds),['scroggin','big-fig']);
const d3=d.ITINERARY_DATA['3'].items.find(x=>x.id==='astro-breakfast');for(const id of ['greedy-cow','federal-diner']) assert(d3.guideIds.includes(id));
assert(d.PLACES['queenstown-house'].title.includes('Tonic Lodge'));
const luxe=d.BOOKINGS_DATA['luxe-milford-booking'];assert(luxe.price.includes('2,749'));const total=luxe.familyBreakdown.reduce((s,x)=>s+Number(String(x.total).replace(/[^0-9.]/g,'')),0);assert.equal(total,2749);
for(const file of ['index.html','day.html','trip.html','guide.html','expenses.html','itinerary.html','moments.html','memory.html']){const h=fs.readFileSync(path.join(ROOT,file),'utf8');assert(!/<option[^>]+value="(?:lee|fowlers|yau)"/.test(h),file+' has static party options');assert(!/class="family-choice[^>]*data-family="(?:lee|fowlers|yau)"/.test(h),file+' has static family choices');}
for(const file of ['admin.js','complete-runtime.js','export-runtime.js']){const s=fs.readFileSync(path.join(ROOT,file),'utf8');assert(!s.includes("||'260922'"));assert(!s.includes("||'lee'"));}
const calc=require(path.join(ROOT,'expense-calculator.js'));assert.equal(calc.automaticRemainder(100,[30,20]),50);assert(calc.validateCustomAllocations(100,[{partyId:'a',amount:40},{partyId:'b',amount:60}]).valid);const pos=calc.netSettlementPosition([{amount:90,payerPartyId:'a',allocations:[{partyId:'a',amount:30},{partyId:'b',amount:30},{partyId:'c',amount:30}]}],['a','b','c']);assert(calc.validateBalance(pos).valid);
console.log('production-regression: PASS');
