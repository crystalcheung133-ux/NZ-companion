/* formatter.js — Stage 7H-1 canonical formatting access layer.
   Owns locale-aware date, time, number, currency, distance and file-size
   presentation. LOCALE_CONFIG remains configuration-only. */
(function(root){
  'use strict';

  const locale = root.LOCALE_CONFIG;
  if(!locale) throw new Error('FORMATTER requires LOCALE_CONFIG');

  function asDate(value){
    return value instanceof Date ? value : new Date(value);
  }
  function date(value, options){
    try{
      return new Intl.DateTimeFormat(locale.locale, Object.assign({timeZone:locale.timeZone}, options||{})).format(asDate(value));
    }catch(e){ return ''; }
  }
  function time(value, options){
    try{
      return new Intl.DateTimeFormat(locale.locale, Object.assign({
        timeZone:locale.timeZone,
        hour:'2-digit',
        minute:'2-digit',
        hour12:locale.timeFormat==='12h'
      }, options||{})).format(asDate(value));
    }catch(e){ return ''; }
  }
  function dateTime(value){
    try{
      return new Intl.DateTimeFormat(locale.locale, {
        timeZone:locale.timeZone,
        dateStyle:'medium',
        timeStyle:'short'
      }).format(asDate(value));
    }catch(e){ return ''; }
  }
  function number(value, options){
    try{return new Intl.NumberFormat(locale.numberFormat, options||{}).format(value);}
    catch(e){return String(value);}
  }
  function decimal(value, digits){
    const places=Number.isInteger(digits)?digits:2;
    return number(value,{minimumFractionDigits:places,maximumFractionDigits:places});
  }
  function currency(value, currencyCode){
    return decimal(value,2)+' '+(currencyCode||locale.currency.code);
  }
  function distance(value){
    return number(value)+' '+locale.distanceUnit;
  }
  function bytes(value){
    const size=Number(value);
    if(!Number.isFinite(size)) return '';
    if(size<1024) return size+' B';
    if(size<1024*1024) return (size/1024).toFixed(size<10240?1:0)+' KB';
    return (size/(1024*1024)).toFixed(1)+' MB';
  }
  function dateKey(value, timeZone){
    try{
      const parts=new Intl.DateTimeFormat('en-CA',{
        timeZone:timeZone||locale.timeZone,
        year:'numeric',month:'2-digit',day:'2-digit'
      }).formatToParts(asDate(value));
      const out={};
      parts.forEach(part=>{if(part.type!=='literal')out[part.type]=part.value;});
      return `${out.year}-${out.month}-${out.day}`;
    }catch(e){return '';}
  }

  const api=Object.freeze({date,time,dateTime,number,decimal,currency,distance,bytes,dateKey});
  root.FORMATTER=api;
  root.LOCALE_FORMAT=api; // retained compatibility alias
})(globalThis);
