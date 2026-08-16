const fs=require('fs');
const css=fs.readFileSync(process.argv[2]||'styles.css','utf8');
const admin=fs.readFileSync(process.argv[3]||'admin.js','utf8');
const fail=[];
function req(re,msg,src=css){ if(!re.test(src)) fail.push(msg); }
req(/--engine-app-nav-clearance\s*:\s*112px\s*;/,'missing Studio app-nav clearance token');
req(/--engine-studio-home-fit-scale\s*:\s*1\s*;/,'missing Studio Home fit scale token');
req(/body\.admin-mode\.home-bg\s+main\.dashboard\.home-premium\.home-v37\s*\{[\s\S]*?top\s*:\s*var\(--engine-fixed-chrome-height\)\s*!important;[\s\S]*?bottom\s*:\s*var\(--engine-app-nav-clearance\)\s*!important;/,
  'Studio Home preview must be bounded between fixed top chrome and app-nav clearance');
req(/body\.admin-mode\.home-bg\s+main\.dashboard\.home-premium\.home-v37\s*\{[\s\S]*?display\s*:\s*grid\s*!important;[\s\S]*?place-items\s*:\s*center\s*!important;[\s\S]*?overflow\s*:\s*hidden\s*!important;/,
  'desktop Studio Home preview must centre the fitted hero without internal scrolling');
req(/body\.admin-mode\.home-bg\s+section\.home-brand-card\.v37-dashboard-home\s*\{[\s\S]*?transform\s*:\s*scale\(var\(--engine-studio-home-fit-scale,1\)\)\s*!important;[\s\S]*?transform-origin\s*:\s*center center\s*!important;/,
  'Studio Home hero must use the canonical measured fit scale');
if(/body\.admin-mode\.home-bg\s+section\.home-brand-card\.v37-dashboard-home\s*\{[^}]*translateY/s.test(css)) fail.push('Studio Home hero must never use translateY');
req(/@media\(max-width:720px\)[\s\S]*?body\.admin-mode\.home-bg\s+main\.dashboard\.home-premium\.home-v37\s*\{[\s\S]*?overflow-y\s*:\s*auto\s*!important;/,
  'mobile Studio Home must retain natural scrolling');
req(/function syncStudioShellMetrics\(\)[\s\S]*?availableWidth[\s\S]*?availableHeight[\s\S]*?hero\.offsetWidth[\s\S]*?hero\.offsetHeight[\s\S]*?Math\.min\(1,availableWidth\/naturalWidth,availableHeight\/naturalHeight\)/,
  'admin runtime must measure the preview rectangle and natural hero dimensions',admin);
req(/--engine-studio-home-fit-scale[\s\S]*?Math\.floor\(fit\*1000\)\/1000/,
  'admin runtime must publish the measured fit scale',admin);
req(/window\.addEventListener\('resize',scheduleStudioShellMetrics/,
  'Studio Home fit must recompute on viewport resize',admin);
req(/body:has\(:is\(\.guide-modal,\.moments-modal,\.unexpected-modal,\.tools-modal,\.mama-modal,\.trip-modal\)\.show\)\s+\.app-nav\s*\{[\s\S]*?pointer-events\s*:\s*none\s*!important;[\s\S]*?z-index\s*:\s*100\s*!important;/,
  'open-popup app-nav visible/non-interactive contract missing');
req(/body:has\(#tripStudioModal\.show\)\s+\.app-nav\s*\{[\s\S]*?pointer-events\s*:\s*none\s*!important;[\s\S]*?z-index\s*:\s*100\s*!important;/,
  'Trip Studio app-nav visible/non-interactive contract missing');
const navBlocks=[...css.matchAll(/body[^\{]*\.app-nav\s*\{[\s\S]*?\}/g)].map(m=>m[0]).filter(x=>/mamaModal|admin-mode|:has/.test(x));
if(navBlocks.some(x=>/display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0/.test(x))) fail.push('Studio/modal shell must never hide app-nav');
if(fail.length){ console.error('STUDIO HOME FIT-TO-VIEW FAIL'); fail.forEach(x=>console.error(' - '+x)); process.exit(1); }
console.log('STUDIO HOME FIT-TO-VIEW PASS');
