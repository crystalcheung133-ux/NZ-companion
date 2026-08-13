const fs=require('fs');
const css=fs.readFileSync(process.argv[2]||'styles.css','utf8');
const fail=[];
const checks=[
  [/#tripModal\.show,\s*#guideModal\.show\s*\{[^}]*display:grid!important;[^}]*place-items:center!important;[^}]*isolation:isolate!important;/s,'centred isolated overlay contract'],
  [/#tripModal\.show > \.trip-sheet,\s*#guideModal\.show > \.guide-sheet\s*\{[^}]*max-height:calc\(100% - 4px\)!important;[^}]*overflow-y:auto!important;/s,'bounded internally-scrollable sheet contract'],
  [/body\.guide-booking-stack-open #guideModal\.show\s*\{[^}]*z-index:/s,'Guide stack layer'],
  [/body\.guide-booking-stack-open #tripModal\.show\s*\{[^}]*z-index:calc\(/s,'Booking-above-Guide layer']
];
for(const [re,label] of checks) if(!re.test(css)) fail.push('missing '+label);
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('BOOKING/GUIDE MODAL STACKING: PASS');
