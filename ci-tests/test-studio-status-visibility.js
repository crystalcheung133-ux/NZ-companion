const fs=require('fs');const css=fs.readFileSync('styles.css','utf8'),admin=fs.readFileSync('admin.js','utf8');const fail=[];
if(css.includes('adminModeBanner')||admin.includes('adminModeBanner')) fail.push('legacy Studio status bar remains');
if(!/body\.admin-mode \.studio-on-badge:not\(\[hidden\]\)\{display:inline-flex!important\}/.test(css)) fail.push('Studio badge visibility contract missing');
if(!admin.includes("if(studioBadge) studioBadge.hidden=!state.mode")) fail.push('Studio badge state toggle missing');
if(fail.length){console.error(fail.join('\n'));process.exit(1)}console.log('STUDIO HEADER BADGE VISIBILITY: PASS');