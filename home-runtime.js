/* CCMV Front Page Cleanup Phase 1
   Behaviour-preserving home runtime extracted from index.html.
   No DOM structure or layout ownership changes. */
(function(){
  'use strict';

  // Trip-config text binding (moved verbatim from index.html).
  (function(){function applyHomeConfig(){const home=TRIP_CONFIG.home||{};document.querySelectorAll('[data-trip-home]').forEach(function(el){const value=home[el.getAttribute('data-trip-home')];if(value!=null)el.textContent=value;});document.querySelectorAll('[data-trip-home-aria]').forEach(function(el){el.setAttribute('aria-label',home.ariaLabel||TRIP_CONFIG.tripName);});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyHomeConfig);else applyHomeConfig();})();

  // Countdown, clocks and weather dashboard (moved verbatim).
  (function(){
 const target=new Date(TRIP_CONFIG.startDate+'T00:00:00');
 const tripEnd=new Date(TRIP_CONFIG.endDate+'T23:59:59');
 const tripLengthDays=Math.round((tripEnd-target)/86400000)+1;
 const destinationWeatherSuffix=TRIP_CONFIG.destination+' weather';
 const weatherStops=(GEO_CONFIG.weatherStops||[]).map(function(stop){
  return Object.assign({},stop,{q:stop.name+' '+destinationWeatherSuffix});
 });
 const dayWeatherIndex=GEO_CONFIG.dayWeatherIndex||[0];
 function formatClock(now,timeZone){
  try{return new Intl.DateTimeFormat(LOCALE_CONFIG.numberFormat,{timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);}
  catch(error){try{return now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});}catch(_){return '--:--';}}
 }
 function tripDay(now){
  if(now<target||now>tripEnd)return 0;
  return Math.min(tripLengthDays,Math.max(1,Math.floor((now-target)/86400000)+1));
 }
 function weatherCode(code){
  if(code===0)return ['☀️','Clear']; if(code<=3)return ['⛅','Partly cloudy']; if(code<=48)return ['🌫️','Foggy'];
  if(code<=67)return ['🌧️','Rain']; if(code<=77)return ['🌨️','Snow']; if(code<=82)return ['🌦️','Showers']; if(code<=86)return ['🌨️','Snow showers']; return ['⛈️','Thunderstorms'];
 }
 async function updateWeather(now){
  const d=tripDay(now); const stop=weatherStops[dayWeatherIndex[d]||0];
  const card=document.getElementById('homeWeatherCard'); const label=document.getElementById('homeWeatherLabel');
  const value=document.getElementById('homeWeatherValue'); const meta=document.getElementById('homeWeatherMeta'); const icon=document.getElementById('homeWeatherIcon');
  if(!stop) return;
  if(card)card.href='https://www.google.com/search?q='+encodeURIComponent(stop.q);
  if(label)label.textContent=(d?'Day '+d:'Today')+' · '+stop.name;
  try{
   const url=`https://api.open-meteo.com/v1/forecast?latitude=${stop.lat}&longitude=${stop.lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=${encodeURIComponent(TRIP_CONFIG.timeZone)}&forecast_days=1`;
   const response=await fetch(url,{cache:'no-store'}); if(!response.ok)throw new Error('weather'); const w=await response.json();
   const [symbol,text]=weatherCode(Number(w.current?.weather_code)); const min=Math.round(w.daily?.temperature_2m_min?.[0]); const max=Math.round(w.daily?.temperature_2m_max?.[0]); const rain=w.daily?.precipitation_probability_max?.[0];
   if(icon)icon.textContent=symbol; if(value)value.textContent=`${min}–${max}°C · ${text}`; if(meta)meta.textContent=Number.isFinite(Number(rain))?`Rain ${rain}% · Details ›`:'Open details ›';
  }catch(error){ if(value)value.textContent='Open today’s forecast'; if(meta)meta.textContent='Live details ›'; }
 }
 function updateHomeDash(){
  const now=new Date(); const diff=Math.ceil((target-now)/86400000); const c=document.getElementById('countdownText');
  if(c){if(diff>7)c.textContent=`${diff} days to go`;else if(diff>1)c.textContent='One week to go';else if(diff===1)c.textContent='Pack your bags';else if(diff===0)c.textContent=TRIP_CONFIG.home.welcomeMessage;else c.textContent=TRIP_CONFIG.home.completedMessage;}
  const duringTrip=now>=target&&now<=tripEnd; const displayZone=duringTrip?GEO_CONFIG.homeTimeZone:TRIP_CONFIG.timeZone; const displayLabel=duringTrip?('Home · '+GEO_CONFIG.homeLabel):TRIP_CONFIG.home.clockLabel;
  const t=document.getElementById('hcmTime'); const label=document.getElementById('homeClockLabel'); const nz=document.getElementById('clockNzValue'); const mel=document.getElementById('clockMelValue');
  if(t)t.textContent=formatClock(now,displayZone); if(label)label.textContent=displayLabel; if(nz)nz.textContent=formatClock(now,TRIP_CONFIG.timeZone); if(mel)mel.textContent=formatClock(now,GEO_CONFIG.homeTimeZone);
 }
 function init(){updateHomeDash();updateWeather(new Date());setInterval(updateHomeDash,30000);setInterval(()=>updateWeather(new Date()),900000);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

  // Home information modal controls (moved verbatim).
  (function(){window.openHomeInfoModal=function(id){CCMV_MODAL.setOpen(id,true,{openClass:'open',bodyClass:'home-info-modal-open'});};window.closeHomeInfoModal=function(id){CCMV_MODAL.setOpen(id,false,{openClass:'open',bodyClass:'home-info-modal-open'});};document.addEventListener('click',function(event){var modal=event.target.closest&&event.target.closest('.home-info-modal');if(modal&&event.target===modal)closeHomeInfoModal(modal.id);});document.addEventListener('keydown',function(event){if(event.key==='Escape')document.querySelectorAll('.home-info-modal.open').forEach(function(modal){closeHomeInfoModal(modal.id);});});})();

  // Primary day action (moved verbatim).
  (function(){
  const productionDays=GenerationSelectionAdapter.view('itinerary').days;
  const availableDays=Object.keys(productionDays).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
  const maxDay=availableDays.length ? availableDays[availableDays.length-1] : 1;
  const currentDate=typeof tripDateParts==='function'?tripDateParts():'';
  const startDate=TRIP_CONFIG.startDate;
  const toUtc=value=>{const [y,m,d]=String(value).split('-').map(Number);return Date.UTC(y,m-1,d);};
  const addDays=(value,days)=>{
    const date=new Date(toUtc(value)+days*86400000);
    return date.toISOString().slice(0,10);
  };
  const confirmedEnd=addDays(startDate,maxDay-1);
  const isBefore=currentDate && currentDate<startDate;
  const isWithin=currentDate>=startDate && currentDate<=confirmedEnd;
  const day=isWithin && typeof window.tripDayNumber==='function' ? window.tripDayNumber() : (isBefore?1:maxDay);
  const button=document.getElementById('homeTodayButton');
  if(button){
    button.href=NAVIGATION.build('day',{query:{day}});
    button.textContent=isWithin?`Let's go · Day ${day}`:(isBefore?`Let's go · Day 1`:`Open Day ${day}`);
  }
})();
})();
