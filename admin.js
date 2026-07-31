'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const htmlFiles=fs.readdirSync(root).filter(f=>f.endsWith('.html'));
const joined=htmlFiles.map(f=>fs.readFileSync(path.join(root,f),'utf8')).join('\n');
const failures=[];
function check(condition,message){if(!condition) failures.push(message);}
check(!/value="(?:lee|fowlers|yau)"/.test(joined),'Shared HTML still contains hardcoded party option/checkbox values.');
check(!/MEL · Lee|SYD · Fowlers|NTL · Yau/.test(joined),'Shared HTML still contains hardcoded party labels.');
const partyPages=htmlFiles.filter(f=>fs.readFileSync(path.join(root,f),'utf8').includes('friend-choice-list'));
check(partyPages.length===8,'Expected 8 party-enabled pages, found '+partyPages.length+'.');
check(partyPages.every(f=>fs.readFileSync(path.join(root,f),'utf8').includes('party-render-runtime.js?v=stage3-2h-engine-config1')),'Not every party-enabled page wires the Engine-owned party renderer version.');
const admin=fs.readFileSync(path.join(root,'admin.js'),'utf8');
const complete=fs.readFileSync(path.join(root,'complete-runtime.js'),'utf8');
const exp=fs.readFileSync(path.join(root,'export-runtime.js'),'utf8');
check(admin.includes('const ADMIN_USER=TRIP_CONFIG.admin.user;'),'admin.js does not use config-owned admin identity.');
check(admin.includes('const ADMIN_PIN=TRIP_CONFIG.admin.pin;'),'admin.js does not use config-owned Studio PIN.');
check(!admin.includes("||'260922'")&&!admin.includes("||'lee'"),'admin.js retains hardcoded authority fallbacks.');
check(complete.includes('const ADMIN_USER=TRIP_CONFIG.admin.user;'),'complete-runtime.js does not use config-owned admin identity.');
check(exp.includes('const ADMIN_USER=TRIP_CONFIG.admin.user;'),'export-runtime.js does not use config-owned admin identity.');
const party=fs.readFileSync(path.join(root,'party-render-runtime.js'),'utf8');
check(!party.includes('sameAsLegacy')&&!party.includes('GUARDED NO-OP'),'party renderer still bypasses current NZ parties.');
check(party.includes('[data-party-split-list]'),'party renderer does not own split lists.');
if(failures.length){console.error('ENGINE CONFIG REGRESSION: FAIL'); failures.forEach(x=>console.error('- '+x)); process.exit(1);}
console.log(`ENGINE CONFIG REGRESSION: PASS (${htmlFiles.length} HTML pages)`);
