const fs=require('fs'),assert=require('assert');
const trip=fs.readFileSync('trip-runtime.js','utf8'),guide=fs.readFileSync('guide-runtime.js','utf8'),day=fs.readFileSync('day.html','utf8'),css=fs.readFileSync('styles.css','utf8');
assert(trip.includes("raw==='OPEN'||raw==='UNBOOKED'||raw==='DECIDE LATER'||raw==='TBD'"));
assert(trip.includes("return booking?.openLabel||'Decide later'"));
assert(guide.includes("label==='OPEN'?'open'"));
assert(day.includes("workingItems.length===0"));
assert(day.includes("OPEN DAY"));
assert(css.includes(".accommodation-status-badge--open"));
console.log('STAGE 1 OPEN STATE CONTRACT: PASS');