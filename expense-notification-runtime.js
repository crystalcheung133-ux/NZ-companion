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
  function expenseAmount(expense){
    const code=String(expense.currency||root.MONEY?.getTripCurrency?.().code||'');
    return `${Number(expense.total||0).toFixed(2)} ${escapeHtml(code)}`;
  }
  function expenseRow(expense){
    const creator=escapeHtml(labelFor(expense.createdBy||expense.paidBy||''));
    const item=escapeHtml(expense.item||'Shared expense');
    const booking=expense.sourceType==='booking'?`<p class="timestamp expense-notice-booking">Linked to booking · ${escapeHtml(expense.sourceBookingTitle||'Booking')}</p>`:'';
    return `<article class="expense-notice-item">
      <div class="expense-notice-item-main"><strong>${item}</strong><strong>${expenseAmount(expense)}</strong></div>
      <p class="timestamp">Added by ${creator}</p>${booking}
    </article>`;
  }
  function show(list,f){
    if(!list.length)return;
    close();
    const count=list.length;
    const modal=document.createElement('div');
    modal.id='expenseNoticeModal';modal.className='expense-notice-modal';
    modal.innerHTML=`<div class="expense-notice-sheet" role="dialog" aria-modal="true" aria-labelledby="expenseNoticeTitle">
      <button class="expense-notice-close" type="button" aria-label="Close">×</button>
      <p class="kicker">NEW SHARED EXPENSE${count===1?'':'S'}</p>
      <h2 id="expenseNoticeTitle">${count===1?'A new expense was added':`${count} new expenses were added`}</h2>
      <div class="expense-notice-list">${list.map(expenseRow).join('')}</div>
      <div class="expense-notice-actions"><button type="button" class="pill expense-notice-done">Got it</button></div>
    </div>`;
    document.body.appendChild(modal);
    const seen=readSet(f);list.forEach(e=>seen.add(e.id));writeSet(f,seen);
    modal.querySelector('.expense-notice-close')?.addEventListener('click',close);
    modal.querySelector('.expense-notice-done')?.addEventListener('click',close);
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
