const fs=require('fs');
const css=fs.readFileSync(process.argv[2]||'styles.css','utf8');
const fail=[];
if(!css.includes('Travel Engine 25.4.36 — Booking/Guide modal stacking hotfix')) fail.push('25.4.36 hotfix missing');
for(const token of [
  '#tripModal.show,',
  '#guideModal.show',
  'display:grid!important',
  'place-items:center!important',
  'isolation:isolate!important',
  '#tripModal.show > .trip-sheet',
  '#guideModal.show > .guide-sheet',
  'max-height:calc(100% - 4px)!important',
  'overflow-y:auto!important'
]) if(!css.includes(token)) fail.push('missing '+token);
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('BOOKING/GUIDE MODAL STACKING: PASS');