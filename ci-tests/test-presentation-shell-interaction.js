const fs=require('fs');
const css=fs.readFileSync(process.argv[2]||'styles.css','utf8');
const admin=fs.readFileSync(process.argv[3]||'admin.js','utf8');
const fail=[];
if(!/#tripStudioModal\s*\{[^}]*position:fixed!important;[^}]*z-index:7800!important;[^}]*display:none!important;/s.test(css)) fail.push('dedicated Studio base shell missing');
if(!/#tripStudioModal\.show\s*\{[^}]*display:block!important;[^}]*pointer-events:auto!important;/s.test(css)) fail.push('dedicated Studio open shell missing');
if(css.includes('#mamaModal.studio-view')) fail.push('Studio must not reuse Traveller Selector shell');
if(!admin.includes("studioModal.id='tripStudioModal'")) fail.push('Studio modal runtime root missing');
if(!admin.includes("modal.classList.add('show')")) fail.push('Studio open state must be owned by modal.show');
if(!admin.includes("modal.classList.remove('show')")) fail.push('Studio close state must be owned by modal.show');
if(!admin.includes('key!==previousFriend')) fail.push('traveller-switch exit guard missing');
for(const x of ['setStoredMode(false);','lockAdminSession();','closeTripStudioPanel();']) if(!admin.includes(x)) fail.push('missing '+x);
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('PRESENTATION SHELL INTERACTION: PASS');
