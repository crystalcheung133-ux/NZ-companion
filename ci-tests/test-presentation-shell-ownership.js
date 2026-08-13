const fs=require('fs');
const css=fs.readFileSync(process.argv[2]||'styles.css','utf8');
const fail=[];
if(!/body :is\([\s\S]*\.moments-modal[\s\S]*\.mama-modal:not\(\.studio-view\)[\s\S]*\)\.show\s*\{[^}]*overflow-y:auto!important;/s.test(css)) fail.push('ordinary popup overlay-scroll owner missing');
if(/body :is\([\s\S]*?(?:\.guide-modal|\.trip-modal)[\s\S]*?\)\.show\s*\{[^}]*overflow-y:auto!important;/s.test(css)) fail.push('Trip/Guide leaked into ordinary popup overlay-scroll owner');
if((css.match(/body\.admin-mode #adminModeBanner\s*\{/g)||[]).length!==1) fail.push('status bar must have one owner');
if(/#expenseModal\s+\.tools-sheet\s*\{[^}]*max-height/s.test(css)) fail.push('legacy Expense max-height remains');
if(/#momentsModal\s+\.moments-sheet\s*\{[^}]*max-height/s.test(css)) fail.push('legacy Moments max-height remains');
for(const x of ['--engine-fixed-chrome-height','top:var(--engine-fixed-chrome-height)!important','overflow-y:auto!important','overflow:visible!important','pointer-events:none!important','#mamaModal.studio-view.show']) if(!css.includes(x)) fail.push('missing '+x);
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('PRESENTATION SHELL OWNERSHIP: PASS');
