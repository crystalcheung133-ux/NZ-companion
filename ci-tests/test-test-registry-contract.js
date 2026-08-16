const fs=require('fs'),path=require('path'),assert=require('assert');
const root='ci-tests',registry=JSON.parse(fs.readFileSync(path.join(root,'TEST-REGISTRY.json'),'utf8'));
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const tests=walk(root).filter(p=>/^test-.*\.(js|sh|py)$/.test(path.basename(p))).map(p=>path.basename(p)).sort();
assert.deepStrictEqual(Object.keys(registry).sort(),tests,'TEST-REGISTRY must classify every test file exactly once');
const valid=new Set(['active','browser','merge','retired']);
for(const [name,row] of Object.entries(registry)){assert(valid.has(row.status),`${name}: invalid/unclassified status`);}
const staticShell=[path.join(root,'run-all.sh'),...walk(path.join(root,'suites')).filter(p=>p.endsWith('.sh'))].map(p=>fs.readFileSync(p,'utf8')).join('\n');
for(const [name,row] of Object.entries(registry)){
 if(row.status==='active')assert(staticShell.includes(name),`${name}: active test is not invoked by Master CI/suites`);
 if(['browser','merge','retired'].includes(row.status))assert(!staticShell.includes(name),`${name}: ${row.status} test must not run in static Master CI`);
}

for(const [name,row] of Object.entries(registry)){
 if(row.status==='merge'&&row.replacement){
   const targets=Array.isArray(row.replacement)?row.replacement:[row.replacement];
   for(const target of targets){
     assert(registry[target],`${name}: replacement ${target} missing from registry`);
     assert.equal(registry[target].status,'active',`${name}: replacement ${target} must be active`);
   }
 }
}


const browserTests=Object.entries(registry).filter(([,r])=>r.status==='browser').map(([n])=>n);
assert.deepStrictEqual(browserTests,['test-browser-release-smoke.py'],'Exactly one canonical browser release test is required');
const browserRunner=fs.readFileSync(path.join(root,'run-browser.sh'),'utf8');
assert(browserRunner.includes(browserTests[0]),'run-browser.sh must execute the registered browser release smoke');

console.log('TEST REGISTRY / ORCHESTRATION: PASS');
