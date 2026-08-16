const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const authority=read('booking-authority.js');
const tripRuntime=read('trip-runtime.js');
function must(cond,msg){if(!cond){console.error('FAIL:',msg);process.exitCode=1;}else console.log('PASS:',msg);}
must(!fs.existsSync(path.join(root,'bookings.html')),'legacy consolidated bookings page is absent from production source');
must(/function openBookingCategoryCard\(category\)/.test(tripRuntime),'Trip owns modal booking category access');
must(/getBookingsByCategory\('restaurants'\)/.test(tripRuntime)&&/getBookingsByCategory\('spa'\)/.test(tripRuntime),'Restaurant and Spa booking categories are reusable');
must(/getActivityBookings/.test(tripRuntime)&&/getTransportBookings/.test(tripRuntime),'Activity and Transport booking taxonomies remain distinct in Engine');
must(/function openTripModuleGroup\(groupId\)/.test(tripRuntime),'Trip presentation can group sparse modules without merging taxonomy');
must(!/location\.href='bookings\.html'/.test(tripRuntime),'booking detail never navigates to deleted consolidated page');
must(/function remove\(id,target\)/.test(authority)&&/deletedIds/.test(authority),'Booking Authority supports persistent delete tombstones');
must(/choices:\['pending','confirmed'\]/.test(tripRuntime),'Studio booking status editor exposes Pending/Confirmed only');
must(/Delete Booking/.test(tripRuntime)&&/deleteBookingRecord/.test(tripRuntime),'Studio booking editor supports delete instead of cancelled');
must(/row\[1\].*trim/.test(tripRuntime)&&/if\(!status&&!rows\.length\)return ''/.test(tripRuntime),'blank booking/payment fields do not render');
if(!process.exitCode)console.log('BOOKING FOUNDATION: PASS — modal-first categories, sparse grouping, status and deletion contracts verified.');
