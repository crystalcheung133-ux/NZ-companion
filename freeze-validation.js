/* RC18.2 release gate. Run with: node freeze-validation.js */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=__dirname;
const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

function literalFor(source,name){
  const match=source.match(new RegExp(`^const ${name}=(.*);$`,'m'));
  if(!match)throw new Error(`Missing ${name}`);
  return match[1];
}
function topLevelObjectKeys(json){
  const keys=[];let depth=0,inString=false,escape=false,start=-1;
  for(let i=0;i<json.length;i++){
    const ch=json[i];
    if(inString){
      if(escape){escape=false;continue;}
      if(ch==='\\'){escape=true;continue;}
      if(ch==='"'){
        inString=false;
        if(depth===1){let j=i+1;while(/\s/.test(json[j]||''))j++;if(json[j]===':')keys.push(JSON.parse(json.slice(start,i+1)));}
      }
      continue;
    }
    if(ch==='"'){inString=true;start=i;continue;}
    if(ch==='{'||ch==='[')depth++;
    else if(ch==='}'||ch===']')depth--;
  }
  return keys;
}

const dataSource=read('data.js');
const context={console};context.globalThis=context;vm.createContext(context);
vm.runInContext(dataSource,context,{filename:'data.js'});
const data=context.TRAVEL_DATASETS;
const places=data.PLACES,categories=data.CATEGORIES,guideOrder=data.GUIDE_ORDER,dayLinks=data.DAY_LINKS,itinerary=data.ITINERARY_DATA;

const rawPlaceIds=topLevelObjectKeys(literalFor(dataSource,'PLACES'));
assert(rawPlaceIds.length===new Set(rawPlaceIds).size,'Duplicate place IDs exist in PLACES literal');
assert(guideOrder.length===new Set(guideOrder).size,'Duplicate place IDs exist in GUIDE_ORDER');
for(const key of guideOrder)assert(Boolean(places[key]),`GUIDE_ORDER references missing PLACES key: ${key}`);
const categoryKeys=[];
for(const [category,entries] of Object.entries(categories))for(const entry of entries){
  const key=typeof entry==='string'?entry:entry&&entry.key;categoryKeys.push(key);
  assert(Boolean(places[key]),`${category} category references missing PLACES key: ${key}`);
  assert(entry&&Object.keys(entry).every(field=>field==='key'),`${category}/${key} duplicates canonical PLACES presentation fields`);
}
for(const key of guideOrder)assert(categoryKeys.includes(key),`Intended Guide place is unreachable from categories: ${key}`);
for(const key of categoryKeys)assert(guideOrder.includes(key),`Category place is unreachable from GUIDE_ORDER: ${key}`);
for(const key of Object.keys(dayLinks))assert(Boolean(places[key]),`DAY_LINKS references missing PLACES key: ${key}`);

const items=Object.values(itinerary).flatMap(day=>day.items||[]);
const itemIds=items.map(item=>item.id);
assert(itemIds.length===new Set(itemIds).size,'Duplicate itinerary item IDs exist');
for(const item of items){
  if(item.nonPlace===true){
    assert(item.placeId==null,`Non-place item has placeId: ${item.id}`);
    assert(!Array.isArray(item.guideIds)||item.guideIds.length===0,`Non-place item attempts Guide navigation: ${item.id}`);
  }else{
    assert(Boolean(item.placeId),`Real-place item has no placeId: ${item.id}`);
    assert(Boolean(places[item.placeId]),`Real-place item has invalid placeId: ${item.id}/${item.placeId}`);
  }
  for(const key of item.guideIds||[])assert(Boolean(places[key]),`Item ${item.id} references missing Guide place: ${key}`);
}
const daySource=read('day.html');
assert(daySource.includes('const nonPlace=item.nonPlace===true'),'Day renderer does not recognise non-place items');
assert(daySource.includes('const mapHtml=!nonPlace&&item.map'),'Non-place items are not blocked from map actions');
assert(daySource.includes('const requested=nonPlace?[]:'),'Non-place items are not blocked from Guide actions');

