/* Travel Engine — Shared Expense Notifications
   Lightweight private-trip UX: on each device/family, show newly synced
   shared expenses created by another family once. No push service required. */
(function(root){
  'use strict';
  const PREFIX='travel_engine_expense_notice_seen_v1:';
  const INIT_PREFIX='travel_engine_expense_notice_init_v1:';
  let timer=null;

  function family(){
    try{return (typeof root.getFriend==='function'?root.getFriend():null)||root.TRIP_CONFIG?.participants?.defaultKey||'';}
    catch(e){return '';}
  }
  function readExpenses(){
    try{return root.EXPENSE_SYNC?.readLocal?.()||[];}catch(e){return [];}
  }
  function key(name,f){return name+String(f||family());}
  function readSet(f){
    try{return new Set(JSON.parse(localStorage.getItem(key(PREFIX,f))||'[]'));}catch(e){return new Set();}
  }
  function writeSet(f,set){
    try{localStorage.setItem(key(PREFIX,f),JSON.stringify([...set].slice(-250)));}catch(e){}
  }
  function initialized(f){try{return localStorage.getItem(key(INIT_PREFIX,f))==='1';}catch(e){return false;}}
  function markInitialized(f){try{localStorage.setItem(key(INIT_PREFIX,f),'1');}catch(e){}}
  function eligible(expense,f){
    return !!expense && expense.type==='shared' && expense.id &&
      String(expense.createdBy||expense.paidBy||'')!==String(f||'');
  }
  function labelFor(k){
    const i=root.TRIP_CONFIG?.participants?.identities?.[k];
    return i?(i.name||i.code||k):k;
  }
  function markCurrentFamilySeen(expense){
    const f=family(); if(!f||!expense?.id)return;
    const seen=readSet(f);seen.add(expense.id);writeSet(f,seen);
  }
  function prime(f){
    const seen=readSet(f);
    readExpenses().forEach(e=>{if(e?.id)seen.add(e.id);});
    writeSet(f,seen);markInitialized(f);
  }
  function unseen(f){
    if(!initialized(f)){prime(f);return [];}
    const seen=readSet(f);
    return readExpenses().filter(e=>eligible(e,f)&&!seen.has(e.id))
      .sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||'')));
  }
  function close(){
    document.getElementById('expenseNoticeModal')?.remove();
  }
  function show(list,f){
    if(!list.length)return;
    close();
    const newest=list[list.length-1];
    const count=list.length;
    const creator=labelFor(newest.createdBy||newest.paidBy||'');
    const amount=`${Number(newest.total||0).toFixed(2)} ${String(newest.currency||root.MONEY?.getTripCurrency?.().code||'')}`;
    const modal=document.createElement('div');
    modal.id='expenseNoticeModal';modal.className='expense-notice-modal';
    modal.innerHTML=`<div class="expense-notice-sheet" role="dialog" aria-modal="true" aria-labelledby="expenseNoticeTitle">
      <button class="expense-notice-close" type="button" aria-label="Close">×</button>
      <p class="kicker">NEW SHARED EXPENSE</p>
      <h2 id="expenseNoticeTitle">${count===1?'A new expense was added':`${count} new expenses were added`}</h2>
      <p><strong>${creator}</strong> added ${count===1?`<strong>${escapeHtml(newest.item||'Shared expense')}</strong> · ${amount}`:'new shared expenses'}.</p>
      ${newest.sourceType==='booking'?`<p class="timestamp">Linked to booking · ${escapeHtml(newest.sourceBookingTitle||'Booking')}</p>`:''}
      <div class="expense-notice-actions"><button type="button" class="pill expense-notice-later">Later</button><a class="pill expense-notice-view" href="expenses.html">View Expenses</a></div>
    </div>`;
    document.body.appendChild(modal);
    const seen=readSet(f);list.forEach(e=>seen.add(e.id));writeSet(f,seen);
    modal.querySelector('.expense-notice-close')?.addEventListener('click',close);
    modal.querySelector('.expense-notice-later')?.addEventListener('click',close);
  }
  function escapeHtml(v){return String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function checkSoon(){
    clearTimeout(timer);timer=setTimeout(()=>{
      const f=family();if(!f)return;
      const list=unseen(f);if(list.length)show(list,f);
    },220);
  }

  document.addEventListener('travelengine:expensesyncchanged',checkSoon);
  document.addEventListener('travelengine:familychange',checkSoon);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(checkSoon,900));
  else setTimeout(checkSoon,900);

  root.EXPENSE_NOTIFICATIONS=Object.freeze({check:checkSoon,markCurrentFamilySeen,prime});
})(globalThis);


