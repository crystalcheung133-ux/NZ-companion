const fs=require('fs');
const css=fs.readFileSync(process.argv[2]||'styles.css','utf8');
const admin=fs.readFileSync(process.argv[3]||'admin.js','utf8');
const fail=[];
if(!css.includes('Studio management panel is a separate bounded workspace below fixed chrome.')) fail.push('Studio popup contract missing');
if(/#mamaModal\.studio-view[^{]*\{[^}]*height\s*:\s*100dvh/s.test(css)) fail.push('full-page Studio geometry remains');
if(!admin.includes("studio.scrollIntoView({block:'start',inline:'nearest'})")) fail.push('Studio re-entry must use scrollIntoView');
if(!admin.includes('key!==previousFriend')) fail.push('traveller-switch exit guard missing');
for(const x of ['setStoredMode(false);','lockAdminSession();','closeTripStudioPanel();']) if(!admin.includes(x)) fail.push('missing '+x);
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('PRESENTATION SHELL INTERACTION: PASS');
