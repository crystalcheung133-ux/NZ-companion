/* RC19 release gate. Engine structural rules are authoritative in engine-integrity.js. */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const Engine=require('./engine-integrity.js');
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

const context={console};context.globalThis=context;vm.createContext(context);
for(const name of ['theme-config.js','asset-config.js','locale-config.js','trip-config.js','data.js']){
  vm.runInContext(read(name),context,{filename:name});
}
const dataSource=read('data.js');
const validationData=Object.assign({},context.TRAVEL_DATASETS,{
  SOURCE_META:{
    placeIds:topLevelObjectKeys(literalFor(dataSource,'PLACES')),
    bookingIds:topLevelObjectKeys(literalFor(dataSource,'BOOKINGS_DATA'))
  }
});
const acceptance=Engine.validateTripData(validationData,context.TRIP_CONFIG);
assert(acceptance.valid,Engine.formatValidationReport(acceptance,{format:'text'}));

const daySource=read('day.html');
assert(daySource.includes('const nonPlace=item.nonPlace===true'),'Day renderer does not recognise non-place items');
assert(daySource.includes('const mapHtml=!nonPlace&&item.map'),'Day renderer does not suppress non-place map actions');
assert(daySource.includes('const requested=nonPlace?[]:'),'Day renderer does not suppress non-place Guide actions');

const htmlFiles=fs.readdirSync(root).filter(name=>name.endsWith('.html'));
const html=htmlFiles.map(name=>read(name)).join('\n');
const manifestLinks=[...html.matchAll(/<link[^>]+rel=["']manifest["'][^>]*>/gi)];
assert(manifestLinks.length===1,`Expected one manifest link; found ${manifestLinks.length}`);
assert(!/createManifest|application\/manifest\+json|createObjectURL\s*\(/.test(read('trip-config.js')),'Dynamic Blob manifest authority is active');
const manifest=JSON.parse(read('manifest.webmanifest'));
assert(manifest.start_url==='./index.html?coldLaunch=1','Manifest cold-launch start_url changed');
assert(manifest.display==='standalone','Manifest display mode is not standalone');
assert(Array.isArray(manifest.icons)&&manifest.icons.length===2,'Manifest icons are incomplete');

assert(read('VERSION.txt').trim()==='NZ Companion RC19 \u00b7 Engine Integrity Layer E1\u2013E5','VERSION.txt is not RC19');
const tripConfig=read('trip-config.js');
assert(/version:\s*'RC19'/.test(tripConfig),'TRIP_CONFIG.version is not RC19');
assert(/buildLabel:\s*'Engine Integrity Layer E1\u2013E5'/.test(tripConfig),'TRIP_CONFIG.buildLabel is inconsistent');
assert(read('sw.js').includes('${TRIP_CONFIG.version}-engine-integrity-e1-e5'),'Service Worker cache does not use RC19 identity');
assert(manifestLinks[0]&&/manifest\.webmanifest\?v=rc19/.test(manifestLinks[0][0]),'Manifest reference is not RC19');

for(const name of htmlFiles){
  const source=read(name);
  for(const match of source.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))\?v=([^"']+)["']/g)){
    if(/^https?:/.test(match[1]))continue;
    assert(match[2]==='nz1.0-rc19',`${name} has non-RC19 asset generation: ${match[0]}`);
  }
  for(const match of source.matchAll(/(?:src|href)=["']([^"'#?]+)(?:\?[^"']*)?["']/g)){
    const target=match[1];
    if(!target||target.includes('${')||/^(?:https?:|mailto:|tel:|data:)/.test(target))continue;
    assert(fs.existsSync(path.join(root,target.replace(/^\.\//,''))),`${name} references missing asset: ${target}`);
  }
  if(source.includes('data.js'))assert(source.includes('engine-integrity.js?v=nz1.0-rc19'),'Data-loading page does not load the authoritative Engine gate');
}

const swSource=read('sw.js');
for(const match of swSource.matchAll(/["'](\.\/[A-Za-z0-9][^"'?#]*)["']/g)){
  const target=match[1].slice(2);
  assert(fs.existsSync(path.join(root,target)),`Service Worker references missing asset: ${target}`);
}
assert(swSource.includes("'./engine-integrity.js'"),'Service Worker does not cache the Engine integrity runtime');
assert(read('export-runtime.js').includes('window.exportFinalItinerary'),'Itinerary Export entry point is missing');
assert(read('export-runtime.js').includes('window.exportExpenseSummary'),'Expenses Export entry point is missing');
assert(read('complete-runtime.js').includes('window.completeTrip'),'Complete Trip entry point is missing');

const rental=Object.values(context.TRAVEL_DATASETS.BOOKINGS_DATA).find(item=>/^(?:rentalCar|rental-vehicle|rental)$/i.test(item.type||''));
const vehicleBody=(context.TRAVEL_DATASETS.TRIP_DATA.vehicle&&context.TRAVEL_DATASETS.TRIP_DATA.vehicle.body)||'';
assert(rental&&vehicleBody.includes(rental.pickupNavigationDestination),'Rental presentation is not bound to canonical pickup navigation');
assert(rental&&vehicleBody.includes(rental.returnNavigationDestination),'Rental presentation is not bound to canonical return navigation');
assert(vehicleBody.includes('Navigate to pickup depot')&&vehicleBody.includes('Navigate to return depot'),'Rental navigation labels are ambiguous');

if(failures.length){console.error(failures.map(message=>`FAIL: ${message}`).join('\n'));process.exit(1);}
console.log(`PASS RC19 freeze validation: E1\u2013E5 accepted with ${acceptance.blockingErrorCount} blocking errors, ${acceptance.warningCount} warnings, ${acceptance.summary.entityCounts.places} places, ${acceptance.summary.entityCounts.itineraryItems} itinerary items.`);
