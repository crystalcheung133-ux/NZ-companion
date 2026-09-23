(function(){
'use strict';
window.NZ_READ_ONLY_MODE=true;
function lock(){
 document.documentElement.classList.add('nz-read-only');
 document.querySelectorAll('.timeline-admin-tools,.admin-add-activity,#adminModeControl,.admin-save-bar,.booking-edit-btn,.guide-edit-btn').forEach(function(el){el.hidden=true;el.style.display='none';});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',lock,{once:true});else lock();
// Deliberately no storage, Supabase, sync, service-worker, or navigation mutation here.
})();
