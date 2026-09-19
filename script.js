/* script.js — Stage 7K-2E compatibility entry and shared startup.
   Domain behavior lives in focused runtime modules. */
function renderCanonicalDayNavigation(){
  const productionItinerary=GenerationSelectionAdapter.view('itinerary').days;
  const days=Object.keys(productionItinerary).sort((a,b)=>Number(a)-Number(b));
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const model=days.map(number=>{
    const day=productionItinerary[number]||{};
    const legend=Array.isArray(day.legend)?day.legend:[];
    const icon=(String(legend[0]||'🗓').match(/^\S+/)||['🗓'])[0];
    const date=String(day.kicker||'').split('·').slice(1).join('·').trim();
    const summary=legend.map(value=>String(value).replace(/^\S+\s*/,''));
    return {number,icon,date,heading:day.heading||`Day ${number}`,summary};
  });
  document.querySelectorAll('#daysMenu').forEach(menu=>{
    menu.innerHTML=model.map(day=>`<a href="day.html?day=${encodeURIComponent(day.number)}"><span><span class="menu-title">${esc(day.icon)} Day ${esc(day.number)}</span><span class="menu-sub">${esc(day.heading)}<br/>${esc(day.date)}</span></span><span>›</span></a>`).join('');
  });
  document.querySelectorAll('#canonicalDaySummary').forEach(summary=>{
    summary.innerHTML=model.map(day=>`<a href="day.html?day=${encodeURIComponent(day.number)}"><strong>Day ${esc(day.number)}</strong><span><span class="day-card-title">${esc(day.icon)} ${esc(day.heading)}</span><span class="day-card-meta">${esc(day.date)}${day.summary.length?`<br/>${esc(day.summary.join(' · '))}`:''}</span></span></a>`).join('');
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



/* UX-POLISH1 — compact modal cards only when they miss one-screen fit by a small amount. */
function applyNearFitModal(sheet,className){
  if(!sheet)return;
  sheet.classList.remove('guide-near-fit','trip-near-fit');
  requestAnimationFrame(()=>{
    const overflow=Math.max(0,sheet.scrollHeight-sheet.clientHeight);
    if(overflow>0&&overflow<=150)sheet.classList.add(className);
  });
}
window.applyNearFitModal=applyNearFitModal;

(function(){window.openGlobalDocuments=function(){var m=document.getElementById('globalDocsModal'),f=document.getElementById('globalDocsFrame');if(!m||!f)return;if(!f.getAttribute('src')){f.onload=function(){try{f.contentWindow.scrollTo(0,0);f.contentWindow.resetDocumentsView?.()}catch(e){}};f.src='documents.html?overlay=1&v=rc25-6-3'}else{try{f.contentWindow?.scrollTo(0,0);f.contentWindow?.resetDocumentsView?.()}catch(e){}}m.classList.add('show');m.setAttribute('aria-hidden','false');document.body.classList.add('global-docs-open')};window.closeGlobalDocuments=function(){var m=document.getElementById('globalDocsModal'),f=document.getElementById('globalDocsFrame');if(!m)return;try{f?.contentWindow?.resetDocumentsView?.()}catch(e){}m.classList.remove('show');m.setAttribute('aria-hidden','true');document.body.classList.remove('global-docs-open')};document.addEventListener('click',function(e){var m=document.getElementById('globalDocsModal');if(m&&e.target===m)closeGlobalDocuments()});window.addEventListener('message',function(e){if(e.origin!==location.origin||!e.data)return;if(e.data.type==='nz-doc-upload'){var c=document.querySelector('.global-docs-close');if(c)c.style.display=e.data.open?'none':''}})})();
