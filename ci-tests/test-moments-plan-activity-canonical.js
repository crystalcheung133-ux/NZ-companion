const fs=require('fs'),vm=require('vm'),assert=require('assert');

const data=fs.readFileSync('data.js','utf8')+'\n;globalThis.__I=ITINERARY_DATA;';
const c={};vm.createContext(c);vm.runInContext(data,c);
const I=c.__I;
const moments=fs.readFileSync('moments.js','utf8');

// Moments is a projection of canonical itinerary, never its own itinerary copy.
assert(moments.includes("const master=((typeof ITINERARY_DATA!=='undefined'&&ITINERARY_DATA)||{})[key]"));
assert(moments.includes('currentDayItems(momentSelectorDay).map'));

// Narrow legal space: new itinerary types are NOT plannable unless admitted here.
const m=moments.match(/MOMENT_PLANNED_ALLOWED_TYPES=new Set\(\[([\s\S]*?)\]\)/);
assert(m,'Moments Planned Activity allow-list missing');
const allowed=[...m[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);
assert.deepEqual(allowed,['meal','experience','shoppingWindow','spa','openList','optional']);
assert(moments.includes('return MOMENT_PLANNED_ALLOWED_TYPES.has'),'Moments must enforce type allow-list');
assert(moments.includes('item.momentsEligible===true'),'explicit per-item opt-in escape hatch missing');

// Prove current logistics cannot enter via normal type policy.
for(const type of ['money','transport','buffer','rest','stay'])
  assert(!allowed.includes(type),'logistics type illegally admitted to Moments: '+type);

// D4 canonical projection remains intentionally one Open List after morning anchors.
assert.deepEqual(Array.from(I['4'].items,x=>x.id),['running-bean','pink-church','push-push','thao-dien-open-list']);
assert.equal(I['4'].items[3].type,'openList');

console.log('MOMENTS ACTIVITY SEMANTICS: PASS — canonical projection + explicit type allow-list.');
