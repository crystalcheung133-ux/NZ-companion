const fs=require('fs'),vm=require('vm'),assert=require('assert');
const data=fs.readFileSync('data.js','utf8')+'\n;globalThis.__I=ITINERARY_DATA;';
const c={};vm.createContext(c);vm.runInContext(data,c);
const I=c.__I;
const moments=fs.readFileSync('moments.js','utf8');

assert(moments.includes("const master=((typeof ITINERARY_DATA!=='undefined'&&ITINERARY_DATA)||{})[key]"));
assert(moments.includes('currentDayItems(momentSelectorDay).map'));

const m=moments.match(/MOMENT_PLANNED_ALLOWED_TYPES=new Set\(\[([\s\S]*?)\]\)/);
assert(m,'Moments Planned Activity allow-list missing');
const allowed=[...m[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
assert.deepEqual(allowed,['meal','experience','shoppingWindow','spa','openList','optional']);
assert(moments.includes('return MOMENT_PLANNED_ALLOWED_TYPES.has'),'Moments must enforce type allow-list');
assert(moments.includes('item.momentsEligible===true'),'explicit per-item opt-in escape hatch missing');
for(const type of ['money','transport','buffer','rest','stay'])
  assert(!allowed.includes(type),'logistics type illegally admitted to Moments: '+type);
assert.equal(I['2'].items[0].type,'openList','fixture must exercise openList semantics');
assert(!allowed.includes(I['1'].items.find(x=>x.id==='fixture-hotel-checkin').type),'rest/stay logistics must remain outside Moments allow-list');
console.log('MOMENTS ACTIVITY SEMANTICS: PASS — canonical projection + explicit type allow-list.');
