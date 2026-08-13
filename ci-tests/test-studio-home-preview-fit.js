const fs=require('fs');
const css=fs.readFileSync(process.argv[2]||'styles.css','utf8');
const fail=[];
function req(re,msg){ if(!re.test(css)) fail.push(msg); }
req(/--engine-studio-home-preview-scale\s*:\s*\.90\s*;/,'missing bounded Studio Home preview scale token');
req(/@media\s*\(min-width:721px\)[\s\S]*?body\.admin-mode\.home-bg\s+main\.dashboard\.home-premium\.home-v37\s*\{[\s\S]*?height\s*:\s*calc\(100dvh\s*-\s*var\(--engine-fixed-chrome-height\)\)\s*!important;[\s\S]*?max-height\s*:\s*calc\(100dvh\s*-\s*var\(--engine-fixed-chrome-height\)\)\s*!important;/,
  'Studio Home main must measure available height from persistent Studio chrome');
req(/@media\s*\(min-width:721px\)\s*and\s*\(max-height:900px\)[\s\S]*?body\.admin-mode\.home-bg\s+section\.home-brand-card\.v37-dashboard-home\s*\{[\s\S]*?scale\(var\(--engine-studio-home-preview-scale\)\)/,
  'short desktop Studio Home must use bounded preview scale');
req(/@media\s*\(min-width:721px\)\s*and\s*\(max-height:900px\)[\s\S]*?body\.admin-mode\.home-bg\s+section\.home-brand-card\.v37-dashboard-home\s*\{[\s\S]*?transform-origin\s*:\s*center\s+top\s*!important;/,
  'short desktop Studio Home preview must scale from the top edge');
if(/body\.admin-mode\.home-bg\s+section\.home-brand-card\.v37-dashboard-home\s*\{[^}]*translateY\(/s.test(css)) fail.push('Studio Home preview must not use translateY that can push hero under fixed chrome');
req(/body:has\(#mamaModal\.studio-view\.show\)\s+\.app-nav\s*\{[\s\S]*?pointer-events\s*:\s*none\s*!important;[\s\S]*?z-index\s*:\s*100\s*!important;[\s\S]*?\}/,
  'Studio app-nav visible/non-interactive contract missing');
const studioNavBlock=(css.match(/body:has\(#mamaModal\.studio-view\.show\)\s+\.app-nav\s*\{[\s\S]*?\}/)||[''])[0];
if(/display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0/.test(studioNavBlock)) fail.push('Studio must not hide app-nav');
// Guard the normal traveller Home: the fit rule must be explicitly admin-mode scoped.
if(/body\.home-bg\s+section\.home-brand-card\.v37-dashboard-home\s*\{[^}]*scale\(var\(--engine-studio-home-preview-scale\)/s.test(css)) fail.push('Studio preview scale leaked into normal Home');
if(fail.length){ console.error('STUDIO HOME PREVIEW FIT FAIL'); fail.forEach(x=>console.error(' - '+x)); process.exit(1); }
console.log('STUDIO HOME PREVIEW FIT PASS');
