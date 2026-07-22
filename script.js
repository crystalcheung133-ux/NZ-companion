/* script.js — Stage 7K-2E compatibility entry and shared startup.
   Domain behavior lives in focused runtime modules. */
document.addEventListener('DOMContentLoaded',()=>{
  updateFriendLabels();
  if(typeof renderMoments==='function') renderMoments();
  if(typeof renderUnexpected==='function') renderUnexpected();
  if(typeof renderExpenses==='function') renderExpenses();
  if(typeof loadChecklist==='function') loadChecklist();
  if(typeof renderDashboard==='function') renderDashboard();
  document.querySelectorAll('.summary-link-row').forEach(x=>x.remove());
});


/* RC16.5 — Current bottom-navigation state. */
(function(){
  function markCurrentNav(){
    var nav=document.querySelector('.app-nav');
    if(!nav)return;
    var file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    var target='trip';
    if(file==='guide.html'||file==='place.html')target='guide';
    else if(file==='day.html'||file==='itinerary.html')target='days';
    else if(file==='moments.html'||file==='memory.html')target='moments';
    else if(file==='expenses.html')target='expenses';
    var el=null;
    if(target==='trip')el=nav.querySelector('.trip-trigger');
    else if(target==='guide')el=nav.querySelector('.guide-trigger');
    else if(target==='days')el=nav.querySelector('.days-trigger');
    else if(target==='moments')el=nav.querySelector('a[href*="moments.html"]');
    else if(target==='expenses')el=nav.querySelector('a[href*="expenses.html"]');
    nav.querySelectorAll('.is-active').forEach(function(node){node.classList.remove('is-active');node.removeAttribute('aria-current');});
    if(el){el.classList.add('is-active');el.setAttribute('aria-current','page');}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',markCurrentNav,{once:true});
  else markCurrentNav();
})();
