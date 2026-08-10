const fs=require('fs');
const css=fs.readFileSync('styles.css','utf8');
const admin=fs.readFileSync('admin.js','utf8');
const fail=[];
if(!css.includes('body.admin-mode #adminModeBanner{')||!css.includes('display:flex!important')) fail.push('Studio status bar must stay visible in Studio mode');
if(!css.includes('body.admin-mode .site-nav{')) fail.push('traveller header stack missing');
if(!css.includes('top:var(--studio-status-height,52px)!important')) fail.push('traveller selector must sit below status bar');
if(!css.includes('padding-top:calc(var(--studio-status-height,52px) + var(--studio-traveller-header-height,68px))!important')) fail.push('page/workspace must clear both fixed rows');
if(!css.includes('pointer-events:auto!important')) fail.push('traveller selector must remain interactive');
if(!admin.includes("style.setProperty('--studio-status-height'")) fail.push('dynamic status measurement missing');
if(!admin.includes("style.setProperty('--studio-traveller-header-height'")) fail.push('dynamic traveller header measurement missing');
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('STUDIO GLOBAL CHROME STACK: PASS');
