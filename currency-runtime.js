/* Travel Engine v1.0 — Stage 7M modular runtime. */
/* NZ 0.6 RC11K — dashboard currency exchange */
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
  function updateCurrencyUI(){
    const amountInput=document.getElementById('currencyAmount');
    const amount=MONEY.normalizeAmount(amountInput&&amountInput.value);
    const result=MONEY.convert(amount,state.rate,state.base,state.quote);
    const card=document.getElementById('currencyCardValue');
    const meta=document.getElementById('currencyCardMeta');
    const inputCode=document.getElementById('currencyInputCode');
    const inputLabel=document.getElementById('currencyInputLabel');
    const outputLabel=document.getElementById('currencyOutputLabel');
    const resultEl=document.getElementById('currencyResult');
    const status=document.getElementById('currencyStatus');
    if(card) card.textContent=state.rate?`${tripCurrency.code} 100 ≈ ${homeCurrency} ${formatMoney(MONEY.convertToHome(100,state.rate))}`:`${tripCurrency.code} 100 ≈ ${homeCurrency} --`;
    if(meta) meta.textContent=state.rate?(state.source==='live'?`Rate date · ${state.date}`:`Last saved · ${state.date||'offline'}`):'Rate unavailable';
    if(inputCode) inputCode.textContent=state.base;
    if(inputLabel) inputLabel.textContent=state.base===tripCurrency.code?tripCurrency.name:'Australian dollar';
    if(outputLabel) outputLabel.textContent=state.quote===homeCurrency?'Australian dollar':tripCurrency.name;
    if(resultEl) resultEl.textContent=`${state.quote} ${result===null?'--':formatMoney(result)}`;
    if(status){
      if(state.rate) status.textContent=state.source==='live'?`Latest daily reference rate · ${state.date}`:`Offline rate saved from ${state.date||'the last update'}`;
      else status.textContent='Connect to the internet to load the exchange rate.';
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
  window.openCurrencyModal=function(){
    const modal=document.getElementById('currencyModal');
    if(!modal) return;
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
    document.body.classList.add('currency-modal-open');
    updateCurrencyUI();
    setTimeout(()=>{const input=document.getElementById('currencyAmount'); if(input) input.focus({preventScroll:true});},80);
  };
  window.closeCurrencyModal=function(){
    const modal=document.getElementById('currencyModal');
    if(!modal) return;
    modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('currency-modal-open');
  };
  window.swapCurrencyDirection=function(){
    const old=state.base; state.base=state.quote; state.quote=old; updateCurrencyUI();
  };
  document.addEventListener('DOMContentLoaded',function(){
    const input=document.getElementById('currencyAmount');
    if(input) input.addEventListener('input',updateCurrencyUI);
    const modal=document.getElementById('currencyModal');
    if(modal) modal.addEventListener('click',function(e){if(e.target===modal) window.closeCurrencyModal();});
    loadCurrencyRate();
  });
})();

