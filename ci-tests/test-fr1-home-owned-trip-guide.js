const fs=require('fs'),assert=require('assert');
const core=fs.readFileSync('core-runtime.js','utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
const trip=fs.readFileSync('trip-runtime.js','utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
function body(src,sig){const i=src.indexOf(sig);assert(i>=0,'missing '+sig);const b=src.indexOf('{',i);let d=0;for(let j=b;j<src.length;j++){if(src[j]==='{')d++;else if(src[j]==='}'&&--d===0)return src.slice(b+1,j);}throw Error('unclosed '+sig);}
const t=body(core,'function toggleTripMenu()'),g=body(core,'function toggleGuideMenu()');
assert(/!isHomeNavigationOwner\(\).*openHomeOwnedMenu\('open-trip'\).*return/s.test(t),'FR1 Trip must leave feature page and reopen from Home');
assert(/!isHomeNavigationOwner\(\).*openHomeOwnedMenu\('open-guide'\).*return/s.test(g),'FR1 Guide must leave feature page and reopen from Home');
const hub=body(trip,'function tripHubEntries()');
const menu=body(trip,'function renderTripMenuFromConfig()');
for(const src of [hub,menu]){
 const f=src.indexOf("'flights'"),v=src.indexOf("'vehicle'"),s=src.indexOf("'stay'");
 assert(f>=0&&v>f&&s>v,'FR1 canonical NZ Trip order must start Flights → Vehicle → Stay');
}
console.log('FR1 HOME-OWNED TRIP/GUIDE: PASS');
