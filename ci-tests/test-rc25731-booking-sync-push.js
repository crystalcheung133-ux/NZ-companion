const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync('booking-sync-runtime.js','utf8');
assert(src.includes('async function pushRemote(local)'), 'remote writer must have a distinct name');
assert(!/async function push\(local\)/.test(src), 'public push must not shadow remote writer');
assert(src.includes('await pushRemote(local);'), 'syncNow must call the remote writer');
assert(src.includes('async function push(){'), 'public push API missing');
console.log('RC25.7.31 BOOKING CROSS-DEVICE PUSH CONTRACT: PASS');
