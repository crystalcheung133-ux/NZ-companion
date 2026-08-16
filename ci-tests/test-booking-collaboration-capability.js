const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const cfg=read('trip-config.js'),perms=read('booking-permissions.js'),sync=read('booking-sync-runtime.js'),trip=read('trip-runtime.js');
assert.match(cfg,/bookingManagement:\s*Object\.freeze/,'bookingManagement config missing');
assert.match(cfg,/mode:\s*'collaborative'/,'VN must use collaborative booking mode');
assert.match(perms,/collaborative/,'collaborative permission mode missing');
assert.match(perms,/BOOKING_PERMISSIONS/,'permission API missing');
assert.match(sync,/BOOKING_SYNC/,'booking sync API missing');
assert.match(sync,/permissionMode:mode\(\)/,'permission mode not sent to backend');
assert.match(sync,/payload/,'generic payload sync missing');
assert.match(trip,/BOOKING_PERMISSIONS\.canEdit\(\)/,'booking editor is not permission-mode aware');
assert.match(trip,/BOOKING_SYNC\.push/,'booking save is not collaboration aware');
assert.match(trip,/BOOKING_SYNC\.remove/,'booking delete is not collaboration aware');
for(const file of fs.readdirSync(root).filter(x=>x.endsWith('.html'))){
 const html=read(file);
 if(html.includes('booking-authority.js')){
   assert(html.includes('booking-permissions.js'),`${file}: booking-permissions.js missing`);
   assert(html.includes('booking-sync-runtime.js'),`${file}: booking-sync-runtime.js missing`);
 }
}
console.log('BOOKING COLLABORATION CAPABILITY: PASS');
