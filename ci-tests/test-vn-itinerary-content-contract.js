const fs=require('fs'),vm=require('vm'),assert=require('assert');
const raw=fs.readFileSync('data.js','utf8');const c={};vm.createContext(c);vm.runInContext(raw+'\n;globalThis.__x={CATEGORIES,PLACES,BOOKINGS_DATA,ITINERARY_DATA,DAY_LINKS};',c);const {CATEGORIES,PLACES,BOOKINGS_DATA:B,ITINERARY_DATA:I}=c.__x;
assert(!Object.prototype.hasOwnProperty.call(CATEGORIES,'EXPERIENCE'),'empty EXPERIENCE category reintroduced');
for(const k of ['cooking','moc-kim','tinh-thuc','quince'])assert(!PLACES[k],`retired Guide reintroduced: ${k}`);
for(const k of ['bk-cooking','bk-moc-kim','bk-tinh-thuc','bk-quince'])assert(!B[k],`retired booking reintroduced: ${k}`);
assert.equal(I['2'].heading,'Fashion Day');assert.equal(I['4'].heading,'Thảo Điền Open Day');
for(const [id,day,event,emoji] of [['bk-moc-healing',2,'moc-healing','🦶'],['bk-nara',3,'nara-spa','🫧']]){assert.equal(B[id].day,day);assert.equal(B[id].timelineItemId,event);assert.equal(B[id].emoji,emoji);assert(B[id].notes.length>45);}
assert(B['bk-man-moi']&&B['bk-man-moi'].day===3&&B['bk-man-moi'].timelineItemId==='man-moi');
assert(I['2'].items.find(x=>x.id==='pizza4ps').route.includes('Mộc Healing'));
assert(I['4'].items.find(x=>x.id==='thao-dien-open-list').showShoppingDirectory===true);
for(const leak of ['不用樂觀早回時間重排','不逐店打卡，不為店名叫 Grab','planning anchor'])assert(!raw.includes(leak),`planning instruction leaked: ${leak}`);
const gd=fs.readFileSync('guide-runtime.js','utf8');assert(gd.includes('Morning · 11 Garmentory + Trần Quang Diệu'));assert(gd.includes('Afternoon · Nguyễn Trãi + nearby fashion'));
console.log('VN ITINERARY / CONTENT CONTRACT: PASS');
