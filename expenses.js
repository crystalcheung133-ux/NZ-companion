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
  const FRIEND_ORDER=['lee','fowlers','yau'];
  const FRIEND_FALLBACK={lee:'🏙️ Lee',fowlers:'🌉 Fowlers',yau:'⚓ Yau'};

  function currentUser(){
    try{return (typeof getFriend==='function' ? getFriend() : STORAGE.local.get(STORAGE_CONFIG.keys.friend)) || 'lee';}
    catch(e){return 'crystal';}
  }
  function labelFor(k){
    try{return (typeof FRIENDS!=='undefined' && FRIENDS[k]) ? FRIENDS[k] : (FRIEND_FALLBACK[k]||k||'');}
    catch(e){return FRIEND_FALLBACK[k]||k||'';}
  }
  function readExpenses(){
    try{return STORAGE.local.readJSON(STORAGE_CONFIG.keys.expenses,[]);}
    catch(e){return [];}
  }
  function writeExpenses(arr){
    STORAGE.local.writeJSON(STORAGE_CONFIG.keys.expenses,Array.isArray(arr)?arr:[]);
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
  function updatePaidByDisplay(){
    const hidden=document.getElementById('expensePaidBy');
    const paid=hidden?.value || currentUser();
    const display=document.getElementById('paidByDisplayName');
    if(display) display.textContent=labelFor(paid);
    document.querySelectorAll('#paidByChoices button').forEach(btn=>{
      btn.classList.toggle('active',btn.dataset.friend===paid);
    });
  }
  function ensurePaidByUI(){
    const select=document.getElementById('expensePaidBy');
    if(!select) return;
    document.getElementById('paidByDisplay')?.closest('.paid-by-panel')?.remove();
    select.classList.remove('paid-by-hidden-select');
    select.removeAttribute('aria-hidden');
    select.tabIndex=0;
  }
  let expenseSplitMode='equal';
  let calculatorTargetId='expenseTotal';
  let calculatorExpression='';

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
    panel.innerHTML=parties.map(k=>`<label class="custom-split-row"><span>${labelFor(k)}</span><div class="expense-money-field"><input id="customShare_${k}" data-custom-party="${k}" inputmode="decimal" type="text" value="${previous[k]??''}" placeholder="0.00" oninput="recalculateCustomSplit()" onblur="autofillCustomRemainderOnExit('${k}')"/><button class="field-clear-btn" type="button" onclick="clearExpenseField('customShare_${k}')" aria-label="Clear ${labelFor(k)} amount">Clear</button><button class="calc-open-btn remainder-btn" type="button" onclick="calculateCustomRemainder('${k}')" aria-label="Calculate remainder for ${labelFor(k)}">${calculatorIcon()}</button></div></label>`).join('')+`<p class="split-helper" id="customSplitStatus">Enter two amounts, then move to the remaining field to fill the balance automatically.</p>`;
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
  window.clearExpenseField=function(id){
    const input=document.getElementById(id);
    if(!input) return;
    input.value='';
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.focus({preventScroll:true});
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
      else if(difference>0) status.textContent=`${FORMATTER.decimal(difference,2)} ${MONEY.getTripCurrency().code} remains unallocated.`;
      else status.textContent=`Over by ${FORMATTER.decimal(Math.abs(difference),2)} ${MONEY.getTripCurrency().code}.`;
      status.classList.toggle('error',difference<-.01);
      status.classList.toggle('complete',MONEY.amountsMatch(total,allocated) && total>0);
    }
  };
  window.updateSplitUI=function(){
    document.querySelectorAll('[data-split-mode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.splitMode===expenseSplitMode));
    const selected=[...document.querySelectorAll('#expenseModal input[data-split]:checked')].map(input=>input.value);
    const summary=document.getElementById('splitPickerSummary');
    if(summary){
      const names={lee:'Lee',fowlers:'Fowlers',yau:'Yau'};
      summary.textContent=selected.length===3?'All':selected.length===0?'None':selected.map(key=>names[key]||key).join(' + ');
    }
    renderCustomSplitPanel();
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

  function showExpenseSavedNote(){
    const sheet=document.querySelector('#expenseModal .tools-sheet');
    if(!sheet) return;
    let note=document.getElementById('expenseSavedNote');
    if(!note){
      note=document.createElement('div');
      note.id='expenseSavedNote';
      note.className='expense-saved-note';
      note.textContent='✓ Expense saved. Ready for the next one.';
      const form=sheet.querySelector('.expense-form');
      sheet.insertBefore(note,form||sheet.firstChild);
    }
    note.classList.add('show');
    setTimeout(()=>note.classList.remove('show'),1400);
  }
  function resetExpenseForm(){
    editingExpenseIndex=null;
    const user=currentUser();
    const item=document.getElementById('expenseItem'); if(item) item.value='';
    window.setExpenseCategory('Meals');
    const total=document.getElementById('expenseTotal'); if(total) total.value='';
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
    const title=document.getElementById('expenseModalTitle'); if(title) title.textContent='Add expense';
    const save=document.getElementById('expenseSaveButton'); if(save) save.textContent='Save';
    ensurePaidByUI();
    updatePaidByDisplay();
  }
  function expenseCard(e){
    const personal=e.type==='personal';
    const split=e.split||[];
    const consumer=e.consumedBy || split[0] || e.paidBy;
    const who=personal ? `Consumed by ${labelFor(consumer)}` : `${e.splitMode==='custom'?'Custom':'Equal'} split: ${split.map(labelFor).join(' · ')}`;
    const latestId=e._latest?' id="latestExpenseCard"':'';
    return `<div class="expense-card"${latestId}><strong>${escapeHTML(e.item||'')}</strong><p class="timestamp">${timeLabel(e.createdAt)}${e.editedAt?` · Edited ${timeLabel(e.editedAt)}`:''}</p><p>${FORMATTER.number(MONEY.normalizeAmount(e.total))} ${MONEY.getTripCurrency().code} · Paid by ${labelFor(e.paidBy)}</p><p>${personal?'Personal Expense':'Shared Expense'} · ${who}</p><div class="entry-actions"><button class="mini-btn" onclick="editExpense(${e._idx})">✏️ Edit</button><button class="mini-btn" onclick="deleteExpense(${e._idx})">🗑 Delete</button></div></div>`;
  }
  function ensureToolHistory(){
    const sheet=document.querySelector('#expenseModal .tools-sheet');
    if(!sheet || document.getElementById('toolTransactionHistory')) return;
    const form=sheet.querySelector('.expense-form');
    const holder=document.createElement('div');
    holder.className='tool-transaction-history';
    holder.id='toolTransactionHistory';
    if(form && form.parentNode) form.parentNode.insertBefore(holder,form.nextSibling);
    else sheet.appendChild(holder);
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
    ensurePaidByUI();
    resetExpenseForm();
    lockExpensePage();
    const modal=document.getElementById('expenseModal');
    if(modal) modal.classList.add('show');
  };

  window.saveExpense=function(){
    ensurePaidByUI();
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

    const arr=readExpenses();
    const now=new Date().toISOString();
    const data={item,details,category,total,paidBy,type:personal?'personal':'shared',split:personal?[consumedBy]:split,splitMode,shares:personal?null:shares,consumedBy:personal?consumedBy:null,createdAt:now};
    if(editingExpenseIndex!==null && arr[editingExpenseIndex]){
      data.createdAt=arr[editingExpenseIndex].createdAt || now;
      data.editedAt=now;
      arr[editingExpenseIndex]=data;
      editingExpenseIndex=null;
    }else{
      arr.push(data);
    }
    writeExpenses(arr);
    window.renderExpenses();
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

  window.renderToolTransactionHistory=function(){
    const box=document.getElementById('toolTransactionHistory');
    if(!box) return;
    const latest=readExpenses().map((e,i)=>({...e,_idx:i})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).slice(0,1);
    box.innerHTML=`<h3>Latest Transaction</h3>${latest.length?latest.map(expenseCard).join(''):'<p class="timestamp">No transactions yet.</p>'}`;
  };

  window.renderExpenses=function(){
    const pageBox=document.getElementById('expensePageList');
    const arr=readExpenses();
    const sorted=arr.map((e,i)=>({...e,_idx:i})).sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))).map((e,i)=>({...e,_latest:i===0}));
    if(pageBox){
      const total=MONEY.sumAmounts(arr.map(e=>e.total));
      const personalSpend={lee:0,fowlers:0,yau:0};
      const balance={lee:0,fowlers:0,yau:0};
      arr.forEach(e=>{
        const amount=MONEY.normalizeAmount(e.total);
        if(!balance[e.paidBy]) balance[e.paidBy]=0;
        balance[e.paidBy]+=amount;
        if(e.type==='personal'){
          const consumer=e.consumedBy || ((e.split||[])[0]) || e.paidBy;
          if(!personalSpend[consumer]) personalSpend[consumer]=0;
          if(!balance[consumer]) balance[consumer]=0;
          personalSpend[consumer]+=amount;
          balance[consumer]-=amount;
        }else{
          const shares=splitSharesForExpense(e);
          Object.entries(shares).forEach(([k,share])=>{if(!personalSpend[k]) personalSpend[k]=0;if(!balance[k]) balance[k]=0;const shareAmount=MONEY.normalizeAmount(share);personalSpend[k]+=shareAmount;balance[k]-=shareAmount;});
        }
      });
      const spendHtml=FRIEND_ORDER.map(k=>`<p>${labelFor(k)}<br><strong>${FORMATTER.number(Math.round(personalSpend[k]||0))} ${MONEY.getTripCurrency().code}</strong></p>`).join('');
      const balanceHtml=FRIEND_ORDER.map(k=>{const v=balance[k]||0;return `<p>${labelFor(k)}<br><strong>${v>=0?'Receive':'Owes'} ${FORMATTER.number(Math.abs(Math.round(v)))} ${MONEY.getTripCurrency().code}</strong></p>`;}).join('');
      pageBox.innerHTML=`<div class="expense-dashboard-v33"><div class="expense-total-card"><span>Trip Total</span><strong>${FORMATTER.number(total)} ${MONEY.getTripCurrency().code}</strong><small>Shared + personal expenses</small></div><div class="expense-focus-grid"><div class="expense-focus-card"><h3>Personal Spend</h3>${spendHtml}</div><div class="expense-focus-card"><h3>Settlement</h3>${balanceHtml}</div></div></div><div class="expense-history-block"><h3>Transaction History</h3><p class="timestamp">Newest transactions appear first.</p><div class="transaction-scroll">${sorted.length?sorted.map(expenseCard).join(''):'<p>No transactions yet.</p>'}</div></div>`;
    }
  };

  window.exportExpenseData=function(){
    if(currentUser()!=='lee' || typeof window.isAdminMode!=='function' || !window.isAdminMode()) return alert('Enter Admin Mode to export the complete expense data.');
    const arr=readExpenses();
    if(!arr.length) return alert('No expense data to export yet.');
    const quote=value=>`"${String(value??'').replace(/"/g,'""')}"`;
    const total=MONEY.sumAmounts(arr.map(e=>e.total));
    const personalSpend={lee:0,fowlers:0,yau:0};
    const balance={lee:0,fowlers:0,yau:0};
    arr.forEach(e=>{
      const amount=MONEY.normalizeAmount(e.total);
      if(!(e.paidBy in balance)) balance[e.paidBy]=0;
      balance[e.paidBy]+=amount;
      if(e.type==='personal'){
        const consumer=e.consumedBy || ((e.split||[])[0]) || e.paidBy;
        if(!(consumer in personalSpend)) personalSpend[consumer]=0;
        if(!(consumer in balance)) balance[consumer]=0;
        personalSpend[consumer]+=amount;
        balance[consumer]-=amount;
      }else{
        const shares=splitSharesForExpense(e);
        Object.entries(shares).forEach(([k,share])=>{
          if(!(k in personalSpend)) personalSpend[k]=0;
          if(!(k in balance)) balance[k]=0;
          const shareAmount=MONEY.normalizeAmount(share);
          personalSpend[k]+=shareAmount;
          balance[k]-=shareAmount;
        });
      }
    });
    const rows=[
      ['CCMV NEW ZEALAND EXPENSE SUMMARY'],
      [`Trip Total ${MONEY.getTripCurrency().code}`,Math.round(total)],
      [],
      ['Personal Spend',`Amount ${MONEY.getTripCurrency().code}`],
      ...FRIEND_ORDER.map(k=>[labelFor(k),Math.round(personalSpend[k]||0)]),
      [],
      ['Settlement','Position',`Amount ${MONEY.getTripCurrency().code}`],
      ...FRIEND_ORDER.map(k=>{
        const v=balance[k]||0;
        return [labelFor(k),v>=0?'Receive':'Owes',Math.abs(Math.round(v))];
      }),
      [],
      ['TRANSACTION HISTORY'],
      ['Created At','Category','Details','Item',`Total ${MONEY.getTripCurrency().code}`,'Paid By','Type','Split Mode','Split Between','Custom Shares','Consumed By','Edited At'],
      ...arr.map(e=>[
        e.createdAt||'',
        e.category||'',
        e.details||'',
        e.item||'',
        MONEY.normalizeAmount(e.total),
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
    a.download=`CCMV-New-Zealand-Expenses-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };

  window.editExpense=function(i){
    const arr=readExpenses();
    const e=arr[i]; if(!e) return;
    editingExpenseIndex=i;
    ensurePaidByUI();
    const item=document.getElementById('expenseItem'); if(item) item.value=e.details || (e.category ? '' : (e.item||''));
    window.setExpenseCategory(e.category || 'Other');
    const total=document.getElementById('expenseTotal'); if(total) total.value=e.total||'';
    setSelectValue('expensePaidBy',e.paidBy||'lee');
    setSelectValue('expensePersonalPaidBy',e.paidBy||'lee');
    const personal=(e.type==='personal');
    const personalBox=document.getElementById('expensePersonal'); if(personalBox) personalBox.checked=personal;
    const consumed=document.getElementById('expenseConsumedBy');
    if(consumed){
      consumed.value=e.consumedBy || ((e.split||[])[0]) || e.paidBy || 'lee';
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
    const title=document.getElementById('expenseModalTitle'); if(title) title.textContent='✏️ Edit Expense';
    const save=document.getElementById('expenseSaveButton'); if(save) save.textContent='Update Expense';
    const modal=document.getElementById('expenseModal'); if(modal) modal.classList.add('show');
    updatePaidByDisplay();
  };

  window.deleteExpense=function(i){
    const arr=readExpenses();
    if(!arr[i]) return;
    arr.splice(i,1);
    writeExpenses(arr);
    if(editingExpenseIndex===i) editingExpenseIndex=null;
    window.renderExpenses();
  };

  window.resetExpenseForm=resetExpenseForm;
  document.addEventListener('DOMContentLoaded',()=>{
    ensurePaidByUI();
    updatePaidByDisplay();
    setExportVisibility();
    window.updateSplitUI();
    window.renderExpenses();
  });
})();

