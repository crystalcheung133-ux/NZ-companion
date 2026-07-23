/* script.js â€” Stage 7K-2E compatibility entry and shared startup.
   Domain behavior lives in focused runtime modules. */
function renderCanonicalDayNavigation(){
  const productionItinerary=GenerationSelectionAdapter.view('itinerary').days;
  const days=Object.keys(productionItinerary).sort((a,b)=>Number(a)-Number(b));
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const model=days.map(number=>{
    const day=productionItinerary[number]||{};
    const legend=Array.isArray(day.legend)?day.legend:[];
    const icon=(String(legend[0]||'ðŸ—“').match(/^\S+/)||['ðŸ—“'])[0];
    const date=String(day.kicker||'').split('Â·').slice(1).join('Â·').trim();
    const summary=legend.map(value=>String(value).replace(/^\S+\s*/,''));
    return {number,icon,date,heading:day.heading||`Day ${number}`,summary};
  });
  document.querySelectorAll('#daysMenu').forEach(menu=>{
    menu.innerHTML=model.map(day=>`<a href="day.html?day=${encodeURIComponent(day.number)}"><span><span class="menu-title">${esc(day.icon)} Day ${esc(day.number)}</span><span class="menu-sub">${esc(day.heading)}<br/>${esc(day.date)}</span></span><span>â€º</span></a>`).join('');
  });
  document.querySelectorAll('#canonicalDaySummary').forEach(summary=>{
    summary.innerHTML=model.map(day=>`<a href="day.html?day=${encodeURIComponent(day.number)}"><strong>Day ${esc(day.number)}</strong><span><span class="day-card-title">${esc(day.icon)} ${esc(day.heading)}</span><span class="day-card-meta">${esc(day.date)}${day.summary.length?`<br/>${esc(day.summary.join(' Â· '))}`:''}</span></span></a>`).join('');
  });
}
document.addEventListener('DOMContentLoaded',()=>{
  renderCanonicalDayNavigation();
  updateFriendLabels();
  if(typeof renderMoments==='function') renderMoments();
  if(typeof renderUnexpected==='function') renderUnexpected();
  if(typeof renderExpenses==='function') renderExpenses();
  if(typeof loadChecklist==='function') loadChecklist();
  if(typeof renderDashboard==='function') renderDashboard();
  document.querySelectorAll('.summary-link-row').forEach(x=>x.remove());
});


/* RC16.5 â€” Current bottom-navigation state. */
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


