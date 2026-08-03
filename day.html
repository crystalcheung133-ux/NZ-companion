/* Travel Engine v1.0 — Stage 7M modular runtime. */
/* FRONT-INTERACTION1.2 — inline currency input with keyboard-safe vertical visibility and exact viewport restoration. */
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
  let focusOrigin=null;
  let visibilityTimers=[];
  function clearVisibilityTimers(){
    visibilityTimers.forEach(timer=>clearTimeout(timer));
    visibilityTimers=[];
  }
  function captureFocusOrigin(){
    if(focusOrigin) return;
    focusOrigin={
      top:window.scrollY||document.documentElement.scrollTop||0,
      left:window.scrollX||document.documentElement.scrollLeft||0
    };
  }
  function setViewportPosition(top){
    const targetTop=Number.isFinite(top)?Math.max(0,top):(window.scrollY||0);
    try{window.scrollTo({left:0,top:targetTop,behavior:'auto'});}catch(e){window.scrollTo(0,targetTop);}
    document.documentElement.scrollLeft=0;
    document.body.scrollLeft=0;
  }
  function restoreViewportPosition(){
    const top=focusOrigin?focusOrigin.top:(window.scrollY||document.documentElement.scrollTop||0);
    setViewportPosition(top);
  }
  function ensureInputVisibleVertically(input){
    if(!input||document.activeElement!==input) return;
    const viewport=window.visualViewport;
    const rect=input.getBoundingClientRect();
    const visibleTop=(viewport?viewport.offsetTop:0)+12;
    const visibleBottom=(viewport?viewport.offsetTop+viewport.height:window.innerHeight)-18;
    let delta=0;
    if(rect.bottom>visibleBottom) delta=rect.bottom-visibleBottom;
    else if(rect.top<visibleTop) delta=rect.top-visibleTop;
    const currentTop=window.scrollY||document.documentElement.scrollTop||0;
    setViewportPosition(currentTop+delta);
  }
  function scheduleInputVisibility(input){
    clearVisibilityTimers();
    [60,160,280,420].forEach(delay=>{
      visibilityTimers.push(setTimeout(()=>ensureInputVisibleVertically(input),delay));
    });
  }
  function settleInput(input){
    if(!input) return;
    clearVisibilityTimers();
    input.blur();
    requestAnimationFrame(restoreViewportPosition);
    setTimeout(restoreViewportPosition,120);
    setTimeout(()=>{restoreViewportPosition();focusOrigin=null;},320);
  }
  function focusAmountInput(input){
    if(!input) return;
    captureFocusOrigin();
    try{input.focus({preventScroll:true});}catch(e){input.focus();}
    selectAll(input);
    scheduleInputVisibility(input);
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
      input.addEventListener('focus',function(){
        captureFocusOrigin();
        setTimeout(()=>selectAll(input),0);
        scheduleInputVisibility(input);
      });
      input.addEventListener('click',function(){
        setTimeout(()=>selectAll(input),0);
        scheduleInputVisibility(input);
      });
      input.addEventListener('blur',function(){
        clearVisibilityTimers();
        requestAnimationFrame(restoreViewportPosition);
        setTimeout(restoreViewportPosition,120);
        setTimeout(()=>{restoreViewportPosition();focusOrigin=null;},320);
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
      let lastHeight=window.visualViewport.height;
      const handleViewportChange=function(){
        const active=getAmountInput();
        const height=window.visualViewport.height;
        if(active&&document.activeElement===active){
          scheduleInputVisibility(active);
        }else if(height>=lastHeight){
          requestAnimationFrame(restoreViewportPosition);
          setTimeout(restoreViewportPosition,120);
        }
        lastHeight=height;
      };
      window.visualViewport.addEventListener('resize',handleViewportChange);
      window.visualViewport.addEventListener('scroll',handleViewportChange);
    }
    loadCurrencyRate();
  });
})();
