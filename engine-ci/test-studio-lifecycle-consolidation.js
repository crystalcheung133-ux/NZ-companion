const fs=require('fs');
const admin=fs.readFileSync('admin.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
const fail=[];
if(/studio\.hidden\s*=/.test(admin)) fail.push('Studio card visibility must not use child hidden state');
if(/#tripStudioModal\s+#adminModeControl\s*\{[^}]*display\s*:\s*block\s*!important/s.test(css)) fail.push('CSS must not force child Studio card visibility');
if(/#mamaModal\s+#adminModeControl/.test(css)) fail.push('Traveller Selector must not own Studio card geometry');
if(/#tripStudioModal\s+\.guide-sheet/.test(css)) fail.push('Dedicated Studio shell must not depend on guide-sheet');
if(!admin.includes("selectorCard.hidden=!!(active && studioModal && studioModal.classList.contains('show'))")) fail.push('Selector visibility must derive from dedicated modal open state');
if(!admin.includes('function ensureStudioSelectorToggle()')) fail.push('Studio selector re-ensure helper missing');
if((admin.match(/ensureStudioSelectorToggle\(\);/g)||[]).length<2) fail.push('Studio selector must be ensured at build and every User Selector open');
if(!admin.includes("familyList.insertAdjacentElement('afterend',selectorToggle)")) fail.push('Studio entry must stay below traveller list');
if(admin.includes("familyList.insertAdjacentElement('beforebegin',selectorToggle)")) fail.push('obsolete Studio-before-travellers ordering survived');
const openFriend=admin.match(/window\.openFriendModal=function\(\)\{[\s\S]*?\n  \};/);
if(!openFriend) fail.push('wrapped User Selector open lifecycle missing');
else {
  if(!/state\.mode && isUnlocked\(\) && isAdminUser\(\)/.test(openFriend[0])) fail.push('active Studio re-entry state guard missing');
  if(!/openTripStudioPanel\(\);[\s\S]{0,100}?return;/.test(openFriend[0])) fail.push('active User Selector must reopen Studio directly');
  if(/scrollIntoView/.test(openFriend[0])) fail.push('User Selector open must not scroll hidden Studio workspace');
}
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('STUDIO LIFECYCLE CONSOLIDATION: PASS');
