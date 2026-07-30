/* Travel Engine v1.0 — Stage 7M modular runtime. */
/* FRONT-INTERACTION1 — inline home currency converter. */
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
  function settleInput(input){
    if(!input) return;
    input.blur();
  }
  function keepInputVisible(input){
    if(!input||typeof input.scrollIntoView!=='function') return;
    setTimeout(()=>{
      try{input.scrollIntoView({block:'center',behavior:'smooth'});}catch(e){}
    },120);
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
    if(input){
      input.focus({preventScroll:true});
      selectAll(input);
      keepInputVisible(input);
    }
  };
  document.addEventListener('DOMContentLoaded',function(){
    const input=getAmountInput();
    if(input){
      input.addEventListener('focus',function(){
        setTimeout(()=>selectAll(input),0);
        keepInputVisible(input);
      });
      input.addEventListener('click',function(){setTimeout(()=>selectAll(input),0);});
      input.addEventListener('input',updateCurrencyUI);
      input.addEventListener('keydown',function(event){
        if(event.key==='Enter'){
          event.preventDefault();
          settleInput(input);
        }
      });
      input.addEventListener('change',updateCurrencyUI);
    }
    loadCurrencyRate();
  });
})();