const htmlFiles=fs.readdirSync(root).filter(name=>name.endsWith('.html'));
const html=htmlFiles.map(name=>read(name)).join('\n');
for(const phrase of ['Free Time and Onsen','Hello Christchurch','Meet at Tonic'])assert(!html.includes(phrase),`Production HTML contains banned stale phrase: ${phrase}`);
const manifestLinks=[...html.matchAll(/<link[^>]+rel=["']manifest["'][^>]*>/gi)];
assert(manifestLinks.length===1,`Expected one manifest link; found ${manifestLinks.length}`);
assert(!/createManifest|application\/manifest\+json|createObjectURL\s*\(/.test(read('trip-config.js')),'Dynamic Blob manifest authority remains active');
const manifest=JSON.parse(read('manifest.webmanifest'));
assert(manifest.start_url==='./index.html?coldLaunch=1','Manifest cold-launch start_url is not canonical');
assert(manifest.name==='New Zealand Companion'&&manifest.short_name==='NZ Companion','Manifest app identity changed');
assert(manifest.display==='standalone','Manifest display mode is not standalone');
assert(manifest.background_color==='#f4eadb'&&manifest.theme_color==='#f4eadb','Manifest colours changed');
assert(Array.isArray(manifest.icons)&&manifest.icons.length===2,'Manifest icons are incomplete');

assert(read('VERSION.txt').trim()==='NZ Companion RC18.2 \u00b7 Rental Depot Navigation Fix','VERSION.txt is not RC18.2');
const tripConfig=read('trip-config.js');
assert(/version:\s*'RC18\.2'/.test(tripConfig),'TRIP_CONFIG.version is not RC18.2');
assert(/buildLabel:\s*'Rental Depot Navigation Fix'/.test(tripConfig),'TRIP_CONFIG.buildLabel is inconsistent');
assert(read('sw.js').includes('${TRIP_CONFIG.version}-rental-depot-navigation-fix'),'Service Worker cache does not use canonical release identity');
assert(manifestLinks[0]&&/manifest\.webmanifest\?v=rc18-2/.test(manifestLinks[0][0]),'Active manifest reference is not RC18.2');
for(const name of htmlFiles){
  for(const match of read(name).matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))\?v=([^"']+)["']/g)){
    if(/^https?:/.test(match[1]))continue;
    assert(match[2]==='nz1.0-rc18-2',`${name} has non-RC18.2 active asset generation: ${match[0]}`);
  }
}

for(const name of htmlFiles){
  const source=read(name);
  for(const match of source.matchAll(/(?:src|href)=["']([^"'#?]+)(?:\?[^"']*)?["']/g)){
    const target=match[1];
    if(!target||target.includes('${')||/^(?:https?:|mailto:|tel:|data:)/.test(target))continue;
    assert(fs.existsSync(path.join(root,target.replace(/^\.\//,''))),`${name} references missing production asset: ${target}`);
  }
}

const swSource=read('sw.js');
for(const match of swSource.matchAll(/["'](\.\/[A-Za-z0-9][^"'?#]*)["']/g)){
  const target=match[1].slice(2);
  assert(fs.existsSync(path.join(root,target)),`Service Worker references missing production asset: ${target}`);
}
assert(!fs.existsSync(path.join(root,'cache-upgrade-regression.test.js')),'Legacy cache upgrade test remains in production deploy');
assert(!fs.existsSync(path.join(root,'supabase-auth-runtime.js')),'Confirmed unused Supabase auth runtime remains in production deploy');
assert(read('export-runtime.js').includes('window.exportFinalItinerary'),'Itinerary Export entry point is missing');
assert(read('export-runtime.js').includes('window.exportExpenseSummary'),'Expenses Export entry point is missing');
assert(read('complete-runtime.js').includes('window.completeTrip'),'Complete Trip entry point is missing');

const vehicleBody=(data.TRIP_DATA.vehicle&&data.TRIP_DATA.vehicle.body)||'';
assert(vehicleBody.includes('Navigate to pickup depot'),'Rental pickup navigation action is missing');
assert(vehicleBody.includes('Navigate to return depot'),'Rental return navigation action is missing');
assert(!/>Navigate to depot</.test(vehicleBody),'Generic rental navigation label remains');
assert(vehicleBody.includes('79+Stanleys+Road+Harewood+Christchurch'),'Pickup navigation destination is incorrect');
assert(vehicleBody.includes('2%2F13+Red+Oaks+Drive+Frankton+Queenstown'),'Return navigation destination is incorrect');

if(failures.length){console.error(failures.map(message=>`FAIL: ${message}`).join('\n'));process.exit(1);}
console.log(`PASS RC18.2 freeze validation: ${Object.keys(places).length} places, ${guideOrder.length} Guide entries, ${items.length} itinerary items, ${items.filter(item=>item.nonPlace===true).length} non-place events.`);
