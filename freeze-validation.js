/* RC22.1 release gate. Import, Engine and projection authorities remain isolated. */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const Engine=require('./engine-integrity.js');
const Adapter=require('./generation-selection-adapter.js');
const Importer=require('./masterfile-importer.js');
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
const projection=Adapter.createProductionProjection(validationData,context.TRIP_CONFIG);
const projectionAcceptance=Adapter.validateProductionProjection(projection,validationData,context.TRIP_CONFIG);
assert(projectionAcceptance.valid,Adapter.formatProjectionReport(projectionAcceptance,{format:'text'}));

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

assert(read('VERSION.txt').trim()==='NZ Companion RC22.1 \u00b7 Unicode Mojibake Root Cause Repair','VERSION.txt is not RC22.1');
const tripConfig=read('trip-config.js');
assert(/version:\s*'RC22\.1'/.test(tripConfig),'TRIP_CONFIG.version is not RC22.1');
assert(/buildLabel:\s*'Unicode Mojibake Root Cause Repair'/.test(tripConfig),'TRIP_CONFIG.buildLabel is inconsistent');
assert(read('sw.js').includes('${TRIP_CONFIG.version}'),'Service Worker cache does not consume canonical release identity');
assert(manifestLinks[0]&&/manifest\.webmanifest\?v=rc22-1/.test(manifestLinks[0][0]),'Manifest reference is not RC22.1');

for(const name of htmlFiles){
  const source=read(name);
  for(const match of source.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css))\?v=([^"']+)["']/g)){
    if(/^https?:/.test(match[1]))continue;
    assert(match[2]==='nz1.0-rc22-1',`${name} has non-RC22.1 asset generation: ${match[0]}`);
  }
  for(const match of source.matchAll(/(?:src|href)=["']([^"'#?]+)(?:\?[^"']*)?["']/g)){
    const target=match[1];
    if(!target||target.includes('${')||/^(?:https?:|mailto:|tel:|data:)/.test(target))continue;
    assert(fs.existsSync(path.join(root,target.replace(/^\.\//,''))),`${name} references missing asset: ${target}`);
  }
  if(source.includes('data.js')){
    assert(source.includes('engine-integrity.js?v=nz1.0-rc22-1'),'Data-loading page does not load the authoritative Engine gate');
    assert(source.includes('generation-selection-adapter.js?v=nz1.0-rc22-1'),'Data-loading page does not load the Generation Selection Adapter');
    assert(source.indexOf('data.js?v=nz1.0-rc22-1')<source.indexOf('generation-selection-adapter.js?v=nz1.0-rc22-1'),'Generation Adapter loads before canonical data');
  }
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
assert(!/\bITINERARY_DATA\b/.test(read('export-runtime.js')),'Export bypasses the production projection');
assert(!/\b(?:PLACES|CATEGORIES|GUIDE_ORDER|DAY_LINKS)\b/.test(read('guide-runtime.js')),'Guide renderer bypasses the production projection');
assert(!/\b(?:BOOKINGS_DATA|PLACES|TRIP_DATA|TRIP_ORDER)\b/.test(read('trip-runtime.js')),'Trip renderer bypasses the production projection');
assert(typeof Importer.import==='function'&&typeof Importer.parse==='function'&&typeof Importer.normalize==='function','Master File Importer public API is incomplete');
assert(typeof Importer.buildRelationships==='function'&&typeof Importer.generateQuestions==='function'&&typeof Importer.formatReport==='function','Master File Importer staged API is incomplete');
const importerSource=read('masterfile-importer.js');
assert(!/require\(['"]\.\/(?:engine-integrity|generation-selection-adapter|data)\.js['"]\)/.test(importerSource),'Importer bypasses or embeds downstream authorities');
for(const name of ['data.js','engine-integrity.js','generation-selection-adapter.js','guide-runtime.js','trip-runtime.js']){
  assert(!/MasterFileImporter|masterfile-importer/.test(read(name)),`${name} contains a competing importer path`);
}
const textExtensions=new Set(['.html','.js','.json','.css','.md','.txt','.webmanifest']);
const utf8Decoder=new TextDecoder('utf-8',{fatal:true});
const marker=(...values)=>String.fromCodePoint(...values);
const unicodeMarkers=[
  marker(0x00f0,0x0178),marker(0x00e2,0x20ac),marker(0x00e2,0x0153),
  marker(0x00e2,0x02dc),marker(0x00e2,0x00ad),marker(0x00c2,0x00b7),
  marker(0x00c2,0x00b0),marker(0x00c3,0x2014),marker(0x00ef,0x00b8)
];
for(const name of fs.readdirSync(root).filter(file=>textExtensions.has(path.extname(file)))){
  const bytes=fs.readFileSync(path.join(root,name));
  assert(!(bytes[0]===0xef&&bytes[1]===0xbb&&bytes[2]===0xbf),`${name} contains a UTF-8 BOM`);
  let source='';try{source=utf8Decoder.decode(bytes);}catch(error){assert(false,`${name} is not valid UTF-8`);}
  assert(!source.includes(String.fromCodePoint(0xfffd)),`${name} contains a replacement character`);
  assert(!unicodeMarkers.some(value=>source.includes(value)),`${name} contains a mojibake marker`);
}

if(failures.length){console.error(failures.map(message=>`FAIL: ${message}`).join('\n'));process.exit(1);}
console.log(`PASS RC22.1 freeze validation: RC19–22 accepted current data; shipped text is UTF-8 without BOM or mojibake markers.`);
