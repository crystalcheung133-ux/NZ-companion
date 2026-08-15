const fs=require('fs');
const css=fs.readFileSync(process.argv[2]||'styles.css','utf8');
const fail=[];

if(/^\s*\\n\s*$/m.test(css)) fail.push('literal escaped newline token must not exist as a top-level CSS token');
if(!/:root\s*\{[^}]*--engine-modal-layer:7000;[^}]*--engine-studio-modal-layer:7600;[^}]*--engine-traveller-layer:7700;[^}]*\}/s.test(css)) fail.push('canonical presentation-shell root layer variables missing or malformed');
if(!/body :is\([\s\S]*\.moments-modal[\s\S]*\.tools-modal[\s\S]*\)\.show\s*\{[^}]*overflow-y:auto!important;/s.test(css)) fail.push('ordinary popup overlay-scroll owner missing');
if(/body :is\([\s\S]*?(?:\.guide-modal|\.trip-modal)[\s\S]*?\)\.show\s*\{[^}]*overflow-y:auto!important;/s.test(css)) fail.push('Trip/Guide leaked into ordinary popup overlay-scroll owner');
if(css.includes('adminModeBanner')) fail.push('legacy Studio status bar must be removed');
if((css.match(/body\.admin-mode \.site-nav\s*\{/g)||[]).length!==1) fail.push('Studio header must have one canonical owner');
if(!css.includes('.studio-on-badge')) fail.push('Studio ON badge owner missing');
if(/#expenseModal\s+\.tools-sheet\s*\{[^}]*max-height/s.test(css)) fail.push('legacy Expense max-height remains');
if(/#momentsModal\s+\.moments-sheet\s*\{[^}]*max-height/s.test(css)) fail.push('legacy Moments max-height remains');
for(const x of ['--engine-fixed-chrome-height','top:var(--engine-fixed-chrome-height)!important','overflow-y:auto!important','overflow:visible!important','pointer-events:none!important','#mamaModal.studio-view.show']) if(!css.includes(x)) fail.push('missing '+x);

if(/Ordinary popup:[\s\S]*?\.mama-modal:not\(\.studio-view\)/s.test(css)) fail.push('Traveller Selector leaked into ordinary popup ownership');
if(!/#mamaModal:not\(\.studio-view\)\s*\{[^}]*position:fixed!important;[^}]*z-index:var\(--engine-traveller-layer\)!important;[^}]*isolation:isolate!important;/s.test(css) || !/#mamaModal:not\(\.studio-view\)\.show\s*\{[^}]*display:grid!important;[^}]*place-items:center!important;[^}]*pointer-events:auto!important;/s.test(css)) fail.push('canonical Traveller Selector overlay owner missing');
if(!/#mamaModal:not\(\.studio-view\)\.show > \.guide-sheet\s*\{[^}]*max-height:calc\(100% - 4px\)!important;[^}]*overflow-y:auto!important;/s.test(css)) fail.push('canonical Traveller Selector sheet owner missing');
if(/\.moments-modal,\s*\n\.tools-modal,\s*\n\.mama-modal\{/s.test(css)||/\.moments-modal\.show,\s*\n\.tools-modal\.show,\s*\n\.mama-modal\.show\{/s.test(css)) fail.push('Traveller Selector leaked into legacy RC25.1.1 modal visibility repair');
if(!/body:has\(:is\(\.guide-modal,\.moments-modal,\.unexpected-modal,\.tools-modal,\.mama-modal,\.trip-modal\)\.show\) \.app-nav\s*\{[^}]*pointer-events:none!important;[^}]*z-index:100!important;/s.test(css)) fail.push('open popup/Studio must make bottom navigation non-interactive');
if(/body[^\{]*\.app-nav\s*\{[^}]*(?:visibility:hidden|display:none|opacity:0)/s.test(css)) fail.push('Studio/modal shell must not hide bottom navigation');
if(!/#mamaModal\.studio-view\.show\s*\{[^}]*z-index:var\(--engine-studio-modal-layer\)!important;[^}]*isolation:isolate!important;/s.test(css)) fail.push('Studio workspace isolated overlay owner missing');
if(!/#mamaModal\.studio-view\.show \.trip-studio\s*\{[^}]*z-index:2!important;[^}]*background:/s.test(css)) fail.push('Studio card foreground owner missing');

if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('PRESENTATION SHELL OWNERSHIP: PASS');
