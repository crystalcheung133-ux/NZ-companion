const fs=require('fs'),assert=require('assert'),path=require('path');
const release=JSON.parse(fs.readFileSync('RELEASE.json','utf8'));
const cfg=fs.readFileSync('trip-config.js','utf8');
const vm=cfg.match(/version:'([^']+)'/);assert(vm,'TRIP_CONFIG version missing');
const tripVersion=vm[1];
const rc=(release.artifact_version.match(/RC(\d+\.\d+)/)||[])[1];
const engine=release.engine_version;
assert(rc&&engine,'Release RC/engine version missing');
assert.equal(tripVersion,`RC${rc}-${engine}`,'TRIP_CONFIG.version must match RELEASE identity');
const expected=`VN-RC${rc}|${engine}`;
const pages=['index.html','day.html','itinerary.html','trip.html','expenses.html','moments.html','memory.html','place.html','offline.html'];
for(const file of pages){
 const s=fs.readFileSync(file,'utf8');
 const m=s.match(/<meta name="travel-engine-build" content="([^"]+)"/);
 assert(m,`${file}: travel-engine-build meta missing`);
 assert.equal(m[1],expected,`${file}: stale travel-engine-build meta`);
}
console.log('BUILD META CONSISTENCY: PASS');
