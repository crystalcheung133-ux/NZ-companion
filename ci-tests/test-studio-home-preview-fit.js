const fs=require('fs');
const css=fs.readFileSync(process.argv[2]||'styles.css','utf8');
const fail=[];
function req(re,msg){ if(!re.test(css)) fail.push(msg); }
req(/--engine-app-nav-clearance\s*:\s*112px\s*;/,'missing Studio app-nav clearance token');
req(/body\.admin-mode\.home-bg\s+main\.dashboard\.home-premium\.home-v37\s*\{[\s\S]*?top\s*:\s*var\(--engine-fixed-chrome-height\)\s*!important;[\s\S]*?bottom\s*:\s*var\(--engine-app-nav-clearance\)\s*!important;/,
  'Studio Home preview must be bounded between fixed top chrome and app-nav clearance');
req(/body\.admin-mode\.home-bg\s+main\.dashboard\.home-premium\.home-v37\s*\{[\s\S]*?overflow-y\s*:\s*auto\s*!important;/,
  'Studio Home preview must scroll inside its bounded rectangle on genuinely short viewports');
req(/body\.admin-mode\.home-bg\s+section\.home-brand-card\.v37-dashboard-home\s*\{[\s\S]*?transform\s*:\s*none\s*!important;/,
  'Studio Home hero must preserve natural geometry without transform hacks');
if(/--engine-studio-home-preview-scale/.test(css)) fail.push('legacy Studio preview scale token must be removed');
if(/body\.admin-mode\.home-bg\s+section\.home-brand-card\.v37-dashboard-home\s*\{[^}]*(?:translateY|scale\()/s.test(css)) fail.push('Studio Home hero must not use translateY/scale workarounds');
req(/body:has\(:is\(\.guide-modal,\.moments-modal,\.unexpected-modal,\.tools-modal,\.mama-modal,\.trip-modal\)\.show\)\s+\.app-nav\s*\{[\s\S]*?pointer-events\s*:\s*none\s*!important;[\s\S]*?z-index\s*:\s*100\s*!important;/,
  'open-popup app-nav visible/non-interactive contract missing');
const navBlocks=[...css.matchAll(/body[^\{]*\.app-nav\s*\{[\s\S]*?\}/g)].map(m=>m[0]).filter(x=>/mamaModal|admin-mode|:has/.test(x));
if(navBlocks.some(x=>/display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0/.test(x))) fail.push('Studio/modal shell must never hide app-nav');
if(fail.length){ console.error('STUDIO HOME PREVIEW BOUNDS FAIL'); fail.forEach(x=>console.error(' - '+x)); process.exit(1); }
console.log('STUDIO HOME PREVIEW BOUNDS PASS');
