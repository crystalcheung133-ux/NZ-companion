const fs=require('fs');const css=fs.readFileSync('styles.css','utf8'),admin=fs.readFileSync('admin.js','utf8');const fail=[];
if(css.includes('adminModeBanner')||admin.includes('adminModeBanner')) fail.push('separate Studio status bar must be removed');
if(!css.includes('body.admin-mode .site-nav{')) fail.push('existing traveller header must own Studio top chrome');
if(!css.includes('.studio-on-badge')) fail.push('STUDIO ON badge style missing');
if(!admin.includes("badge.textContent='STUDIO ON'")) fail.push('STUDIO ON badge runtime missing');
if(!admin.includes("style.setProperty('--studio-traveller-header-height'")) fail.push('dynamic traveller header measurement missing');
if(admin.includes("style.setProperty('--studio-status-height'")) fail.push('obsolete status bar measurement remains');
if(fail.length){console.error(fail.join('\n'));process.exit(1)}console.log('STUDIO GLOBAL CHROME STACK: PASS');