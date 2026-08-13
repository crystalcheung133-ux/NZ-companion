const fs=require('fs');
const css=fs.readFileSync(process.argv[2]||'styles.css','utf8');
const fail=[];
if(!/body :is\([\s\S]*\.moments-modal[\s\S]*\.tools-modal[\s\S]*\)\.show\s*\{[^}]*overflow-y:auto!important;/s.test(css)) fail.push('ordinary popup overlay-scroll owner missing');
if(/body :is\([\s\S]*?(?:\.guide-modal|\.trip-modal)[\s\S]*?\)\.show\s*\{[^}]*overflow-y:auto!important;/s.test(css)) fail.push('Trip/Guide leaked into ordinary popup overlay-scroll owner');
if((css.match(/body\.admin-mode #adminModeBanner\s*\{/g)||[]).length!==1) fail.push('status bar must have one owner');
if(/#expenseModal\s+\.tools-sheet\s*\{[^}]*max-height/s.test(css)) fail.push('legacy Expense max-height remains');
if(/#momentsModal\s+\.moments-sheet\s*\{[^}]*max-height/s.test(css)) fail.push('legacy Moments max-height remains');
for(const x of ['--engine-fixed-chrome-height','top:var(--engine-fixed-chrome-height)!important','overflow-y:auto!important','overflow:visible!important','pointer-events:none!important','#mamaModal.studio-view.show']) if(!css.includes(x)) fail.push('missing '+x);

if(/Ordinary popup:[\s\S]*?\.mama-modal:not\(\.studio-view\)/s.test(css)) fail.push('Traveller Selector leaked into ordinary popup ownership');
if(!/#mamaModal:not\(\.studio-view\)\.show\s*\{[^}]*position:fixed!important;[^}]*z-index:var\(--engine-traveller-layer,7700\)!important;[^}]*display:grid!important;[^}]*place-items:center!important;[^}]*isolation:isolate!important;/s.test(css)) fail.push('canonical Traveller Selector overlay owner missing');
if(!/#mamaModal:not\(\.studio-view\)\.show > \.guide-sheet\s*\{[^}]*max-height:calc\(100% - 4px\)!important;[^}]*overflow-y:auto!important;/s.test(css)) fail.push('canonical Traveller Selector sheet owner missing');
if(/\.moments-modal,\s*\n\.tools-modal,\s*\n\.mama-modal\{/s.test(css)||/\.moments-modal\.show,\s*\n\.tools-modal\.show,\s*\n\.mama-modal\.show\{/s.test(css)) fail.push('Traveller Selector leaked into legacy RC25.1.1 modal visibility repair');
if(!/body:has\(#mamaModal\.studio-view\.show\) \.app-nav\s*\{[^}]*pointer-events:none!important;[^}]*z-index:100!important;/s.test(css)) fail.push('Studio workspace must make bottom navigation non-interactive');
if(/body:has\(#mamaModal\.studio-view\.show\) \.app-nav\s*\{[^}]*visibility:hidden/s.test(css)) fail.push('RC25.4.6 regression: Studio must not hide bottom navigation (visibility:hidden) — it must remain visible and only lose interactivity');
if(!/#mamaModal\.studio-view\.show\s*\{[^}]*z-index:var\(--engine-studio-modal-layer\)!important;[^}]*isolation:isolate!important;/s.test(css)) fail.push('Studio workspace isolated overlay owner missing');
if(!/#mamaModal\.studio-view\.show \.trip-studio\s*\{[^}]*z-index:2!important;[^}]*background:/s.test(css)) fail.push('Studio card foreground owner missing');

if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('PRESENTATION SHELL OWNERSHIP: PASS');
