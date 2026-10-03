const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('sw.js','utf8');
const marker="self.addEventListener('fetch'";
const a=src.lastIndexOf(marker); assert(a>=0,'fetch listener missing');
const code=src.slice(a);
let handler=null,calls=[];
const self={location:{origin:'https://trip.test'},addEventListener:(type,fn)=>{if(type==='fetch')handler=fn;}};
const ctx={self,URL,CRITICAL_EXTENSIONS:/\.(?:css|js)$/i,
 networkFirst:r=>{calls.push('network');return 'NETWORK'}, navigationResponse:r=>{calls.push('nav');return 'NAV'},
 criticalAssetResponse:r=>{calls.push('critical');return 'CRITICAL'}, cacheFirstMedia:r=>{calls.push('media');return 'MEDIA'}};
vm.createContext(ctx); vm.runInContext(code,ctx); assert(handler,'fetch handler not registered');
function dispatch(url,{mode='cors',accept='*/*'}={}){calls=[];let response;const req={method:'GET',url,mode,headers:{get:n=>n==='accept'?accept:null}};handler({request:req,respondWith:r=>{response=r}});return {calls,response};}
let x=dispatch('https://trip.test/script.js'); assert.deepEqual(x.calls,['critical']); assert.equal(x.response,'CRITICAL');
x=dispatch('https://trip.test/styles.css'); assert.deepEqual(x.calls,['critical']);
x=dispatch('https://trip.test/index.html',{mode:'navigate',accept:'text/html'}); assert.deepEqual(x.calls,['nav']);
x=dispatch('https://trip.test/photo.png'); assert.deepEqual(x.calls,['network']);
x=dispatch('https://trip.test/icon.svg'); assert.deepEqual(x.calls,['media']);
console.log('FR2 FETCH WIRING: PASS');
