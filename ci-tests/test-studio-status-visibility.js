const fs=require('fs');
const css=fs.readFileSync('styles.css','utf8');
const fail=[];
if(!css.includes('body.admin-mode #adminModeBanner{\n  display:none!important;')) fail.push('status bar must be hidden on ordinary pages');
if(!css.includes('body.admin-mode:has(#mamaModal.studio-view.show) #adminModeBanner')) fail.push('status bar must be scoped to open Studio workspace');
if(!css.includes('display:flex!important')) fail.push('status bar must become visible in Studio');
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('STUDIO STATUS VISIBILITY: PASS');
