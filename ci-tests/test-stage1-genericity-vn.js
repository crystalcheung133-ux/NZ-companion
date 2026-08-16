const fs=require('fs'),assert=require('assert');
const core=fs.readFileSync('core-runtime.js','utf8'),day=fs.readFileSync('day.html','utf8'),trip=fs.readFileSync('trip-runtime.js','utf8');
assert(core.includes('selectableFriendKeys'));
assert(core.includes('if(selectable.length===1)'));
assert(trip.includes("raw==='OPEN'||raw==='UNBOOKED'||raw==='DECIDE LATER'||raw==='TBD'"));
assert(day.includes('OPEN DAY')||day.includes("workingItems.length===0"),'open-day path missing');
console.log('STAGE 1 GENERICITY VN: PASS');