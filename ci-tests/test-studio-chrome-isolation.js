const fs=require('fs');
const css=fs.readFileSync('styles.css','utf8');
const admin=fs.readFileSync('admin.js','utf8');
const fail=[];
if(!css.includes('z-index:7400!important')) fail.push('traveller header must be above Studio status bar');
if(!css.includes('visibility:visible!important')) fail.push('traveller header must remain visible');
if(!css.includes('pointer-events:auto!important')) fail.push('user selector must remain interactive');
if(!css.includes('top:var(--studio-traveller-header-height,68px)!important')) fail.push('Studio status bar must sit below traveller header');
if(!css.includes('padding-top:calc(var(--studio-traveller-header-height,68px) + 52px)!important')) fail.push('Studio workspace must begin below header + status');
if(!admin.includes("style.setProperty('--studio-traveller-header-height'")) fail.push('dynamic header measurement missing');
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('STUDIO HEADER STACK: PASS');
