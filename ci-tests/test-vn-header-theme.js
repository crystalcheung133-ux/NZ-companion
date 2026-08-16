const fs=require('fs');const css=fs.readFileSync(process.argv[2]||'styles.css','utf8');const f=[];
if(!css.includes('Saigon Companion RC29.16 — VN theme layer only: warm ivory header'))f.push('VN warm header theme layer missing');
if(!/\.site-nav,\s*body\.home-bg \.site-nav\s*\{[^}]*background:rgba\(250,244,235,.97\)!important;/s.test(css))f.push('warm ivory normal header missing');
if(!/body\.admin-mode > \.site-nav\s*\{[^}]*linear-gradient\(90deg,rgba\(248,238,225,.99\),rgba\(255,249,241,.99\)\)/s.test(css))f.push('warm Studio header missing');
if(f.length){console.error(f.join('\n'));process.exit(1)}console.log('VN HEADER THEME: PASS');
