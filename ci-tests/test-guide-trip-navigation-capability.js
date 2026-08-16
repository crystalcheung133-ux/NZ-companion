const fs=require('fs'),assert=require('assert');
const cfg=fs.readFileSync('trip-config.js','utf8');
const m=cfg.match(/categoryOrder:Object\.freeze\(\[([^\]]*)\]\)/);assert(m,'Guide categoryOrder missing');
const expected=[...m[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);assert(expected.length,'Guide categoryOrder empty');
const pages=['index.html','day.html','itinerary.html','trip.html','expenses.html','moments.html','memory.html','place.html'];
for(const file of pages){
 const s=fs.readFileSync(file,'utf8');
 const menu=s.match(/<div class="mini-menu" id="guideMenu">([\s\S]*?)<\/div><div class="mini-menu" id="tripMenu">/);
 assert(menu,`${file}: guide menu missing`);
 const actual=[...menu[1].matchAll(/openGuideCategory\('([^']+)'\)/g)].map(x=>x[1]);
 assert.deepStrictEqual(actual,expected,`${file}: Guide menu must follow configured category order`);
}
const runtime=fs.readFileSync('guide-runtime.js','utf8');
assert(runtime.includes("return 'EXPERIENCES'"),'Generic Engine activity/experience mapping must remain supported');
assert(runtime.includes("return 'WELLNESS'"),'Generic wellness mapping missing');
const data=fs.readFileSync('data.js','utf8');
assert(data.includes('"areaLabel": "CU CHI → DISTRICT 3 → SAIGON NIGHT"'),'Day 3 area label missing');
assert(data.includes('"areaLabel": "DISTRICT 1 → TÂN BÌNH · AIRPORT"'),'Day 5 area label missing');
const day=fs.readFileSync('day.html','utf8');
assert(day.includes('day-area-label'),'Day header must render area label');
assert(day.includes('timeline-action--copy'),'Timeline must expose Copy Address utility');
assert(day.includes('copyTimelineAddress'),'Timeline copy function missing');
const trip=fs.readFileSync('trip-runtime.js','utf8');
assert(trip.includes('function tripHubEntries()'),'Trip hub sequence must derive from visible booking modules');
assert(trip.includes("id:'restaurants'"),'Restaurants must be part of Trip sequence');
assert(trip.includes("id:'spa'"),'Spa must be part of Trip sequence');
assert(!trip.includes('PRODUCTION_TRIP.order[(idx - 1'),'Trip previous/next must not use legacy TRIP_ORDER');
console.log('GUIDE CONFIG + TRIP/DAY NAVIGATION CAPABILITY: PASS');
