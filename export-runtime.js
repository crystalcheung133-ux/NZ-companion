/* Travel Engine v1.0 — Stage 8B Export Center. */
(function(){
  'use strict';
  const ADMIN_USER='lee';

  function isExportAdmin(){
    return typeof getFriend==='function' && getFriend()===ADMIN_USER &&
      typeof window.isAdminMode==='function' && window.isAdminMode();
  }

  function escapeHtml(value){
    return String(value==null?'':value).replace(/[&<>"']/g,ch=>({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    })[ch]);
  }

  function buildControl(){
    const host=document.querySelector('#mamaModal .guide-sheet');
    if(!host || document.getElementById('tripExportControl')) return;
    const section=document.createElement('section');
    section.id='tripExportControl';
    section.className='trip-export-control';
    section.innerHTML=`
      <button class="trip-export-launch" type="button" onclick="openTripExportCenter()">
        <span><strong>Export Trip</strong><small>Itinerary, expenses and post-trip outputs</small></span><span aria-hidden="true">›</span>
      </button>`;
    host.appendChild(section);
  }

  function buildModal(){
    if(document.getElementById('tripExportModal')) return;
    const modal=document.createElement('div');
    modal.id='tripExportModal';
    modal.className='trip-export-modal';
    modal.setAttribute('aria-hidden','true');
    modal.innerHTML=`<div class="trip-export-sheet" role="dialog" aria-modal="true" aria-labelledby="tripExportTitle">
      <button class="trip-export-close" type="button" onclick="closeTripExportCenter()" aria-label="Close">×</button>
      <p class="kicker">POST-TRIP OUTPUTS</p>
      <h2 id="tripExportTitle">Export Trip</h2>
      <p class="lead">Keep a clean copy of the journey after the trip.</p>
      <div class="trip-export-list">
        <button type="button" onclick="exportFinalItinerary()"><span class="trip-export-icon">📄</span><span><strong>Final Itinerary</strong><small>Open a print-ready itinerary and save it as PDF.</small></span><span>›</span></button>
        <button type="button" onclick="exportExpenseSummary()"><span class="trip-export-icon">💰</span><span><strong>Expense Summary</strong><small>Download the complete expense and settlement CSV.</small></span><span>›</span></button>
        <button type="button" class="coming-soon" disabled><span class="trip-export-icon">⭐</span><span><strong>Trip Review</strong><small>Coming Soon</small></span></button>
        <button type="button" class="coming-soon" disabled><span class="trip-export-icon">📖</span><span><strong>Memory Book</strong><small>Coming Soon</small></span></button>
      </div>
    </div>`;
    modal.addEventListener('click',event=>{ if(event.target===modal) closeTripExportCenter(); });
    document.body.appendChild(modal);
  }

  function render(){
    buildControl();
    buildModal();
    const control=document.getElementById('tripExportControl');
    if(control) control.hidden=!isExportAdmin();
    if(!isExportAdmin()) closeTripExportCenter();
  }

  window.openTripExportCenter=function(){
    if(!isExportAdmin()) return alert('Enter Admin Mode to export the trip.');
    if(typeof closeFriendModal==='function') closeFriendModal();
    buildModal();
    const modal=document.getElementById('tripExportModal');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
  };
  window.closeTripExportCenter=function(){
    const modal=document.getElementById('tripExportModal');
    if(!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
  };

  window.exportExpenseSummary=function(){
    if(!isExportAdmin()) return alert('Enter Admin Mode to export the trip.');
    if(typeof window.exportExpenseData!=='function') return alert('Expense export is not available on this page.');
    window.exportExpenseData();
  };

  window.exportFinalItinerary=function(){
    if(!isExportAdmin()) return alert('Enter Admin Mode to export the trip.');
    const days=Object.keys(window.ITINERARY_DATA||ITINERARY_DATA||{}).sort((a,b)=>Number(a)-Number(b));
    if(!days.length) return alert('No itinerary data is available.');
    const title=(window.TRIP_CONFIG&&TRIP_CONFIG.tripName)||'Final Itinerary';
    const dayHtml=days.map(dayNo=>{
      const day=ITINERARY_DATA[dayNo];
      const drive=day.drive||{};
      const items=(day.items||[]).map(item=>`<article><div class="time">${escapeHtml(item.time||'')}</div><div><h3>${escapeHtml(item.title||'')}</h3>${(item.details||[]).map(detail=>`<p>${escapeHtml(detail)}</p>`).join('')}${item.route?`<p class="route">${escapeHtml(item.route)}</p>`:''}</div></article>`).join('');
      return `<section class="day"><header><p>${escapeHtml(day.kicker||`Day ${dayNo}`)}</p><h2>${escapeHtml(day.heading||day.title||'')}</h2></header>${drive.route?`<div class="drive"><strong>Today’s Drive</strong><span>${escapeHtml(drive.route)}</span>${drive.distance?`<small>${escapeHtml(drive.distance)} · ${escapeHtml(drive.drivingTime||'')}</small>`:''}</div>`:''}${items}</section>`;
    }).join('');
    const popup=window.open('','_blank');
    if(!popup) return alert('Please allow pop-ups to open the printable itinerary.');
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} — Final Itinerary</title><style>
      @page{size:A4;margin:14mm}*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#24342c;background:#fff}main{max-width:850px;margin:auto}.cover{padding:24px 0 30px;border-bottom:2px solid #24342c}.cover p,.day header p{margin:0 0 6px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#68756f}.cover h1{margin:0;font-size:34px}.cover small{display:block;margin-top:8px;color:#68756f}.day{padding:28px 0;break-before:page}.day:first-of-type{break-before:auto}.day header{margin-bottom:16px}.day h2{margin:0;font-size:25px}.drive{display:grid;gap:4px;padding:14px 16px;margin-bottom:18px;border:1px solid #cfd8d2;border-radius:12px;background:#f5f7f4}.drive small{color:#68756f}article{display:grid;grid-template-columns:92px 1fr;gap:16px;padding:14px 0;border-bottom:1px solid #e4e9e5;break-inside:avoid}.time{font-weight:700;color:#55705f}article h3{margin:0 0 7px;font-size:17px}article p{margin:4px 0;line-height:1.45}.route{color:#68756f;font-size:13px}@media print{.print-note{display:none}}
    </style></head><body><main><div class="cover"><p>CCMV TRAVEL ENGINE</p><h1>${escapeHtml(title)}</h1><small>Final Itinerary · Generated ${escapeHtml(new Date().toLocaleDateString())}</small></div>${dayHtml}</main><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));<\/script></body></html>`);
    popup.document.close();
  };

  document.addEventListener('DOMContentLoaded',render);
  document.addEventListener('travelengine:adminmodechange',render);
  document.addEventListener('travelengine:friendchange',render);
})();
