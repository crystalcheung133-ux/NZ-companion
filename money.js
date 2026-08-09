/* money.js — Stage 7I-2 Money Service.
   Owns currency resolution, FX cache access, rate fetching, amount
   normalisation, arithmetic helpers and currency conversion. UI rendering
   and expense settlement rules remain in script.js. */
(function(root){
  'use strict';

  function tripCurrency(){
    const currency=(root.TRIP_CONFIG&&root.TRIP_CONFIG.currency)||(root.LOCALE_CONFIG&&root.LOCALE_CONFIG.currency)||{};
    return Object.freeze({
      code:String(currency.code||'').toUpperCase(),
      symbol:String(currency.symbol||''),
      name:String(currency.name||currency.code||'')
    });
  }

  function homeCurrency(){
    return String(root.MONEY_CONFIG&&root.MONEY_CONFIG.homeCurrency||'').toUpperCase();
  }


  function currencyInfo(code){
    const normalized=String(code||'').toUpperCase();
    const trip=tripCurrency();
    const home=homeCurrency();
    if(normalized===trip.code) return trip;
    if(normalized===home) return Object.freeze({code:home,symbol:home==='AUD'?'A$':home,name:home});
    return Object.freeze({code:normalized,symbol:normalized,name:normalized});
  }

  function expenseCurrencies(){
    const trip=tripCurrency().code;
    const home=homeCurrency();
    return Object.freeze(trip===home?[home]:[home,trip]);
  }

  function settlementCurrency(){
    return String(root.MONEY_CONFIG&&root.MONEY_CONFIG.settlementCurrency||homeCurrency()).toUpperCase();
  }

  function cacheKey(){
    const config=root.MONEY_CONFIG||{};
    return `travel_engine_fx_${tripCurrency().code.toLowerCase()}_${homeCurrency().toLowerCase()}_v${Number(config.storageVersion||1)}`;
  }

  function apiUrl(){
    const config=root.MONEY_CONFIG||{};
    return `${config.apiBase}?base=${encodeURIComponent(tripCurrency().code)}&symbols=${encodeURIComponent(homeCurrency())}`;
  }

  function normalizeAmount(value){
    if(typeof value==='number') return Number.isFinite(value)?value:0;
    const cleaned=String(value==null?'':value).replace(/[^0-9.]/g,'');
    const amount=Number(cleaned);
    return Number.isFinite(amount)?amount:0;
  }

  function sumAmounts(values){
    return Array.from(values||[]).reduce((sum,value)=>sum+normalizeAmount(value),0);
  }

  function equalShares(amount,parties){
    const selected=Array.from(parties||[]).filter(Boolean);
    const total=normalizeAmount(amount);
    if(!selected.length) return {};
    const share=total/selected.length;
    return Object.fromEntries(selected.map(party=>[party,share]));
  }

  function remainder(total,usedValues){
    return normalizeAmount(total)-sumAmounts(usedValues);
  }

  function amountsMatch(left,right,tolerance){
    const allowed=Number.isFinite(Number(tolerance))?Math.abs(Number(tolerance)):0.01;
    return Math.abs(normalizeAmount(left)-normalizeAmount(right))<=allowed;
  }

  function normalizeRateRecord(record,source){
    if(!record||!(Number(record.rate)>0)) return null;
    return {
      base:String(record.base||tripCurrency().code).toUpperCase(),
      quote:String(record.quote||homeCurrency()).toUpperCase(),
      rate:Number(record.rate),
      date:String(record.date||''),
      savedAt:String(record.savedAt||''),
      source:String(source||record.source||'cached')
    };
  }

  function readCachedRate(){
    try{
      if(!root.STORAGE||!root.STORAGE.local) return null;
      return normalizeRateRecord(root.STORAGE.local.readJSON(cacheKey(),null),'cached');
    }catch(error){
      return null;
    }
  }

  function saveCachedRate(rateOrRecord,date,savedAt){
    const input=typeof rateOrRecord==='object'&&rateOrRecord!==null
      ? rateOrRecord
      : {rate:rateOrRecord,date,savedAt};
    const record=normalizeRateRecord(input,input.source||'cached');
    if(!record||!root.STORAGE||!root.STORAGE.local) return false;
    const payload={
      rate:record.rate,
      date:record.date,
      savedAt:record.savedAt||new Date().toISOString()
    };
    try{
      return root.STORAGE.local.writeJSON(cacheKey(),payload)!==false;
    }catch(error){
      return false;
    }
  }

  function isCacheFresh(record,now){
    const candidate=normalizeRateRecord(record||readCachedRate(),'cached');
    if(!candidate||!candidate.savedAt) return false;
    const saved=Date.parse(candidate.savedAt);
    const current=now instanceof Date?now.getTime():Number(now||Date.now());
    const maxAge=Number(root.MONEY_CONFIG&&root.MONEY_CONFIG.cacheHours||0)*60*60*1000;
    return Number.isFinite(saved)&&Number.isFinite(current)&&maxAge>0&&current-saved<=maxAge;
  }

  function rateForDirection(rate,from,to){
    const numeric=Number(rate);
    if(!(numeric>0)) return null;
    const trip=tripCurrency().code;
    const home=homeCurrency();
    const source=String(from||trip).toUpperCase();
    const target=String(to||home).toUpperCase();
    if(source===target) return 1;
    if(source===trip&&target===home) return numeric;
    if(source===home&&target===trip) return 1/numeric;
    return null;
  }

  function convert(amount,rate,from,to){
    const directionRate=rateForDirection(rate,from,to);
    if(directionRate===null) return null;
    return normalizeAmount(amount)*directionRate;
  }

  function convertToHome(amount,rate){
    return convert(amount,rate,tripCurrency().code,homeCurrency());
  }

  function convertToTrip(amount,rate){
    return convert(amount,rate,homeCurrency(),tripCurrency().code);
  }

  async function fetchLatestRate(fetchImpl){
    const request=fetchImpl||root.fetch;
    if(typeof request!=='function') throw new Error('rate request unavailable');
    const base=tripCurrency().code, quote=homeCurrency();
    const attempts=[];
    attempts.push(async function(){
      const response=await request(apiUrl(),{cache:'no-store'});
      if(!response||!response.ok) throw new Error('primary rate request failed');
      const data=await response.json();
      const rate=data&&data.rates&&Number(data.rates[quote]);
      if(!(rate>0)) throw new Error('primary currency unsupported');
      return {rate,date:data.date||new Date().toISOString().slice(0,10),source:'live-primary'};
    });
    const fallbacks=(root.MONEY_CONFIG&&root.MONEY_CONFIG.fallbackApiBases)||[];
    fallbacks.forEach(function(template){
      attempts.push(async function(){
        const url=String(template).replace('{base}',base.toLowerCase()).replace('{quote}',quote.toLowerCase());
        const response=await request(url,{cache:'no-store'});
        if(!response||!response.ok) throw new Error('fallback rate request failed');
        const data=await response.json();
        const bucket=data&&data[base.toLowerCase()];
        const rate=Number(bucket&&bucket[quote.toLowerCase()]);
        if(!(rate>0)) throw new Error('fallback currency unsupported');
        return {rate,date:data.date||new Date().toISOString().slice(0,10),source:'live-fallback'};
      });
    });
    let lastError=null;
    for(const attempt of attempts){
      try{
        const result=await attempt();
        return normalizeRateRecord({base,quote,rate:result.rate,date:result.date,savedAt:new Date().toISOString(),source:result.source},result.source);
      }catch(error){lastError=error;}
    }
    throw lastError||new Error('rate request failed');
  }

  const service=Object.freeze({
    getTripCurrency:tripCurrency,
    getHomeCurrency:homeCurrency,
    getCurrencyInfo:currencyInfo,
    getExpenseCurrencies:expenseCurrencies,
    getSettlementCurrency:settlementCurrency,
    getCacheKey:cacheKey,
    getApiUrl:apiUrl,
    normalizeAmount,
    sumAmounts,
    equalShares,
    remainder,
    amountsMatch,
    readCachedRate,
    saveCachedRate,
    isCacheFresh,
    rateForDirection,
    convert,
    convertToHome,
    convertToTrip,
    fetchLatestRate
  });

  root.MONEY=service;
  root.getFxCacheKey=cacheKey; // compatibility alias for pre-7I callers
})(globalThis);
