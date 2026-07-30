/* Travel Engine v1.0 — Stage 7M modular runtime. */
/* FRONT-INTERACTION1.1 — inline home currency converter with mobile viewport stability. */
(function(){
  if(typeof MONEY==='undefined') return;
  const tripCurrency=MONEY.getTripCurrency();
  const homeCurrency=MONEY.getHomeCurrency();
  const state={base:tripCurrency.code,quote:homeCurrency,rate:null,date:'',source:'',loaded:false};

  function formatMoney(value){
    return Number.isFinite(value)?FORMATTER.decimal(value,2):'--';
  }
  function applyRateRecord(record){
    if(!record) return false;
    state.rate=Number(record.rate);
    state.date=record.date||'';
    state.source=record.source||'cached';
    return state.rate>0;
  }
  function getAmountInput(){
    return document.getElementById('currencyAmount');
  }
  function selectAll(input){
    if(!input) return;
    try{input.select();}catch(e){}
    try{input.setSelectionRange(0,input.value.length);}catch(e){}
  }
  function restoreHorizontalPosition(){
    const top=window.scrollY||document.documentElement.scrollTop||0;
    try{window.scrollTo({left:0,top,behavior:'auto'});}catch(e){window.scrollTo(0,top);}
    document.documentElement.scrollLeft=0;
    document.body.scrollLeft=0;
  }
  function settleInput(input){
    if(!input) return;
    input.blur();
    requestAnimationFrame(restoreHorizontalPosition);
    setTimeout(restoreHorizontalPosition,180);
  }
  function focusAmountInput(input){
    if(!input) return;
    try{input.focus({preventScroll:true});}catch(e){input.focus();}
    selectAll(input);
  }
  function updateCurrencyUI(){
    const amountInput=getAmountInput();
    const amount=MONEY.normalizeAmount(amountInput&&amountInput.value);
    const result=MONEY.convert(amount,state.rate,state.base,state.quote);
    const inputCode=document.getElementById('currencyInputCode');
    const direction=document.getElementById('currencyDirectionLabel');
    const resultEl=document.getElementById('currencyResult');
    const meta=document.getElementById('currencyCardMeta');
    if(inputCode) inputCode.textContent=state.base;
    if(direction) direction.textContent=`${state.base} → ${state.quote}`;
    if(resultEl) resultEl.textContent=`≈ ${result===null?'--':formatMoney(result)} ${state.quote}`;
    if(meta){
      if(state.rate){
        const unit=MONEY.convert(1,state.rate,state.base,state.quote);
        const freshness=state.source==='live'?'live':`saved ${state.date||'offline'}`;
        meta.textContent=`1 ${state.base} ≈ ${formatMoney(unit)} ${state.quote} · ${freshness}`;
      }else{
        meta.textContent='Rate unavailable';
      }
    }
  }
  async function loadCurrencyRate(){
    applyRateRecord(MONEY.readCachedRate());
    updateCurrencyUI();
    try{
      const live=await MONEY.fetchLatestRate();
      applyRateRecord(live);
      state.loaded=true;
      MONEY.saveCachedRate(live);
      updateCurrencyUI();
    }catch(e){
      state.loaded=true;
      if(!state.rate) applyRateRecord(MONEY.readCachedRate());
      updateCurrencyUI();
    }
  }
  window.swapCurrencyDirection=function(){
    const old=state.base;
    state.base=state.quote;
    state.quote=old;
    updateCurrencyUI();
    const input=getAmountInput();
    if(input) focusAmountInput(input);
  };
  document.addEventListener('DOMContentLoaded',function(){
    const input=getAmountInput();
    if(input){
      input.addEventListener('pointerdown',function(event){
        event.preventDefault();
        focusAmountInput(input);
      });
      input.addEventListener('focus',function(){setTimeout(()=>selectAll(input),0);});
      input.addEventListener('click',function(){setTimeout(()=>selectAll(input),0);});
      input.addEventListener('blur',function(){
        requestAnimationFrame(restoreHorizontalPosition);
        setTimeout(restoreHorizontalPosition,180);
      });
      input.addEventListener('input',updateCurrencyUI);
      input.addEventListener('keydown',function(event){
        if(event.key==='Enter'){
          event.preventDefault();
          settleInput(input);
        }
      });
      input.addEventListener('change',updateCurrencyUI);
    }
    if(window.visualViewport){
      let lastWidth=window.visualViewport.width;
      window.visualViewport.addEventListener('resize',function(){
        const width=window.visualViewport.width;
        if(width>=lastWidth) setTimeout(restoreHorizontalPosition,80);
        lastWidth=width;
      });
    }
    loadCurrencyRate();
  });
})();
