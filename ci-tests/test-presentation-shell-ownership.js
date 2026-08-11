const fs=require('fs');
const css=fs.readFileSync(process.argv[2]||'styles.css','utf8');
const fail=[];
const count=(x)=>css.split(x).length-1;
if(count('Travel Engine 25.4.34 — canonical presentation shell')!==1) fail.push('25.4.34 shell must exist once');
for(const stale of ['RC23.4 modal/nav coexistence','RC25.0.2 — keep final modal actions','RC25.1.5 — balanced fixed-nav clearance','25.4.22 — persistent-chrome modal viewport contract','25.4.28 — canonical full-overlay modal contract','25.4.31 — canonical full-overlay modal contract','25.4.32 — Studio popup workspace contract']) if(css.includes(stale)) fail.push('obsolete shell remains: '+stale);
if((css.match(/body\.admin-mode #adminModeBanner\s*\{/g)||[]).length!==1) fail.push('status bar must have one owner');
if(/#expenseModal\s+\.tools-sheet\s*\{[^}]*max-height/s.test(css)) fail.push('legacy Expense max-height remains');
if(/#momentsModal\s+\.moments-sheet\s*\{[^}]*max-height/s.test(css)) fail.push('legacy Moments max-height remains');
for(const x of ['--engine-fixed-chrome-height','top:var(--engine-fixed-chrome-height)!important','overflow-y:auto!important','overflow:visible!important','pointer-events:none!important','#mamaModal.studio-view.show']) if(!css.includes(x)) fail.push('missing '+x);
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('PRESENTATION SHELL OWNERSHIP: PASS');
