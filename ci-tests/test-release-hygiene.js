const fs=require('fs');
const path=require('path');
const root=process.argv[2]||'.';
const release=JSON.parse(fs.readFileSync(path.join(root,'RELEASE.json'),'utf8'));
const ciDir=path.join(root,'ci-tests');
const files=fs.readdirSync(ciDir);
const fail=[];

if(release.engine_version!=='25.5.2') fail.push('engine_version must be 25.5.2');
for(const stale of ['25.4.31','25.4.32']){
  for(const f of files){
    if(f.includes(stale)) fail.push('version-specific stable-contract CI filename remains: '+f);
  }
}
const caps=(release.capabilities_changed||[]).join('\n').toLowerCase();
for(const stale of [
  'full-screen studio workspace overlay',
  'green studio status bar is visible only while studio workspace is open',
  'bounded between persistent top chrome and mobile bottom nav',
  'mobile overlay modals reserve visible bottom navigation clearance'
]){
  if(caps.includes(stale)) fail.push('stale release capability remains: '+stale);
}
if(!fs.existsSync(path.join(root,'docs','BROWSER-SMOKE-TEST-PRESENTATION-SHELL.md')))
  fail.push('browser smoke-test checklist missing');

if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('RELEASE HYGIENE CONTRACT: PASS');
