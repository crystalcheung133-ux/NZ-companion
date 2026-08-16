/* Travel Engine v1.0 — RC5.0 Native Share & Preparation Checklist. */
(function(){
  'use strict';
  const ADMIN_CONFIG=(window.TRIP_CONFIG&&TRIP_CONFIG.admin)||null;
  if(!ADMIN_CONFIG||!ADMIN_CONFIG.user){
    throw new Error('Export Centre requires TRIP_CONFIG.admin.user.');
  }
  const ADMIN_USER=ADMIN_CONFIG.user;
  const CHANGED_PLAN_KEY=(window.STORAGE_CONFIG&&STORAGE_CONFIG.keys.changedPlans)||'travel_engine_changed_plans_v1';
  function isExportAdmin(){return typeof getFriend==='function'&&getFriend()===ADMIN_USER&&typeof window.isAdminMode==='function'&&window.isAdminMode();}
  function escapeHtml(value){return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function readObject(key){const value=window.STORAGE?STORAGE.local.readJSON(key,{}):{};return value&&typeof value==='object'?value:{};}
  /* RC15: resolved through the single canonical authority (validated saved
     override, or master) rather than reading the raw override key. */
  function currentItems(dayNo,day){
    const authority=window.ITINERARY_AUTHORITY;
    const saved=authority&&typeof authority.getDayOverrideItems==='function'?authority.getDayOverrideItems(dayNo):null;
    return Array.isArray(saved)?saved:(day.items||[]);
  }
  function returnToTripStudio(){
    closeTripExportCenter();
    if(typeof window.openTripStudioPanel==='function') window.openTripStudioPanel();
    else if(typeof window.openFriendModal==='function') window.openFriendModal();
  }
  window.returnToTripStudio=returnToTripStudio;

  function buildControl(){
    const host=document.getElementById('tripStudioExports') || document.querySelector('#mamaModal .guide-sheet');
    if(!host||document.getElementById('tripExportControl'))return;
    const section=document.createElement('section');section.id='tripExportControl';section.className='trip-export-control';
    section.innerHTML='<button class="trip-export-launch" type="button" onclick="openTripExportCenter()"><span><strong>Open Export Centre</strong><small>Itinerary and expenses are available anytime.</small></span><span aria-hidden="true">›</span></button>';
    host.appendChild(section);
  }
  function buildModal(){
    if(document.getElementById('tripExportModal'))return;
    const modal=document.createElement('div');modal.id='tripExportModal';modal.className='trip-export-modal';modal.setAttribute('aria-hidden','true');
    modal.innerHTML=`<div class="trip-export-sheet" role="dialog" aria-modal="true" aria-labelledby="tripExportTitle"><button class="trip-export-close" type="button" onclick="returnToTripStudio()" aria-label="Close">×</button><p class="kicker">TRIP OUTPUTS</p><h2 id="tripExportTitle">Export Trip</h2><p class="lead">Share through the iPhone or Android share sheet, or create a printable copy.</p><div class="trip-export-list"><section class="trip-export-group" aria-labelledby="tripExportItineraryTitle"><div class="trip-export-group-head"><span class="trip-export-icon">🗓️</span><span><strong id="tripExportItineraryTitle">Itinerary</strong><small>Schedule, addresses and notes.</small></span></div><div class="trip-export-group-actions"><button type="button" onclick="shareItineraryNative()"><span aria-hidden="true">📤</span><strong>Share</strong></button><button type="button" onclick="exportFinalItinerary()"><span aria-hidden="true">📄</span><strong>Printable</strong></button></div></section><section class="trip-export-group" aria-labelledby="tripExportExpensesTitle"><div class="trip-export-group-head"><span class="trip-export-icon">🧾</span><span><strong id="tripExportExpensesTitle">Expenses</strong><small>Transactions, party totals and settlements.</small></span></div><div class="trip-export-group-actions"><button type="button" onclick="shareExpensesNative()"><span aria-hidden="true">📤</span><strong>Share</strong></button><button type="button" onclick="exportFinalExpenses()"><span aria-hidden="true">📄</span><strong>Printable</strong></button></div></section><button type="button" class="coming-soon" disabled><span class="trip-export-icon">📖</span><span><strong>Memory Book</strong><small>Coming Soon</small></span></button></div></div>`;
    modal.addEventListener('click',event=>{if(event.target===modal)returnToTripStudio();});document.body.appendChild(modal);
  }
  function render(){buildControl();buildModal();const control=document.getElementById('tripExportControl');if(control)control.hidden=!isExportAdmin();if(!isExportAdmin())closeTripExportCenter();}
  window.openTripExportCenter=function(){if(!isExportAdmin())return alert('Enter Admin Mode to export the trip.');if(typeof closeFriendModal==='function')closeFriendModal();buildModal();CCMV_MODAL.setOpen('tripExportModal',true,{openClass:'open'});};
  window.closeTripExportCenter=function(){CCMV_MODAL.setOpen('tripExportModal',false,{openClass:'open'});};
  window.exportExpenseSummary=function(){if(!isExportAdmin())return alert('Enter Admin Mode to export the trip.');if(typeof window.exportExpenseData!=='function')return alert('Expense export is not available on this page.');window.exportExpenseData();returnToTripStudio();};

  function itineraryShareText(){
    const source=GenerationSelectionAdapter.view('export').itinerary;
    const days=Object.keys(source).sort((a,b)=>Number(a)-Number(b));
    const changedPlans=readObject(CHANGED_PLAN_KEY);
    const lines=[];
    days.forEach(dayNo=>{
      const day=source[dayNo]||{};
      lines.push(`${day.kicker||`Day ${dayNo}`} — ${day.heading||day.title||''}`);
      const drive=day.drive||{};
      if(drive.route) lines.push(`Drive: ${drive.route}${drive.distance?` · ${drive.distance}`:''}${drive.drivingTime?` · ${drive.drivingTime}`:''}`);
      currentItems(dayNo,day).forEach(item=>{
        lines.push(`${item.time?item.time+' ':''}${item.title||''}`.trim());
        (Array.isArray(item.details)?item.details:[]).forEach(detail=>lines.push(`  ${detail}`));
        const changed=changedPlans[String(item.id||'')];
        if(changed&&changed.instead) lines.push(`  Changed plan: ${changed.instead}`);
      });
      lines.push('');
    });
    return lines.join('\n').trim();
  }
  window.shareItineraryNative=async function(){
    if(!isExportAdmin())return alert('Enter Admin Mode to share the trip.');
    const title=(window.TRIP_CONFIG&&TRIP_CONFIG.tripName)||'Trip Itinerary';
    const text=itineraryShareText();
    if(!text)return alert('No itinerary data is available.');
    try{
      if(navigator.share){
        const filename=String(title).replace(/[^a-z0-9]+/gi,'_').replace(/^_+|_+$/g,'')+'_Itinerary.txt';
        const file=new File([text],filename,{type:'text/plain'});
        if(navigator.canShare&&navigator.canShare({files:[file]})) await navigator.share({title,text:`${title} itinerary`,files:[file]});
        else await navigator.share({title,text});
        returnToTripStudio();
        return;
      }
      if(navigator.clipboard&&navigator.clipboard.writeText){
        await navigator.clipboard.writeText(text);
        alert('Itinerary copied. Paste it into WhatsApp, Mail or Messages.');
        returnToTripStudio();
        return;
      }
      const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();alert('Itinerary copied. Paste it into WhatsApp, Mail or Messages.');returnToTripStudio();
    }catch(error){
      if(error&&error.name==='AbortError')return;
      alert('Sharing is not available right now. Use Printable Itinerary instead.');
    }
  };

  window.exportFinalItinerary=function(){
    if(!isExportAdmin())return alert('Enter Admin Mode to export the trip.');
    const source=GenerationSelectionAdapter.view('export').itinerary;const days=Object.keys(source).sort((a,b)=>Number(a)-Number(b));if(!days.length)return alert('No itinerary data is available.');
    const changedPlans=readObject(CHANGED_PLAN_KEY);const title=(window.TRIP_CONFIG&&TRIP_CONFIG.tripName)||'Trip Itinerary';
    const dayHtml=days.map(dayNo=>{const day=source[dayNo],drive=day.drive||{};const items=currentItems(dayNo,day).map(item=>{const changed=changedPlans[String(item.id||'')];const details=Array.isArray(item.details)?item.details:[];const changeHtml=changed?`<div class="change"><strong>Changed plan</strong>${changed.reason?`<p><b>Why:</b> ${escapeHtml(changed.reason)}</p>`:''}${changed.instead?`<p><b>Went instead:</b> ${escapeHtml(changed.instead)}</p>`:''}</div>`:'';return `<article><div class="time">${escapeHtml(item.time||'')}</div><div><h3>${escapeHtml(item.title||'')}</h3>${details.map(detail=>`<p>${escapeHtml(detail)}</p>`).join('')}${changeHtml}</div></article>`;}).join('');return `<section class="day"><header><p>${escapeHtml(day.kicker||`Day ${dayNo}`)}</p><h2>${escapeHtml(day.heading||day.title||'')}</h2></header>${drive.route?`<div class="drive"><strong>Today’s Drive</strong><span>${escapeHtml(drive.route)}</span>${drive.distance?`<small>${escapeHtml(drive.distance)}${drive.drivingTime?' · '+escapeHtml(drive.drivingTime):''}</small>`:''}</div>`:''}${items}</section>`;}).join('');
    const popup=window.open('','_blank');if(!popup)return alert('Please allow pop-ups to open the itinerary.');
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} — Shareable Itinerary</title><style>@page{size:A4;margin:11mm}*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#24342c;background:#fff}.toolbar{position:sticky;top:0;z-index:5;display:flex;gap:10px;justify-content:center;padding:10px;background:#eef2ee;border-bottom:1px solid #d8dfda}.toolbar button{border:1px solid #bcc9c1;border-radius:999px;background:#fff;padding:9px 14px;font:600 14px inherit;color:#24342c}.toolbar .primary{background:#24342c;color:#fff;border-color:#24342c}main{max-width:820px;margin:auto;padding:0 18px 24px}.cover{padding:20px 0 15px;border-bottom:2px solid #24342c}.cover p,.day header p{margin:0 0 4px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#68756f}.cover h1{margin:0;font-size:27px}.cover small{display:block;margin-top:5px;color:#68756f;font-size:11px}.day{padding:17px 0 5px;break-before:page}.day:first-of-type{break-before:auto}.day header{margin-bottom:9px}.day h2{margin:0;font-size:21px}.drive{display:grid;gap:2px;padding:8px 10px;margin-bottom:6px;border-left:3px solid #789181;background:#f5f7f4;font-size:12px}.drive small{color:#68756f}article{display:grid;grid-template-columns:66px 1fr;gap:10px;padding:7px 0;border-bottom:1px solid #e4e9e5;break-inside:avoid}.time{font-weight:700;color:#55705f;font-size:12px;padding-top:1px}article h3{margin:0 0 2px;font-size:14px}article p{margin:1px 0;line-height:1.28;font-size:11px}.change{margin-top:5px;padding:5px 7px;border-left:3px solid #c47a34;background:#fff7ed}.change strong{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#8b4c18}.change p{font-size:11px}@media print{.toolbar{display:none}main{padding:0}.day{padding-top:12px}}</style></head><body><div class="toolbar"><button type="button" onclick="goBack()">← Back to Companion</button><button class="primary" type="button" onclick="window.print()">Save as PDF</button></div><main><div class="cover"><p>TRAVEL ENGINE</p><h1>${escapeHtml(title)}</h1><small>Shareable Itinerary · Generated ${escapeHtml(new Date().toLocaleDateString())}</small></div>${dayHtml}</main><script>function goBack(){if(window.opener&&!window.opener.closed){window.opener.focus();window.close();setTimeout(()=>{if(!window.closed)history.back()},120)}else{history.back()}}<\/script></body></html>`);popup.document.close();returnToTripStudio();
  };
  document.addEventListener('DOMContentLoaded',render);document.addEventListener('travelengine:adminmodechange',render);document.addEventListener('travelengine:friendchange',render);

  /* Expenses Share/Printable — deliberately self-contained (reads raw
     expense storage and recomputes its own summary) rather than reaching
     into expenses.js's private helpers, so the Expenses Engine file itself
     is not modified. Mirrors the same independent-calculation pattern the
     Vietnam Companion's Export Centre uses for its own Expenses group. */
  function expenseParticipantOrder(){return (window.TRIP_CONFIG&&TRIP_CONFIG.participants&&TRIP_CONFIG.participants.order)||Object.keys((window.TRIP_CONFIG&&TRIP_CONFIG.participants&&TRIP_CONFIG.participants.identities)||{});}
  function expenseLabelFor(k){const identities=(window.TRIP_CONFIG&&TRIP_CONFIG.participants&&TRIP_CONFIG.participants.identities)||{};const id=identities[k];return id?`${id.code} · ${id.name}`:(k||'');}
  function readExpensesRaw(){try{return (window.STORAGE&&window.STORAGE_CONFIG)?STORAGE.local.readJSON(STORAGE_CONFIG.keys.expenses,[]):[];}catch(error){return [];}}
  function expenseSplitShares(e){
    const amount=Number(e.total||0);
    const split=(e.split&&e.split.length)?e.split:[e.paidBy];
    if(e.splitMode==='custom'&&e.shares){const shares={};split.forEach(k=>{shares[k]=Number(e.shares[k]||0);});return shares;}
    const per=split.length?amount/split.length:0;const shares={};split.forEach(k=>{shares[k]=per;});return shares;
  }
  function expenseSummaryForExport(){
    const order=expenseParticipantOrder();const arr=readExpensesRaw();
    const spend=Object.fromEntries(order.map(k=>[k,0]));const balance=Object.fromEntries(order.map(k=>[k,0]));let total=0;
    arr.forEach(e=>{
      const amount=Number(e.total||0);total+=amount;
      if(!(e.paidBy in balance))balance[e.paidBy]=0;
      balance[e.paidBy]+=amount;
      if(e.type==='personal'){
        const consumer=e.consumedBy||((e.split||[])[0])||e.paidBy;
        if(!(consumer in spend))spend[consumer]=0;if(!(consumer in balance))balance[consumer]=0;
        spend[consumer]+=amount;balance[consumer]-=amount;
      }else{
        const shares=expenseSplitShares(e);
        Object.entries(shares).forEach(([k,share])=>{if(!(k in spend))spend[k]=0;if(!(k in balance))balance[k]=0;spend[k]+=share;balance[k]-=share;});
      }
    });
    return {arr,order,spend,balance,total};
  }
  function expenseSettlements(summary){
    const creditors=summary.order.map(k=>({party:k,amount:Math.max(0,Number(summary.balance[k]||0))})).filter(x=>x.amount>.01);
    const debtors=summary.order.map(k=>({party:k,amount:Math.max(0,-Number(summary.balance[k]||0))})).filter(x=>x.amount>.01);
    const rows=[];let i=0,j=0;
    while(i<debtors.length&&j<creditors.length){
      const amount=Math.min(debtors[i].amount,creditors[j].amount);
      if(amount>.01)rows.push({from:debtors[i].party,to:creditors[j].party,amount});
      debtors[i].amount-=amount;creditors[j].amount-=amount;
      if(debtors[i].amount<=.01)i++;if(creditors[j].amount<=.01)j++;
    }
    return rows;
  }
  function expenseCurrencyCode(){try{return (window.MONEY&&MONEY.getTripCurrency&&MONEY.getTripCurrency().code)||'';}catch(error){return '';}}
  function expenseMoney(value){const code=expenseCurrencyCode();return `${Math.round(Number(value||0)).toLocaleString()}${code?' '+code:''}`;}
  function expenseShareText(){
    const s=expenseSummaryForExport();
    if(!s.arr.length)return '';
    const title=(window.TRIP_CONFIG&&TRIP_CONFIG.tripName)||'Trip';
    const lines=[`${title} — Expense Summary`,`Trip total: ${expenseMoney(s.total)}`,''];
    s.order.forEach(k=>{const bal=Math.round(s.balance[k]||0);lines.push(`${expenseLabelFor(k)}: ${bal>=0?'Receive':'Owes'} ${expenseMoney(Math.abs(bal))}`);});
    lines.push('','Transaction History');
    s.arr.slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).forEach(e=>{
      const who=e.type==='personal'?expenseLabelFor(e.consumedBy||(e.split||[])[0]||e.paidBy):(e.split||[]).map(expenseLabelFor).join(', ');
      lines.push(`${e.item||'Expense'} — ${expenseMoney(e.total)} · Paid by ${expenseLabelFor(e.paidBy)} · ${e.type==='personal'?`For ${who}`:`${e.splitMode||'equal'} split: ${who}`}`);
    });
    return lines.join('\n');
  }
  window.shareExpensesNative=async function(){
    if(!isExportAdmin())return alert('Enter Admin Mode to share the trip.');
    const title=(window.TRIP_CONFIG&&TRIP_CONFIG.tripName)||'Trip Expenses';
    const text=expenseShareText();
    if(!text)return alert('No expense data to share yet.');
    try{
      if(navigator.share){
        const filename=String(title).replace(/[^a-z0-9]+/gi,'_').replace(/^_+|_+$/g,'')+'_Expenses.txt';
        const file=new File([text],filename,{type:'text/plain'});
        if(navigator.canShare&&navigator.canShare({files:[file]})) await navigator.share({title:`${title} expenses`,text:`${title} expense summary`,files:[file]});
        else await navigator.share({title:`${title} expenses`,text});
        returnToTripStudio();
        return;
      }
      if(navigator.clipboard&&navigator.clipboard.writeText){
        await navigator.clipboard.writeText(text);
        alert('Expense summary copied. Paste it into WhatsApp, Mail or Messages.');
        returnToTripStudio();
        return;
      }
      const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();alert('Expense summary copied. Paste it into WhatsApp, Mail or Messages.');returnToTripStudio();
    }catch(error){
      if(error&&error.name==='AbortError')return;
      alert('Sharing is not available right now. Use Printable Expenses instead.');
    }
  };

  window.exportFinalExpenses=function(){
    if(!isExportAdmin())return alert('Enter Admin Mode to export the trip.');
    const s=expenseSummaryForExport();
    if(!s.arr.length)return alert('No expense data to export yet.');
    const title=(window.TRIP_CONFIG&&TRIP_CONFIG.tripName)||'Trip Expenses';
    const settlements=expenseSettlements(s);
    const settlementRows=(settlements.length?settlements.map(x=>`<li><strong>${escapeHtml(expenseLabelFor(x.from))}</strong> pays <strong>${escapeHtml(expenseLabelFor(x.to))}</strong> <b>${escapeHtml(expenseMoney(x.amount))}</b></li>`):['<li><strong>Everyone is settled.</strong></li>']).join('');
    const partyRows=s.order.map(k=>{const bal=Number(s.balance[k]||0);return `<tr><td>${escapeHtml(expenseLabelFor(k))}</td><td>${escapeHtml(expenseMoney(s.spend[k]||0))}</td><td>${bal>=0?'Receives':'Owes'} ${escapeHtml(expenseMoney(Math.abs(bal)))}</td></tr>`;}).join('');
    const transactionRows=s.arr.slice().sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||''))).map(e=>{
      const personal=e.type==='personal';
      const split=(e.split&&e.split.length)?e.split:[e.paidBy];
      const mode=personal?'Personal':`${e.splitMode==='custom'?'Custom':'Equal'} shared`;
      let allocation='';
      if(personal){allocation=`<div><b>Consumed by:</b> ${escapeHtml(expenseLabelFor(e.consumedBy||split[0]||e.paidBy))}</div>`;}
      else if(e.splitMode==='custom'&&e.shares){allocation=`<div><b>Split by:</b> ${escapeHtml(split.map(expenseLabelFor).join(', '))}</div>`;}
      else{allocation=`<div><b>Split by:</b> ${escapeHtml(split.map(expenseLabelFor).join(', '))}</div>`;}
      return `<article class="expense-transaction"><div class="transaction-head"><strong>${escapeHtml(expenseMoney(e.total||0))}</strong></div><h3>${escapeHtml(e.item||'Expense')}</h3><div class="transaction-meta"><div><b>Paid by:</b> ${escapeHtml(expenseLabelFor(e.paidBy))}</div><div><b>Type:</b> ${escapeHtml(mode)}</div>${allocation}</div></article>`;
    }).join('');
    const body=`<div class="cover"><p>TRAVEL ENGINE</p><h1>${escapeHtml(title)} — Printable Expense Summary</h1><small>Generated ${escapeHtml(new Date().toLocaleString())}</small></div><section class="report-section"><p class="section-kicker">TRIP SUMMARY</p><div class="summary-grid"><div><span>Total transactions</span><strong>${s.arr.length}</strong></div><div><span>Total spend</span><strong>${escapeHtml(expenseMoney(s.total))}</strong></div><div><span>Parties</span><strong>${s.order.length}</strong></div></div></section><section class="report-section"><p class="section-kicker">SETTLEMENT SUMMARY</p><ul class="settlement-list">${settlementRows}</ul></section><section class="report-section"><p class="section-kicker">TRANSACTION HISTORY</p><div class="transaction-list">${transactionRows}</div></section><section class="report-section"><p class="section-kicker">PER PARTY SUMMARY</p><table class="party-table"><thead><tr><th>Party</th><th>Allocated spend</th><th>Net position</th></tr></thead><tbody>${partyRows}</tbody></table></section>`;
    const popup=window.open('','_blank');if(!popup)return alert('Please allow pop-ups to open the expense summary.');
    const csvAvailable=typeof window.exportExpenseData==='function';
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} — Printable Expense Summary</title><style>@page{size:A4;margin:11mm}*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#24342c;background:#fff}.toolbar{position:sticky;top:0;z-index:5;display:flex;gap:10px;justify-content:center;padding:10px;background:#eef2ee;border-bottom:1px solid #d8dfda}.toolbar button{border:1px solid #bcc9c1;border-radius:999px;background:#fff;padding:9px 14px;font:600 14px inherit;color:#24342c}.toolbar .primary{background:#24342c;color:#fff;border-color:#24342c}main{max-width:820px;margin:auto;padding:0 18px 24px}.cover{padding:20px 0 15px;border-bottom:2px solid #24342c}.cover p,.section-kicker{margin:0 0 4px;font-size:10px;letter-spacing:.13em;text-transform:uppercase;color:#68756f}.cover h1{margin:0;font-size:24px}.cover small{display:block;margin-top:6px;color:#68756f}.report-section{margin-top:20px;break-inside:avoid}.summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.summary-grid>div{padding:12px;border:1px solid #dfe7e1;border-radius:12px}.summary-grid span{display:block;font-size:10px;color:#68756f}.summary-grid strong{display:block;margin-top:4px;font-size:16px}.settlement-list{margin:8px 0 0;padding-left:20px}.settlement-list li{margin:5px 0;font-size:12px}.transaction-list{display:grid;gap:10px}.expense-transaction{padding:12px;border:1px solid #dfe7e1;border-radius:13px;break-inside:avoid}.transaction-head{display:flex;justify-content:flex-end}.transaction-head strong{font-size:14px}.expense-transaction h3{margin:6px 0;font-size:14px}.transaction-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 12px;font-size:11px;line-height:1.35}.party-table{width:100%;border-collapse:collapse;font-size:11px}.party-table th,.party-table td{text-align:left;padding:8px;border-bottom:1px solid #dfe7e1}.party-table th{font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#68756f}@media(max-width:600px){.summary-grid{grid-template-columns:1fr}.transaction-meta{grid-template-columns:1fr}}@media print{.toolbar{display:none}main{padding:0}}</style></head><body><div class="toolbar"><button type="button" onclick="goBack()">← Back to Companion</button>${csvAvailable?'<button type="button" onclick="window.opener&&window.opener.exportExpenseData&&window.opener.exportExpenseData()">Download CSV</button>':''}<button class="primary" type="button" onclick="window.print()">Save as PDF</button></div><main>${body}</main><script>function goBack(){if(window.opener&&!window.opener.closed){window.opener.focus();window.close();setTimeout(()=>{if(!window.closed)history.back()},120)}else{history.back()}}<\/script></body></html>`);
    popup.document.close();
    returnToTripStudio();
  };
})();

