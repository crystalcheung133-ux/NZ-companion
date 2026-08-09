/* Travel Engine — Expenses Page Runtime
   Stage 7K-2A extracts the existing canonical Expenses workflow from script.js.
   Storage schema, global HTML handlers, calculations, copy and modal behavior remain unchanged. */

function updateExpenseMode(){
  const personal = !!document.getElementById('expensePersonal')?.checked;
  document.querySelectorAll('[data-expense-type]').forEach(btn=>btn.classList.toggle('active',btn.dataset.expenseType===(personal?'personal':'shared')));
  const splitBlock = document.getElementById('splitBetweenBlock');
  const sharedPaid = document.getElementById('sharedPaidByBlock');
  const personalPaid = document.getElementById('personalPaidForBlock');
  if(splitBlock) splitBlock.style.display = personal ? 'none' : 'block';
  if(sharedPaid) sharedPaid.hidden = personal;
  if(personalPaid) personalPaid.hidden = !personal;
  if(personal) syncConsumedIfAuto();
}
window.setExpenseType=function(type){
  const personal=document.getElementById('expensePersonal');
  if(personal) personal.checked=type==='personal';
  updateExpenseMode();
};
window.setExpenseCategory=function(category){
  const input=document.getElementById('expenseCategory');
  if(input) input.value=category;
  document.querySelectorAll('[data-category]').forEach(btn=>btn.classList.toggle('active',btn.dataset.category===category));
};
function syncConsumedIfAuto(){
  const sharedPaid = document.getElementById('expensePaidBy');
  const personalPaid = document.getElementById('expensePersonalPaidBy');
  const consumed = document.getElementById('expenseConsumedBy');
  const personal=!!document.getElementById('expensePersonal')?.checked;
  const paid=personal?personalPaid:sharedPaid;
  if(!paid || !consumed) return;
  if(consumed.dataset.manual !== 'true') consumed.value = paid.value;
}
window.syncPersonalPayer=function(){
  const personalPaid=document.getElementById('expensePersonalPaidBy');
  const sharedPaid=document.getElementById('expensePaidBy');
  if(personalPaid&&sharedPaid) sharedPaid.value=personalPaid.value;
  syncConsumedIfAuto();
};
function markConsumedManual(){
  const consumed = document.getElementById('expenseConsumedBy');
  if(consumed) consumed.dataset.manual = 'true';
}

/* Stage 4C-6: legacy top-level Expenses handlers were removed.
   Active Expenses API lives in the Stage 4F-Q single canonical module
   near the end of this file. Keep closeExpenseModal as a simple modal
   utility because HTML buttons call it directly. */
function closeExpenseModal(){const m=$('expenseModal'); if(m) m.classList.remove('show'); if(typeof window.unlockExpensePage==='function') window.unlockExpensePage();}

function splitAll() {
  document.querySelectorAll('#expenseModal input[data-split]').forEach(x => x.checked = true);
  if(typeof window.updateSplitUI==='function') window.updateSplitUI();
}

function clearAllSplit() {
  document.querySelectorAll('#expenseModal input[data-split]').forEach(x => x.checked = false);
  if(typeof window.updateSplitUI==='function') window.updateSplitUI();
}

let editingExpenseIndex=null;

/* ============================================================================
   STAGE 4F-Q — EXPENSES SINGLE CANONICAL MODULE
   ----------------------------------------------------------------------------
   One active implementation owns the Expenses open/save/reset/render/edit/
   delete/history flow. Storage schema, UI copy, modal behaviour and calculations
   are unchanged from the deploy-tested Stage 4F-P baseline.
   ============================================================================ */
