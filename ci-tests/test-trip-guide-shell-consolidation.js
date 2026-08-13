const fs=require('fs');
const css=fs.readFileSync(process.argv[2]||'starter/styles.css','utf8');
const fail=[];
const must=(re,msg)=>{if(!re.test(css)) fail.push(msg)};

must(/#tripModal,\s*#guideModal\s*\{[^}]*position:fixed!important;[^}]*inset:0!important;[^}]*display:none!important;[^}]*overflow:hidden!important;[^}]*pointer-events:none!important;/s,'missing canonical hidden Trip/Guide overlay ownership');
must(/#tripModal\.show,\s*#guideModal\.show\s*\{[^}]*position:fixed!important;[^}]*inset:0!important;[^}]*display:grid!important;[^}]*place-items:center!important;[^}]*overflow:hidden!important;[^}]*pointer-events:auto!important;/s,'missing canonical open Trip/Guide overlay contract');
must(/#tripModal\.show > \.trip-sheet,\s*#guideModal\.show > \.guide-sheet\s*\{[^}]*width:min\(760px,100%\)!important;[^}]*max-height:calc\(100% - 4px\)!important;[^}]*overflow-y:auto!important;[^}]*overflow-x:hidden!important;[^}]*padding:48px 14px 12px!important;/s,'missing canonical Trip/Guide sheet geometry/scroll contract');
must(/body\.guide-booking-stack-open #guideModal\.show\s*\{[^}]*z-index:var\(--engine-modal-layer,7000\)!important;/s,'missing explicit Guide stack layer');
must(/body\.guide-booking-stack-open #tripModal\.show\s*\{[^}]*z-index:calc\(var\(--engine-modal-layer,7000\) \+ 100\)!important;/s,'missing explicit Booking-over-Guide stack layer');

const ordinaryStart=css.indexOf('/* Ordinary popup shell: overlay owns scrolling; card remains natural-height. */');
const studioStart=css.indexOf('/* Traveller Selector is a dedicated centred modal, not a Guide shell. */');
if(ordinaryStart<0||studioStart<ordinaryStart){
  fail.push('ordinary-popup ownership section not found');
}else{
  const ordinary=css.slice(ordinaryStart,studioStart);
  if(/\.trip-modal|\.guide-modal/.test(ordinary.replace(/body:has\([^)]*/g,''))) fail.push('Trip/Guide modal leaked back into ordinary overlay-scroll ownership');
  if(/\.trip-sheet/.test(ordinary)) fail.push('Trip sheet leaked back into ordinary natural-height sheet ownership');
}

for(const [re,msg] of [
  [/\.guide-modal\.show\s*\{\s*z-index:/,'legacy Guide show z-index owner reintroduced'],
  [/\.trip-modal\.show\s*\{\s*z-index:/,'legacy Trip show z-index owner reintroduced'],
  [/body\.guide-booking-stack-open #guideModal\s*\{/,'legacy Guide stack owner without .show reintroduced'],
  [/body\.guide-booking-stack-open #tripModal\s*\{/,'legacy Trip stack owner without .show reintroduced'],
  [/#guideModal \.guide-sheet,\s*#tripModal \.trip-sheet\s*\{[^}]*min-height:180px/s,'legacy RC25.1.1 Trip/Guide sheet owner reintroduced']
]) if(re.test(css)) fail.push(msg);

if(!/#mamaModal\.studio-view\.show \.guide-sheet\s*\{/.test(css)) fail.push('Studio-specific guide-sheet reuse was lost');
if(!/#guideModal \.guide-sheet\.guide-near-fit/.test(css)) fail.push('Guide near-fit adaptation was lost');
if(!/#tripModal \.trip-sheet\.trip-near-fit/.test(css)) fail.push('Trip near-fit adaptation was lost');
if(!/#guideModalContent \.guide-onepage/.test(css)) fail.push('Guide one-page content adaptation was lost');
if(!/#tripModalContent \.trip-onepage/.test(css)) fail.push('Trip one-page content adaptation was lost');

if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('TRIP / GUIDE SHELL CONSOLIDATION: PASS');