/* RC25.7.45 — Expense Shareable Summary
   Read-only output layer. Does not mutate expenses, sync state, generation,
   Moments, itinerary or bookings. */
(function(root){
  'use strict';
  function expenses(){try{return root.EXPENSE_SYNC?.readLocal?.()||[];}catch(e){return [];}}
  function order(){return root.TRIP_CONFIG?.participants?.order||Object.keys(root.TRIP_CONFIG?.participants?.identities||{});}
  function label(k){const i=root.TRIP_CONFIG?.participants?.identities?.[k];return i?(i.name||i.code||k):(k||'Unknown');}
  function n(v){const x=Number(v);return Number.isFinite(x)?x:0;}
  function money(v,code){return `${n(v).toFixed(2)} ${code||''}`.trim();}
  function home(){return root.MONEY?.getHomeCurrency?.()||'AUD';}
  function currency(e){return String(e?.currency||root.MONEY?.getTripCurrency?.().code||'NZD').toUpperCase();}
  function homeAmount(e){
    if(currency(e)===home())return n(e.total);
    if(Number.isFinite(Number(e.homeTotal)))return n(e.homeTotal);
    const rate=n(e.fxRate);
    return rate>0?(root.MONEY?.convert?.(n(e.total),rate,currency(e),home())??0):0;
  }
  function rawShares(e){
    if(e.type==='personal'){
      const who=e.consumedBy||(e.split||[])[0]||e.paidBy;
      return {[who]:n(e.total)};
    }
    if(e.shares&&typeof e.shares==='object'&&Object.keys(e.shares).length)return e.shares;
    const people=(e.split&&e.split.length)?e.split:[e.paidBy];
    const each=people.length?n(e.total)/people.length:0;
    return Object.fromEntries(people.map(k=>[k,each]));
  }
  function homeShares(e){
    const shares=rawShares(e), code=currency(e);
    if(code===home())return Object.fromEntries(Object.entries(shares).map(([k,v])=>[k,n(v)]));
    const original=n(e.total), converted=homeAmount(e), factor=original?converted/original:0;
    return Object.fromEntries(Object.entries(shares).map(([k,v])=>[k,n(v)*factor]));
  }
  function summary(arr){
    const paid=Object.fromEntries(order().map(k=>[k,0]));
    const spend=Object.fromEntries(order().map(k=>[k,0]));
    const balance=Object.fromEntries(order().map(k=>[k,0]));
    let total=0;
    arr.forEach(e=>{
      const amount=homeAmount(e); total+=amount;
      if(!(e.paidBy in paid))paid[e.paidBy]=0;
      if(!(e.paidBy in balance))balance[e.paidBy]=0;
      paid[e.paidBy]+=amount; balance[e.paidBy]+=amount;
      Object.entries(homeShares(e)).forEach(([k,v])=>{
        if(!(k in spend))spend[k]=0;if(!(k in balance))balance[k]=0;
        spend[k]+=n(v);balance[k]-=n(v);
      });
    });
    return {total,paid,spend,balance};
  }
  function settlements(s){
    const creditors=Object.keys(s.balance).map(k=>({k,a:Math.max(0,n(s.balance[k]))})).filter(x=>x.a>.005);
    const debtors=Object.keys(s.balance).map(k=>({k,a:Math.max(0,-n(s.balance[k]))})).filter(x=>x.a>.005);
    const out=[];let i=0,j=0;
    while(i<debtors.length&&j<creditors.length){
      const a=Math.min(debtors[i].a,creditors[j].a);
      if(a>.005)out.push({from:debtors[i].k,to:creditors[j].k,amount:a});
      debtors[i].a-=a;creditors[j].a-=a;
      if(debtors[i].a<=.005)i++;if(creditors[j].a<=.005)j++;
    }
    return out;
  }
  function dateLabel(e){
    const iso=e.expenseDate||e.date||e.createdAt||'';
    if(!iso)return 'Date unavailable';
    try{return new Intl.DateTimeFormat('en-AU',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(iso));}
    catch(_){return String(iso).slice(0,10);}
  }
  function title(e){return e.details||e.item||e.category||'Expense';}
  function splitText(e){
    const shares=rawShares(e), code=currency(e);
    if(e.type==='personal'){
      const who=e.consumedBy||(e.split||[])[0]||e.paidBy;
      return `Personal · ${label(who)} — ${money(e.total,code)}`;
    }
    const entries=Object.entries(shares);
    if(e.splitMode==='custom'){
      return `Custom · ${entries.map(([k,v])=>`${label(k)} ${money(v,code)}`).join(' · ')}`;
    }
    return `Equal · ${entries.map(([k,v])=>`${label(k)} ${money(v,code)}`).join(' · ')}`;
  }
  function build(){
    const arr=expenses().slice().sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||'')));
    if(!arr.length)return '';
    const s=summary(arr), hc=home(), lines=[];
    lines.push(`${root.TRIP_CONFIG?.tripName||'Trip'} — EXPENSE SUMMARY`);
    lines.push(`Generated: ${new Date().toLocaleString('en-AU')}`);
    lines.push(`Settlement currency: ${hc}`);
    lines.push('');
    lines.push('════════════════════════════════');
    lines.push('TRANSACTIONS');
    lines.push('════════════════════════════════');
    arr.forEach((e,idx)=>{
      const code=currency(e), converted=homeAmount(e);
      lines.push('');
      lines.push(`TRANSACTION ${idx+1}`);
      lines.push(`Date: ${dateLabel(e)}`);
      lines.push(`Title: ${title(e)}`);
      lines.push(`Total: ${money(e.total,code)}${code!==hc?`  ≈  ${money(converted,hc)}`:''}`);
      lines.push(`Paid by: ${label(e.paidBy)}`);
      lines.push(`Split: ${splitText(e)}`);
      lines.push(`Entered by: ${label(e.createdBy||e.paidBy)}`);
      if(e.editedAt)lines.push(`Edited: ${dateLabel({createdAt:e.editedAt})}${e.editedBy?` by ${label(e.editedBy)}`:''}`);
      lines.push('────────────────────────────────');
    });
    lines.push('');
    lines.push('════════════════════════════════');
    lines.push('SPENDING SUMMARY');
    lines.push('════════════════════════════════');
    lines.push(`Trip total: ${money(s.total,hc)}`);
    lines.push('');
    order().forEach(k=>{
      lines.push(`${label(k)}`);
      lines.push(`  Paid: ${money(s.paid[k]||0,hc)}`);
      lines.push(`  Share of spending: ${money(s.spend[k]||0,hc)}`);
      const b=n(s.balance[k]);
      lines.push(`  Net: ${b>=0?'To receive':'Owes'} ${money(Math.abs(b),hc)}`);
    });
    lines.push('');
    lines.push('════════════════════════════════');
    lines.push('FINAL SETTLEMENT — WHO PAYS WHO');
    lines.push('════════════════════════════════');
    const transfers=settlements(s);
    if(transfers.length)transfers.forEach(x=>lines.push(`${label(x.from)} → ${label(x.to)}: ${money(x.amount,hc)}`));
    else lines.push('Everyone is settled.');
    return lines.join('\n');
  }
  async function share(){
    const text=build();if(!text)return alert('No expense data to share yet.');
    const title=(root.TRIP_CONFIG?.tripName||'Trip')+' Expenses';
    try{
      if(navigator.share){await navigator.share({title,text});return;}
      if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);alert('Expense summary copied. Paste it into WhatsApp, Mail or Messages.');return;}
      download();
    }catch(e){if(e?.name!=='AbortError')download();}
  }
  function download(){
    const text=build();if(!text)return alert('No expense data to export yet.');
    const blob=new Blob([text],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`NZ-Expense-Summary-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function install(){
    if(!/expenses\.html$/i.test(location.pathname)&&!document.body?.classList.contains('expenses-page'))return;
    const row=document.querySelector('.page-action-row');if(!row||document.getElementById('expenseShareSummaryButton'))return;
    const shareBtn=document.createElement('button');
    shareBtn.id='expenseShareSummaryButton';shareBtn.className='btn';shareBtn.type='button';shareBtn.textContent='📤 Share Summary';shareBtn.onclick=share;
    const exportBtn=document.createElement('button');
    exportBtn.id='expenseExportSummaryButton';exportBtn.className='btn';exportBtn.type='button';exportBtn.textContent='⬇️ Export Summary';exportBtn.onclick=download;
    row.append(shareBtn,exportBtn);
  }
  root.EXPENSE_SUMMARY_EXPORT=Object.freeze({build,share,download});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})(globalThis);
