const fs=require('fs');const css=fs.readFileSync(process.argv[2]||'styles.css','utf8'),admin=fs.readFileSync(process.argv[3]||'admin.js','utf8');const f=[];
if(css.includes('adminModeBanner')||admin.includes('adminModeBanner'))f.push('separate Studio status bar remains');
if(!/body\.admin-mode \.site-nav\s*\{[\s\S]*?top:0!important;/.test(css))f.push('Studio must reuse the existing header at top:0');
if(!css.includes('.studio-on-badge'))f.push('Studio badge CSS missing');
if(!admin.includes("badge.textContent='STUDIO ON'"))f.push('Studio badge label missing');
if(!admin.includes("studioBadge.hidden=!state.mode"))f.push('Studio badge mode toggle missing');
if(/--studio-status-height|--engine-studio-status/.test(css+admin))f.push('obsolete separate-status-bar geometry token remains');
if(f.length){console.error('STUDIO HEADER BADGE FAIL');f.forEach(x=>console.error(' - '+x));process.exit(1)}console.log('STUDIO HEADER BADGE PASS');