(function(){
  const FRIEND_ORDER=(TRIP_CONFIG.participants&&TRIP_CONFIG.participants.order)||Object.keys(TRIP_CONFIG.participants?.identities||{});
  const FRIEND_FALLBACK=Object.fromEntries(Object.entries(TRIP_CONFIG.participants?.identities||{}).map(([key,value])=>[key,`${value.code} · ${value.name}`]));

  function currentUser(){
    try{return (typeof getFriend==='function' ? getFriend() : STORAGE.local.get(STORAGE_CONFIG.keys.friend)) || (TRIP_CONFIG.participants&&TRIP_CONFIG.participants.defaultKey) || Object.keys(TRIP_CONFIG.participants?.identities||{})[0] || 'unknown';}
    catch(e){return 'unknown';}
  }
  function isStudioManager(){
    try{return typeof window.isAdminMode==='function' && window.isAdminMode();}
    catch(e){return false;}
  }
  function expenseOwner(record){
    return (record&&record.createdBy) || (record&&record.paidBy) || '';
  }
  function canManageExpense(record){
    return !!record && (isStudioManager() || expenseOwner(record)===currentUser());
  }
  function labelFor(k){
    try{return (typeof FRIENDS!=='undefined' && FRIENDS[k]) ? FRIENDS[k] : (FRIEND_FALLBACK[k]||k||'');}
    catch(e){return FRIEND_FALLBACK[k]||k||'';}
  }
  function identityFor(k,compact=false){
    try{return typeof window.friendIdentityHTML==='function' ? window.friendIdentityHTML(k,compact) : escapeHTML(labelFor(k));}
    catch(e){return escapeHTML(labelFor(k));}
  }
  function syncIdentityControls(){
    document.querySelectorAll('#expenseModal select').forEach(select=>{if(FRIEND_ORDER.includes(select.value)) select.dataset.family=select.value;});
    document.querySelectorAll('#splitPickerMenu label').forEach(label=>{const input=label.querySelector('input[data-split]');const text=label.querySelector('span');if(input&&text) text.innerHTML=identityFor(input.value,true);});
  }
  function readExpenses(){
    try{return window.EXPENSE_SYNC?.readLocal ? window.EXPENSE_SYNC.readLocal() : STORAGE.local.readJSON(STORAGE_CONFIG.keys.expenses,[]);}
    catch(e){return [];}
  }
  function observeExpenseShadow(action,records){
    try{window.CCMV_EXPENSE_READ_SHADOW?.observe({action,legacyRecords:records});}
    catch(error){}
  }
  function writeExpenses(arr){
    const list=Array.isArray(arr)?arr:[];
    if(window.EXPENSE_SYNC?.writeLocal) window.EXPENSE_SYNC.writeLocal(list);
    else STORAGE.local.writeJSON(STORAGE_CONFIG.keys.expenses,list);
  }
  function timeLabel(iso){
    try{return (typeof formatTime==='function') ? formatTime(iso) : (iso?FORMATTER.dateTime(new Date(iso)):'');}
    catch(e){return iso||'';}
  }
  function setSelectValue(id,value){
    const el=document.getElementById(id); if(!el) return;
    el.value=value;
    Array.from(el.options||[]).forEach(opt=>{opt.selected=(opt.value===value);});
    try{el.dispatchEvent(new Event('change',{bubbles:true}));}catch(e){}
  }
  let expenseSplitMode='equal';
  let calculatorTargetId='expenseTotal';
  let calculatorExpression='';
  const EXPENSE_CURRENCY_PREF_KEY='travel_engine_expense_currency_pref_v1';
  let expenseCurrency='';
  let expenseRateRecord=null;
  let expenseRatePromise=null;

  function expenseCurrencyCode(record){
    return String(record?.currency||MONEY.getTripCurrency().code).toUpperCase();
  }
  function homeAmountFor(record,rateOverride){
    const amount=MONEY.normalizeAmount(record?.total);
    const code=expenseCurrencyCode(record);
    const home=MONEY.getHomeCurrency();
    if(code===home) return amount;
    const rate=Number(record?.fxRate||rateOverride||MONEY.readCachedRate()?.rate);
    return rate>0 ? MONEY.convert(amount,rate,code,home) : null;
  }
  function homeSharesFor(record,rateOverride){
    const raw=splitSharesForExpense(record);
    const code=expenseCurrencyCode(record);
    const home=MONEY.getHomeCurrency();
    if(code===home) return raw;
    const rate=Number(record?.fxRate||rateOverride||MONEY.readCachedRate()?.rate);
    if(!(rate>0)) return Object.fromEntries(Object.keys(raw).map(k=>[k,0]));
    return Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,MONEY.convert(v,rate,code,home)||0]));
  }
  function savedExpenseCurrencyPreference(){
    try{
      const value=STORAGE.local.get(EXPENSE_CURRENCY_PREF_KEY);
      return MONEY.getExpenseCurrencies().includes(String(value||'').toUpperCase())?String(value).toUpperCase():'';
    }catch(e){return '';}
  }
  function saveExpenseCurrencyPreference(code){try{STORAGE.local.set(EXPENSE_CURRENCY_PREF_KEY,code);}catch(e){}}
  function renderExpenseCurrencyToggle(){
    const box=document.getElementById('expenseCurrencyToggle');
    if(!box) return;
    const currencies=MONEY.getExpenseCurrencies();
    box.hidden=currencies.length<2;
    box.innerHTML=currencies.map(code=>`<button class="expense-currency-btn${code===expenseCurrency?' active':''}" type="button" data-expense-currency="${code}" onclick="setExpenseCurrency('${code}')">${code}</button>`).join('');
  }
  function updateExpenseFxHelper(){
    const helper=document.getElementById('expenseFxHelper');
    if(!helper) return;
    const code=expenseCurrency||MONEY.getTripCurrency().code;
    const home=MONEY.getHomeCurrency();
    const total=expenseTotalValue();
    if(code===home){helper.textContent=`Settlement currency · ${home}`;return;}
    const record=expenseRateRecord||MONEY.readCachedRate();
    const rate=Number(record?.rate);
    if(rate>0){
      const converted=MONEY.convert(total||1,rate,code,home);
      const homePerDestination=MONEY.convert(1,rate,code,home);
      const destinationPerHome=homePerDestination>0 ? (1/homePerDestination) : 0;
      const rateText=destinationPerHome>0 ? `1 ${home} ≈ ${FORMATTER.decimal(destinationPerHome,0)} ${code}` : '';
      const convertedText=total?`≈ ${FORMATTER.decimal(converted,2)} ${home}`:'';
      helper.textContent=[convertedText,rateText].filter(Boolean).join(' · ');
    }else helper.textContent='';
  }
  async function getExpenseRateRecord(){
    if(expenseRateRecord&&Number(expenseRateRecord.rate)>0) return expenseRateRecord;
    const cached=MONEY.readCachedRate();
    if(cached&&Number(cached.rate)>0) expenseRateRecord=cached;
    if(!navigator.onLine) return expenseRateRecord;
    if(!expenseRatePromise){
      expenseRatePromise=MONEY.fetchLatestRate().then(record=>{expenseRateRecord=record;MONEY.saveCachedRate(record);return record;}).catch(()=>expenseRateRecord).finally(()=>{expenseRatePromise=null;});
    }
    return expenseRatePromise;
  }
  window.setExpenseCurrency=function(code){
    const allowed=MONEY.getExpenseCurrencies();
    const normalized=String(code||'').toUpperCase();
    if(!allowed.includes(normalized)) return;
    expenseCurrency=normalized;saveExpenseCurrencyPreference(normalized);renderExpenseCurrencyToggle();updateExpenseFxHelper();window.updateSplitUI?.();
    if(normalized!==MONEY.getHomeCurrency()) getExpenseRateRecord().then(updateExpenseFxHelper);
  };

  function selectedSplitParties(){
    return [...document.querySelectorAll('#expenseModal input[data-split]:checked')].map(x=>x.value);
  }
  function expenseTotalValue(){
    return MONEY.normalizeAmount(document.getElementById('expenseTotal')?.value);
  }
  function setExportVisibility(){
    const btn=document.getElementById('expenseExportButton');
    if(!btn) return;
    const visible=typeof window.isAdminMode==='function' && window.isAdminMode();
    btn.hidden=!visible;
    btn.setAttribute('aria-hidden',String(!visible));
    btn.style.display=visible?'inline-flex':'none';
  }
  window.refreshExpenseAdminUI=setExportVisibility;
  document.addEventListener('travelengine:adminmodechange',setExportVisibility);
  function splitSharesForExpense(e){
    const amount=MONEY.normalizeAmount(e.total);
    if(e.type==='personal'){
      const who=e.consumedBy || ((e.split||[])[0]) || e.paidBy;
      return {[who]:amount};
    }
    if(e.shares && typeof e.shares==='object') return e.shares;
    const split=(e.split&&e.split.length)?e.split:[e.paidBy];
    return MONEY.equalShares(amount,split);
  }
  function expenseSummary(records){
    const arr=Array.isArray(records)?records:[];
    const personalSpend=Object.fromEntries(FRIEND_ORDER.map(k=>[k,0]));
    const balance=Object.fromEntries(FRIEND_ORDER.map(k=>[k,0]));
    const originalTotals={};
    let totalHome=0,unconverted=0;
    const fallbackRate=MONEY.readCachedRate()?.rate;
    arr.forEach(e=>{
      const code=expenseCurrencyCode(e);
      originalTotals[code]=(originalTotals[code]||0)+MONEY.normalizeAmount(e.total);
      const amount=homeAmountFor(e,fallbackRate);
      if(amount===null){unconverted++;return;}
      totalHome+=amount;
      if(!(e.paidBy in balance)) balance[e.paidBy]=0;
      balance[e.paidBy]+=amount;
      const shares=homeSharesFor(e,fallbackRate);
      Object.entries(shares).forEach(([partyId,share])=>{
        if(!(partyId in personalSpend)) personalSpend[partyId]=0;
        if(!(partyId in balance)) balance[partyId]=0;
        const shareAmount=MONEY.normalizeAmount(share);
        personalSpend[partyId]+=shareAmount;
        balance[partyId]-=shareAmount;
      });
    });
    return {total:totalHome,personalSpend,balance,originalTotals,unconverted};
  }
  function calculatorIcon(){
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm0 2v4h12V4H6Zm2 7H6v2h2v-2Zm5 0h-2v2h2v-2Zm5 0h-2v2h2v-2ZM8 16H6v2h2v-2Zm5 0h-2v2h2v-2Zm5 0h-2v2h2v-2Z"/></svg>`;
  }
  function renderCustomSplitPanel(){
    const panel=document.getElementById('customSplitPanel');
    if(!panel) return;
    const parties=selectedSplitParties();
    panel.hidden=expenseSplitMode!=='custom';
    if(panel.hidden){panel.innerHTML='';return;}
    if(!parties.length){panel.innerHTML='<p class="split-helper">Choose at least one party.</p>';return;}
    const previous={};
    panel.querySelectorAll('input[data-custom-party]').forEach(i=>previous[i.dataset.customParty]=i.value);
    panel.innerHTML=parties.map(k=>`<label class="custom-split-row"><span>${identityFor(k,true)}</span><div class="expense-money-field"><input id="customShare_${k}" data-custom-party="${k}" inputmode="decimal" type="text" value="${previous[k]??''}" placeholder="0.00" oninput="recalculateCustomSplit()" onblur="autofillCustomRemainderOnExit('${k}')"/><button class="field-clear-btn" type="button" onclick="clearExpenseField('customShare_${k}')" aria-label="Clear ${labelFor(k)} amount">Clear</button><button class="calc-open-btn remainder-btn" type="button" onclick="calculateCustomRemainder('${k}')" aria-label="Calculate remainder for ${labelFor(k)}">${calculatorIcon()}</button></div></label>`).join('')+`<p class="split-helper" id="customSplitStatus">Enter two amounts, then move to the remaining field to fill the balance automatically.</p>`;
    window.recalculateCustomSplit();
  }
  window.calculateCustomRemainder=function(targetParty){
    const total=expenseTotalValue();
    const parties=selectedSplitParties();
    if(!total) return alert('Enter the total amount first.');
    if(!parties.includes(targetParty)) return;
    let used=0;
    for(const party of parties){
      if(party===targetParty) continue;
      const raw=document.getElementById(`customShare_${party}`)?.value;
      if(raw==='' || raw==null) return alert('Fill the other selected amounts first.');
      used+=MONEY.normalizeAmount(raw);
    }
    const remainder=MONEY.remainder(total,[used]);
    if(remainder<0) return alert(`The other amounts exceed the total by ${FORMATTER.decimal(Math.abs(remainder),2)} ${MONEY.getTripCurrency().code}.`);
    const input=document.getElementById(`customShare_${targetParty}`);
    if(input){input.value=FORMATTER.decimal(remainder,2);input.dispatchEvent(new Event('input',{bubbles:true}));}
  };
  window.autofillCustomRemainderOnExit=function(sourceParty){
    const panel=document.getElementById('customSplitPanel');
    if(!panel || expenseSplitMode!=='custom') return;
    const inputs=[...panel.querySelectorAll('input[data-custom-party]')];
    const total=expenseTotalValue();
    const blanks=inputs.filter(i=>String(i.value||'').trim()==='');
    const filled=inputs.filter(i=>String(i.value||'').trim()!=='');
    if(total>0 && inputs.length>1 && blanks.length===1 && filled.length===inputs.length-1){
      const used=MONEY.sumAmounts(filled.map(i=>i.value));
      const remainder=MONEY.remainder(total,[used]);
      if(remainder>=0) blanks[0].value=FORMATTER.decimal(remainder,2);
    }
    window.recalculateCustomSplit();
  };
  function expenseVisibleBounds(){
    const vv=window.visualViewport;
    return {
      top:vv?Math.max(0,vv.offsetTop):0,
      bottom:vv?(vv.offsetTop+vv.height):window.innerHeight
    };
  }
  function positionExpenseControlAboveKeyboard(element, preferredBlock){
    if(!element) return;
    const sheet=element.closest('#expenseModal .tools-sheet');
    if(!sheet) return;
    const bounds=expenseVisibleBounds();
    const rect=element.getBoundingClientRect();
    const topGuard=bounds.top+88;
    const bottomGuard=bounds.bottom-28;
    let delta=0;
    if(rect.bottom>bottomGuard) delta=rect.bottom-bottomGuard+18;
    else if(rect.top<topGuard) delta=rect.top-topGuard-14;
    if(Math.abs(delta)>1){
      sheet.scrollTop+=delta;
      return;
    }
    if(preferredBlock==='start'&&rect.top>topGuard+70) sheet.scrollTop+=rect.top-(topGuard+20);
  }
  function revealExpenseControl(element, block){
    if(!element) return;
    const align=block||'center';
    const sheet=element.closest('#expenseModal .tools-sheet');
    const initial=()=>{
      try{element.scrollIntoView({behavior:'auto',block:align,inline:'nearest'});}catch(e){element.scrollIntoView();}
      positionExpenseControlAboveKeyboard(element,align);
    };
    requestAnimationFrame(initial);
    // Mobile keyboards animate over several frames. Re-check the nested modal scroller
    // throughout the animation instead of relying on one visualViewport resize event.
    const started=Date.now();
    const timer=setInterval(()=>{
      if(!document.body.contains(element)||Date.now()-started>1300){clearInterval(timer);return;}
      positionExpenseControlAboveKeyboard(element,align);
    },80);
    const settle=()=>positionExpenseControlAboveKeyboard(element,align);
    setTimeout(settle,40);setTimeout(settle,180);setTimeout(settle,360);setTimeout(settle,650);setTimeout(settle,1000);
    if(window.visualViewport){
      const onViewport=()=>positionExpenseControlAboveKeyboard(element,align);
      window.visualViewport.addEventListener('resize',onViewport);
      window.visualViewport.addEventListener('scroll',onViewport);
      setTimeout(()=>{
        window.visualViewport.removeEventListener('resize',onViewport);
        window.visualViewport.removeEventListener('scroll',onViewport);
      },1500);
    }
    if(sheet){
      const onSheet=()=>positionExpenseControlAboveKeyboard(element,align);
      sheet.addEventListener('scroll',onSheet,{passive:true,once:true});
    }
  }
  window.revealExpenseControl=revealExpenseControl;
  window.clearExpenseField=function(id){
    const input=document.getElementById(id);
    if(!input) return;
    input.value='';
    input.dispatchEvent(new Event('input',{bubbles:true}));
    // Focus first to trigger the keyboard, then actively scroll the modal's own
    // tools-sheet until the field sits above the final visual viewport.
    try{input.focus({preventScroll:true});}catch(e){input.focus();}
    revealExpenseControl(input,'center');
  };
  window.recalculateCustomSplit=function(){
    const panel=document.getElementById('customSplitPanel');
    if(!panel || expenseSplitMode!=='custom') return;
    const inputs=[...panel.querySelectorAll('input[data-custom-party]')];
    const total=expenseTotalValue();
    const allocated=MONEY.sumAmounts(inputs.map(i=>i.value));
    const difference=total-allocated;
    const status=document.getElementById('customSplitStatus');
    if(status){
      if(!total) status.textContent='Enter the total amount first.';
      else if(MONEY.amountsMatch(total,allocated)) status.textContent='Custom split matches the total.';
      else if(difference>0) status.textContent=`${FORMATTER.decimal(difference,2)} ${expenseCurrency||MONEY.getTripCurrency().code} remains unallocated.`;
      else status.textContent=`Over by ${FORMATTER.decimal(Math.abs(difference),2)} ${expenseCurrency||MONEY.getTripCurrency().code}.`;
      status.classList.toggle('error',difference<-.01);
      status.classList.toggle('complete',MONEY.amountsMatch(total,allocated) && total>0);
    }
  };
  window.updateSplitUI=function(){
    document.querySelectorAll('[data-split-mode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.splitMode===expenseSplitMode));
    const selected=[...document.querySelectorAll('#expenseModal input[data-split]:checked')].map(input=>input.value);
    const summary=document.getElementById('splitPickerSummary');
    if(summary){
      const names=Object.fromEntries(Object.entries(TRIP_CONFIG.participants?.identities||{}).map(([key,value])=>[key,value.name]));
      summary.innerHTML=selected.length===FRIEND_ORDER.length?'All':selected.length===0?'None':selected.map(key=>identityFor(key,true)).join('<span class="identity-plus">+</span>');
    }
    renderCustomSplitPanel();
    syncIdentityControls();
    updateExpenseFxHelper();
  };
  window.toggleSplitPicker=function(event){
    if(event) event.stopPropagation();
    const menu=document.getElementById('splitPickerMenu');
    const button=document.getElementById('splitPickerButton');
    if(!menu||!button) return;
    const opening=menu.hidden;
    menu.hidden=!opening;
    button.setAttribute('aria-expanded',opening?'true':'false');
  };
  window.closeSplitPicker=function(){
    const menu=document.getElementById('splitPickerMenu');
    const button=document.getElementById('splitPickerButton');
    if(menu) menu.hidden=true;
    if(button) button.setAttribute('aria-expanded','false');
  };
  document.addEventListener('click',window.closeSplitPicker);
  window.setExpenseSplitMode=function(mode){
    expenseSplitMode=mode==='custom'?'custom':'equal';
    window.updateSplitUI();
    if(expenseSplitMode==='custom'){
      const panel=document.getElementById('customSplitPanel');
      revealExpenseControl(panel,'start');
    }
  };
  window.openExpenseCalculator=function(targetId){
    calculatorTargetId=targetId||'expenseTotal';
    const target=document.getElementById(calculatorTargetId);
    calculatorExpression=String(target?.value||'').replace(/[^0-9.+\-*/()]/g,'');
    const display=document.getElementById('expenseCalculatorDisplay');
    if(display) display.textContent=calculatorExpression||'0';
    document.getElementById('expenseCalculatorModal')?.classList.add('show');
  };
  window.closeExpenseCalculator=function(){document.getElementById('expenseCalculatorModal')?.classList.remove('show');};
  function safeEvaluateExpression(expr){
    if(!expr || !/^[0-9.+\-*/()\s]+$/.test(expr)) throw new Error('Invalid');
    const value=Function(`"use strict";return (${expr})`)();
    if(!Number.isFinite(value)) throw new Error('Invalid');
    return value;
  }
  window.calcPress=function(key){
    if(key==='C') calculatorExpression='';
    else if(key==='⌫') calculatorExpression=calculatorExpression.slice(0,-1);
    else if(key==='='){
      try{calculatorExpression=String(Math.round(safeEvaluateExpression(calculatorExpression)*100)/100);}catch(e){calculatorExpression='';}
    }else calculatorExpression+=key;
    const display=document.getElementById('expenseCalculatorDisplay');
    if(display) display.textContent=calculatorExpression||'0';
  };
  window.useExpenseCalculatorResult=function(){
    try{
      const value=Math.round(safeEvaluateExpression(calculatorExpression)*100)/100;
      const target=document.getElementById(calculatorTargetId);
      if(target){target.value=FORMATTER.decimal(MONEY.normalizeAmount(value),2);target.dispatchEvent(new Event('input',{bubbles:true}));}
      window.closeExpenseCalculator();
    }catch(e){alert('Please complete the calculation first.');}
  };

  function resetExpenseForm(){
    editingExpenseIndex=null;
    const user=currentUser();
    const item=document.getElementById('expenseItem'); if(item) item.value='';
    window.setExpenseCategory('Meals');
    const total=document.getElementById('expenseTotal'); if(total) total.value='';
    expenseCurrency=MONEY.getTripCurrency().code;
    expenseRateRecord=MONEY.readCachedRate();
    renderExpenseCurrencyToggle();
    updateExpenseFxHelper();
    setSelectValue('expensePaidBy',user);
    setSelectValue('expensePersonalPaidBy',user);
    const personal=document.getElementById('expensePersonal'); if(personal) personal.checked=false;
    const consumed=document.getElementById('expenseConsumedBy');
    if(consumed){consumed.dataset.manual='false';setSelectValue('expenseConsumedBy',user);}
    try{splitAll();}
    catch(e){document.querySelectorAll('#expenseModal input[data-split]').forEach(x=>x.checked=true);}
    expenseSplitMode='equal';
    try{updateExpenseMode();}catch(e){}
    window.updateSplitUI();
    const title=document.getElementById('expenseModalTitle'); if(title) title.innerHTML='<span class="expense-title-emoji" aria-hidden="true">💰</span> Add expense';
    const save=document.getElementById('expenseSaveButton'); if(save) save.textContent='Save';
  }
  function expenseCard(e){
    const personal=e.type==='personal';
    const split=e.split||[];
    const consumer=e.consumedBy || split[0] || e.paidBy;
    const who=personal ? `Consumed by ${identityFor(consumer,true)}` : `${e.splitMode==='custom'?'Custom':'Equal'} split: ${split.map(k=>identityFor(k,true)).join('<span class="identity-separator">·</span>')}`;
    const latestId=e._latest?' id="latestExpenseCard"':'';
    const actions=canManageExpense(e)?`<div class="entry-actions"><button class="mini-btn" onclick="editExpense(${e._idx})">✏️ Edit</button><button class="mini-btn" onclick="deleteExpense(${e._idx})">🗑 Delete</button></div>`:`<p class="timestamp entry-owner-note">Added by ${identityFor(expenseOwner(e),true)} · View only</p>`;
    const code=expenseCurrencyCode(e);
    const home=MONEY.getHomeCurrency();
    const homeTotal=homeAmountFor(e);
    const equivalent=code!==home&&homeTotal!==null?`<p class="expense-home-equivalent">≈ ${FORMATTER.decimal(homeTotal,2)} ${home} for settlement</p>`:'';
    return `<div class="expense-card"${latestId}><strong>${escapeHTML(e.item||'')}</strong><p class="timestamp">${timeLabel(e.createdAt)}${e.editedAt?` · Edited ${timeLabel(e.editedAt)}`:''}</p><p>${FORMATTER.number(MONEY.normalizeAmount(e.total))} ${code} · Paid by ${identityFor(e.paidBy,true)}</p>${equivalent}<p>${personal?'Personal Expense':'Shared Expense'} · ${who}</p>${actions}</div>`;
  }
  let expensePageScrollY=0;
  function lockExpensePage(){
    if(document.body.classList.contains('expense-modal-open')) return;
    expensePageScrollY=window.scrollY||0;
    document.body.style.top=`-${expensePageScrollY}px`;
    document.body.classList.add('expense-modal-open');
  }
  function unlockExpensePage(){
    if(!document.body.classList.contains('expense-modal-open')) return;
    document.body.classList.remove('expense-modal-open');
    document.body.style.top='';
    window.scrollTo(0,expensePageScrollY);
  }
  window.unlockExpensePage=unlockExpensePage;
  let expenseSheetFocusScroll=0;
  document.addEventListener('focusin',event=>{
    if(!event.target.closest('#expenseModal')) return;
    const sheet=document.querySelector('#expenseModal .tools-sheet');
    if(sheet) expenseSheetFocusScroll=sheet.scrollTop;
  });
  document.addEventListener('focusout',event=>{
    if(!event.target.closest('#expenseModal')) return;
    const sheet=document.querySelector('#expenseModal .tools-sheet');
    if(sheet) setTimeout(()=>{ if(!document.activeElement?.closest('#expenseModal input, #expenseModal textarea, #expenseModal select')) sheet.scrollTop=expenseSheetFocusScroll; },80);
  });

  window.openExpenseModal=function(){
    resetExpenseForm();
    lockExpensePage();
    const modal=document.getElementById('expenseModal');
    if(modal) modal.classList.add('show');
  };

  window.saveExpense=async function(){
    const details=(document.getElementById('expenseItem')?.value||'').trim();
    const category=document.getElementById('expenseCategory')?.value || 'Other';
    const item=details || category;
    const total=MONEY.normalizeAmount(document.getElementById('expenseTotal')?.value);
    const personal=!!document.getElementById('expensePersonal')?.checked;
    const paidBy=(personal?document.getElementById('expensePersonalPaidBy')?.value:document.getElementById('expensePaidBy')?.value) || currentUser();
    const split=selectedSplitParties();
    const splitMode=personal?'personal':expenseSplitMode;
    let shares=null;
    if(!personal && splitMode==='custom'){
      shares={};
      split.forEach(k=>{shares[k]=MONEY.normalizeAmount(document.getElementById(`customShare_${k}`)?.value);});
    }
    const consumedBy=document.getElementById('expenseConsumedBy')?.value || paidBy;
    if(!total) return alert('Please enter the amount.');
    if(!personal && !split.length) return alert('Please choose who to split with.');
    if(!personal && splitMode==='custom'){
      const allocated=MONEY.sumAmounts(Object.values(shares||{}));
      if(!MONEY.amountsMatch(allocated,total)) return alert('Custom split must equal the total.');
    }


    const currency=expenseCurrency||MONEY.getTripCurrency().code;
    const homeCurrency=MONEY.getHomeCurrency();
    let fxRecord=null,fxRate=1,homeTotal=total;
    if(currency!==homeCurrency){
      fxRecord=await getExpenseRateRecord();
      fxRate=Number(fxRecord?.rate);
      if(!(fxRate>0)) return alert(`Exchange rate unavailable. Connect to the internet once, then save this ${currency} expense again.`);
      homeTotal=MONEY.convert(total,fxRate,currency,homeCurrency);
      if(!(homeTotal>=0)) return alert('Could not convert this expense for settlement.');
    }

    const arr=readExpenses();
    const now=new Date().toISOString();
    const operationIndex=editingExpenseIndex;
    const operation=operationIndex!==null?'update':'create';
    const previousRecord=operationIndex!==null&&arr[operationIndex]?Object.assign({},arr[operationIndex]):null;
    const data={item,details,category,total,currency,homeCurrency,homeTotal,fxRate:currency===homeCurrency?1:fxRate,fxRateDate:currency===homeCurrency?'':String(fxRecord?.date||''),fxRateSource:currency===homeCurrency?'native':String(fxRecord?.source||'cached'),paidBy,type:personal?'personal':'shared',split:personal?[consumedBy]:split,splitMode,shares:personal?null:shares,consumedBy:personal?consumedBy:null,createdAt:now,updatedAt:now,createdBy:currentUser(),editedBy:currentUser()};
    if(editingExpenseIndex!==null && arr[editingExpenseIndex]){
      data.id=arr[editingExpenseIndex].id;
      data.createdAt=arr[editingExpenseIndex].createdAt || now;
      data.createdBy=arr[editingExpenseIndex].createdBy || arr[editingExpenseIndex].paidBy || currentUser();
      data.editedAt=now;
      data.updatedAt=now;
      arr[editingExpenseIndex]=data;
      editingExpenseIndex=null;
    }else{
      arr.push(data);
    }
    writeExpenses(arr);
    window.EXPENSE_SYNC?.queueSync();
    try{
      window.CCMV_EXPENSE_DUAL_WRITE?.afterLegacyWrite({
        action:operation,
        legacyRecords:readExpenses(),
        targetIndex:operationIndex!==null?operationIndex:arr.length-1,
        previousRecord
      });
    }catch(error){}
    window.renderExpenses(operation);
    resetExpenseForm();
    closeExpenseModal();
    setTimeout(()=>{
      const latest=document.getElementById('latestExpenseCard');
      if(latest){
        latest.scrollIntoView({behavior:'auto',block:'center'});
        latest.classList.add('expense-card--new');
        setTimeout(()=>latest.classList.remove('expense-card--new'),1800);
      }
    },120);
  };

  window.renderExpenses=function(shadowAction){
    const pageBox=document.getElementById('expensePageList');
    const arr=readExpenses();
    observeExpenseShadow(typeof shadowAction==='string'?shadowAction:'render',arr);
    const sorted=arr.map((e,i)=>({...e,_idx:i})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).map((e,i)=>({...e,_latest:i===0}));
    if(pageBox){
      const {total,personalSpend,balance,originalTotals,unconverted}=expenseSummary(arr);
      const home=MONEY.getHomeCurrency();
      const spendHtml=FRIEND_ORDER.map(k=>`<p data-family="${k}">${identityFor(k)}<strong>${FORMATTER.decimal(personalSpend[k]||0,2)} ${home}</strong></p>`).join('');
      const balanceHtml=FRIEND_ORDER.map(k=>{const v=balance[k]||0;return `<p data-family="${k}">${identityFor(k)}<strong>${v>=0?'Receive':'Owes'} ${FORMATTER.decimal(Math.abs(v),2)} ${home}</strong></p>`;}).join('');
      const originalHtml=Object.entries(originalTotals).map(([code,value])=>`<span>${FORMATTER.number(value)} ${code}</span>`).join('');
      const pendingFx=unconverted?`<small>${unconverted} legacy expense${unconverted===1?'':'s'} waiting for an FX rate</small>`:'';
      pageBox.innerHTML=`<div class="expense-dashboard-v33 identity-dashboard"><div class="expense-total-card"><span>Trip Total · Settlement</span><strong>${FORMATTER.decimal(total,2)} ${home}</strong><div class="expense-original-totals">${originalHtml}</div>${pendingFx||'<small>Original currencies retained · final settlement in '+home+'</small>'}</div><div class="expense-focus-grid"><div class="expense-focus-card"><h3>Personal Spend</h3>${spendHtml}</div><div class="expense-focus-card"><h3>Settlement</h3>${balanceHtml}</div></div></div><div class="expense-history-block"><h3>Transaction History</h3><p class="timestamp">Newest transactions appear first.</p><div class="transaction-scroll">${sorted.length?sorted.map(expenseCard).join(''):'<p>No transactions yet.</p>'}</div></div>`;
    }
  };

  window.exportExpenseData=function(){
    if(currentUser()!==((TRIP_CONFIG.admin&&TRIP_CONFIG.admin.user)||TRIP_CONFIG.participants?.defaultKey||'unknown') || typeof window.isAdminMode!=='function' || !window.isAdminMode()) return alert('Enter Admin Mode to export the complete expense data.');
    const arr=readExpenses();
    if(!arr.length) return alert('No expense data to export yet.');
    const quote=value=>`"${String(value??'').replace(/"/g,'""')}"`;
    const {total,personalSpend,balance}=expenseSummary(arr);
    const rows=[
      [TRIP_CONFIG.exports?.expenseSummaryTitle||`${TRIP_CONFIG.tripName.toUpperCase()} EXPENSE SUMMARY`],
      [`Trip Total / Settlement ${MONEY.getHomeCurrency()}`,FORMATTER.decimal(total,2)],
      [],
      ['Personal Spend',`Amount ${MONEY.getHomeCurrency()}`],
      ...FRIEND_ORDER.map(k=>[labelFor(k),Math.round(personalSpend[k]||0)]),
      [],
      ['Settlement','Position',`Amount ${MONEY.getHomeCurrency()}`],
      ...FRIEND_ORDER.map(k=>{
        const v=balance[k]||0;
        return [labelFor(k),v>=0?'Receive':'Owes',Math.abs(Math.round(v))];
      }),
      [],
      ['TRANSACTION HISTORY'],
      ['Created At','Category','Details','Item','Original Amount','Currency',`Settlement Value ${MONEY.getHomeCurrency()}`,'FX Rate','FX Date','Paid By','Type','Split Mode','Split Between','Custom Shares','Consumed By','Edited At'],
      ...arr.map(e=>[
        e.createdAt||'',
        e.category||'',
        e.details||'',
        e.item||'',
        MONEY.normalizeAmount(e.total),
        expenseCurrencyCode(e),
        FORMATTER.decimal(homeAmountFor(e)||0,2),
        e.fxRate||'',
        e.fxRateDate||'',
        labelFor(e.paidBy),
        e.type==='personal'?'Personal':'Shared',
        e.splitMode||'equal',
        (e.split||[]).map(labelFor).join(' | '),
        Object.entries(e.shares||{}).map(([k,v])=>`${labelFor(k)}: ${FORMATTER.decimal(MONEY.normalizeAmount(v),2)}`).join(' | '),
        e.consumedBy?labelFor(e.consumedBy):'',
        e.editedAt||''
      ])
    ];
    const csv='\uFEFF'+rows.map(row=>row.map(quote).join(',')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    const date=new Date().toISOString().slice(0,10);
    a.href=url;
    const slug=String(TRIP_CONFIG.shortName||TRIP_CONFIG.destination||TRIP_CONFIG.tripName||'Trip').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'');
    a.download=`${slug||'Trip'}-Expenses-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };

  window.editExpense=function(i){
    const arr=readExpenses();
    observeExpenseShadow('edit-load',arr);
    const e=arr[i]; if(!e) return;
    editingExpenseIndex=i;
    const item=document.getElementById('expenseItem'); if(item) item.value=e.details || (e.category ? '' : (e.item||''));
    window.setExpenseCategory(e.category || 'Other');
    const total=document.getElementById('expenseTotal'); if(total) total.value=e.total||'';
    expenseCurrency=expenseCurrencyCode(e);
    expenseRateRecord=e.fxRate?{rate:Number(e.fxRate),date:e.fxRateDate||'',source:e.fxRateSource||'saved'}:MONEY.readCachedRate();
    renderExpenseCurrencyToggle();
    updateExpenseFxHelper();
    setSelectValue('expensePaidBy',e.paidBy||currentUser());
    setSelectValue('expensePersonalPaidBy',e.paidBy||currentUser());
    const personal=(e.type==='personal');
    const personalBox=document.getElementById('expensePersonal'); if(personalBox) personalBox.checked=personal;
    const consumed=document.getElementById('expenseConsumedBy');
    if(consumed){
      consumed.value=e.consumedBy || ((e.split||[])[0]) || e.paidBy || currentUser();
      consumed.dataset.manual=personal && consumed.value!==e.paidBy ? 'true':'false';
    }
    document.querySelectorAll('#expenseModal input[data-split]').forEach(x=>x.checked=(e.split||[]).includes(x.value));
    expenseSplitMode=e.splitMode==='custom'?'custom':'equal';
    try{updateExpenseMode();}catch(e){}
    window.updateSplitUI();
    if(expenseSplitMode==='custom' && e.shares){
      Object.entries(e.shares).forEach(([k,v])=>{const input=document.getElementById(`customShare_${k}`);if(input&&!input.readOnly) input.value=FORMATTER.decimal(MONEY.normalizeAmount(v),2);});
      window.updateSplitUI();
    }
    const title=document.getElementById('expenseModalTitle'); if(title) title.innerHTML='<span class="expense-title-emoji" aria-hidden="true">💰</span> Edit expense';
    const save=document.getElementById('expenseSaveButton'); if(save) save.textContent='Update Expense';
    const modal=document.getElementById('expenseModal'); if(modal) modal.classList.add('show');
  };

  window.deleteExpense=function(i){
    const arr=readExpenses();
    if(!arr[i]) return;
    if(!canManageExpense(arr[i])) return alert('Only the party that added this expense, or Trip Studio, can delete it.');
    if(!window.confirm(`Delete "${arr[i].item||'this expense'}"?\n\nThis cannot be undone.`)) return;
    const previousRecord=Object.assign({},arr[i]);
    window.EXPENSE_SYNC?.markDeleted(arr[i]);
    arr.splice(i,1);
    writeExpenses(arr);
    window.EXPENSE_SYNC?.queueSync();
    try{
      window.CCMV_EXPENSE_DUAL_WRITE?.afterLegacyWrite({
        action:'delete',legacyRecords:readExpenses(),targetIndex:i,previousRecord
      });
    }catch(error){}
    if(editingExpenseIndex===i) editingExpenseIndex=null;
    window.renderExpenses('delete');
  };

  window.resetExpenseForm=resetExpenseForm;
  document.addEventListener('travelengine:expensesyncchanged',()=>window.renderExpenses());
  document.addEventListener('travelengine:expensesyncstatus',event=>{
    const badge=document.getElementById('expenseSyncStatus');
    if(!badge)return;
    const detail=event.detail||{};
    badge.textContent=detail.message||'Saved on this device';
    badge.dataset.state=detail.status||'idle';
  });
  document.addEventListener('DOMContentLoaded',()=>{
    setExportVisibility();
    window.updateSplitUI();
    window.renderExpenses();
    if(MONEY.getExpenseCurrencies().length>1){getExpenseRateRecord().then(()=>{updateExpenseFxHelper();window.renderExpenses();});}
    const initial=window.EXPENSE_SYNC?.getState?.();
    const badge=document.getElementById('expenseSyncStatus');
    if(badge&&initial){badge.textContent=initial.message;badge.dataset.state=initial.status;}
    window.EXPENSE_SYNC?.syncNow();
  });
})();
