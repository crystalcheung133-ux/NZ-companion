/* home-render-runtime.js — Engine-owned front-page renderer and behaviour. */
(function(root){
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const cfg=()=>root.HOME_CONFIG||{};
  function cardHTML(card){
    if(card.type==='countdown') return `<div class="live-card live-countdown" data-home-card="countdown"><span class="live-icon">${esc(card.icon)}</span><small>${esc(card.label)}</small><strong id="countdownText">Counting down...</strong></div>`;
    if(card.type==='clock') return `<button aria-label="Open destination and home clocks" class="live-card live-time live-interactive-card" data-home-card="clock" onclick="openHomeInfoModal('clockModal')" type="button"><span class="live-icon">${esc(card.icon)}</span><small id="homeClockLabel">${esc(card.label)}</small><strong id="hcmTime">--:--</strong><em class="live-card-action">${esc(card.action)}</em></button>`;
    if(card.type==='weather') return `<a aria-label="Open today’s weather" class="live-card live-weather live-interactive-card" data-home-card="weather" id="homeWeatherCard" href="#" rel="noopener" target="_blank"><span class="live-icon" id="homeWeatherIcon">${esc(card.icon)}</span><small id="homeWeatherLabel">${esc(card.label)}</small><strong id="homeWeatherValue">Loading weather…</strong><em class="live-card-action" id="homeWeatherMeta">${esc(card.action)}</em></a>`;
    if(card.type==='currency') return `<button aria-label="Open currency converter" class="live-card live-rate live-currency-card live-interactive-card" data-home-card="currency" id="currencyCard" onclick="openCurrencyModal()" type="button"><span class="live-icon">${esc(card.icon)}</span><small>${esc(card.label)}</small><strong id="currencyCardValue">${esc(card.value)}</strong><em class="live-card-action" id="currencyCardMeta">${esc(card.action)}</em></button>`;
    return '';
  }
  function renderHome(){
    const target=document.getElementById('homeRoot');
    if(!target) return;
    const home=cfg(); const hero=home.hero||{};
    target.innerHTML=`<section aria-label="${esc(home.ariaLabel)}" class="home-brand-card v37-dashboard-home engine-home-card"><p class="home-since">${esc(hero.eyebrow)}</p><h1><span>${esc(hero.line1)}</span><br/><em>${esc(hero.emphasis)}</em></h1><div class="home-reunion-story" aria-label="Trip story"><strong>${esc(hero.story)}</strong></div><div class="home-trip-line"><span>${esc(hero.dateLine)}</span><span>${esc(hero.regionLine)}</span></div><div aria-label="Live travel dashboard" class="home-live-grid">${(home.cards||[]).map(cardHTML).join('')}</div><a class="home-day-button" id="homeTodayButton" href="day.html?day=1">Let's go ✨</a></section>`;
    document.body.insertAdjacentHTML('beforeend',buildClockModal()+buildCurrencyModal());
  }
  function buildClockModal(){
    const trip=root.TRIP_CONFIG||{}; const geo=root.GEO_CONFIG||{}; const home=cfg();
    return `<div aria-hidden="true" class="home-info-modal" id="clockModal"><div class="home-info-sheet" role="dialog" aria-modal="true" aria-labelledby="clockModalTitle"><button aria-label="Close clocks" class="home-info-close" onclick="closeHomeInfoModal('clockModal')" type="button">×</button><p class="kicker">${esc(home.clocks?.kicker)}</p><h2 id="clockModalTitle">${esc(home.clocks?.title)}</h2><div class="home-info-list"><div><span>${esc(geo.destinationFlag||'')} ${esc(trip.home?.clockLabel||trip.destination)}</span><strong id="clockNzValue">--:--</strong></div><div><span>${esc(geo.homeFlag||'')} ${esc(trip.familyLabel||geo.homeLabel||'Home')}</span><strong id="clockMelValue">--:--</strong></div></div><p class="home-info-note">${esc(home.clocks?.noteBefore)} ${esc(home.clocks?.noteDuring)}</p></div></div>`;
  }
  function buildCurrencyModal(){
    const home=cfg(); const currency=root.LOCALE_CONFIG?.currency||{};
    return `<div aria-hidden="true" class="currency-modal" id="currencyModal"><div class="currency-sheet" role="dialog" aria-modal="true" aria-labelledby="currencyTitle"><button aria-label="Close currency converter" class="currency-close" onclick="closeCurrencyModal()" type="button">×</button><p class="kicker">${esc(home.currency?.kicker)}</p><h2 id="currencyTitle">${esc(home.currency?.title)}</h2><div class="currency-converter"><label for="currencyAmount" id="currencyInputLabel">${esc(currency.name||'Trip currency')}</label><div class="currency-input-row"><span id="currencyInputCode">${esc(currency.code||'NZD')}</span><input autocomplete="off" id="currencyAmount" inputmode="decimal" type="text" value="100"/></div><button class="currency-swap" id="currencySwap" onclick="swapCurrencyDirection()" type="button">⇅ Swap</button><div class="currency-result" aria-live="polite"><small id="currencyOutputLabel">${esc(currency.homeName||'Home currency')}</small><strong id="currencyResult">${esc(currency.homeCode||'AUD')} --</strong></div><p class="currency-status" id="currencyStatus">Fetching the latest reference rate…</p></div></div></div>`;
  }
  function formatClock(now,timeZone){
    try{return new Intl.DateTimeFormat(root.LOCALE_CONFIG?.numberFormat||'en-AU',{timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now);}catch(error){return '--:--';}
  }
  function weatherCode(code){
    if(code===0)return ['☀️','Clear']; if(code<=3)return ['⛅','Partly cloudy']; if(code<=48)return ['🌫️','Foggy']; if(code<=67)return ['🌧️','Rain']; if(code<=77)return ['🌨️','Snow']; if(code<=82)return ['🌦️','Showers']; if(code<=86)return ['🌨️','Snow showers']; return ['⛈️','Thunderstorms'];
  }
  function dateModel(){
    const trip=root.TRIP_CONFIG||{}; const start=new Date(trip.startDate+'T00:00:00'); const end=new Date(trip.endDate+'T23:59:59');
    return {start,end,length:Math.round((end-start)/86400000)+1};
  }
  function currentTripDay(now,model){
    if(now<model.start||now>model.end)return 0;
    return Math.min(model.length,Math.max(1,Math.floor((now-model.start)/86400000)+1));
  }
  async function updateWeather(now){
    const model=dateModel(); const day=currentTripDay(now,model); const stops=root.GEO_CONFIG?.weatherStops||[]; const indexes=root.GEO_CONFIG?.dayWeatherIndex||[0]; const stop=stops[indexes[day]||0];
    if(!stop)return;
    const card=document.getElementById('homeWeatherCard'); const label=document.getElementById('homeWeatherLabel'); const value=document.getElementById('homeWeatherValue'); const meta=document.getElementById('homeWeatherMeta'); const icon=document.getElementById('homeWeatherIcon');
    const query=stop.name+' '+(root.TRIP_CONFIG?.destination||'')+' weather'; if(card)card.href='https://www.google.com/search?q='+encodeURIComponent(query); if(label)label.textContent=(day?'Day '+day:'Today')+' · '+stop.name;
    try{const url=`https://api.open-meteo.com/v1/forecast?latitude=${stop.lat}&longitude=${stop.lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=${encodeURIComponent(root.TRIP_CONFIG?.timeZone||'auto')}&forecast_days=1`; const response=await fetch(url,{cache:'no-store'}); if(!response.ok)throw new Error('weather'); const weather=await response.json(); const [symbol,text]=weatherCode(Number(weather.current?.weather_code)); const min=Math.round(weather.daily?.temperature_2m_min?.[0]); const max=Math.round(weather.daily?.temperature_2m_max?.[0]); const rain=weather.daily?.precipitation_probability_max?.[0]; if(icon)icon.textContent=symbol; if(value)value.textContent=`${min}–${max}°C · ${text}`; if(meta)meta.textContent=Number.isFinite(Number(rain))?`Rain ${rain}% · Details ›`:'Open details ›';}catch(error){if(value)value.textContent='Open today’s forecast';if(meta)meta.textContent='Live details ›';}
  }
  function updateDashboard(){
    const now=new Date(); const model=dateModel(); const diff=Math.ceil((model.start-now)/86400000); const c=document.getElementById('countdownText'); const trip=root.TRIP_CONFIG||{};
    if(c){if(diff>7)c.textContent=`${diff} days to go`;else if(diff>1)c.textContent='One week to go';else if(diff===1)c.textContent='Pack your bags';else if(diff===0)c.textContent=trip.home?.welcomeMessage||'Welcome';else c.textContent=trip.home?.completedMessage||'Trip complete';}
    const during=now>=model.start&&now<=model.end; const displayZone=during?(root.GEO_CONFIG?.homeTimeZone):(trip.timeZone); const displayLabel=during?('Home · '+(root.GEO_CONFIG?.homeLabel||'Home')):(trip.home?.clockLabel||trip.destination); const t=document.getElementById('hcmTime'); const label=document.getElementById('homeClockLabel'); const destination=document.getElementById('clockNzValue'); const home=document.getElementById('clockMelValue'); if(t)t.textContent=formatClock(now,displayZone); if(label)label.textContent=displayLabel; if(destination)destination.textContent=formatClock(now,trip.timeZone); if(home)home.textContent=formatClock(now,root.GEO_CONFIG?.homeTimeZone);
  }
  function updatePrimaryAction(){
    const button=document.getElementById('homeTodayButton'); if(!button)return;
    const days=root.GenerationSelectionAdapter?.view?.('itinerary')?.days||{}; const available=Object.keys(days).map(Number).filter(Number.isFinite).sort((a,b)=>a-b); const max=available.length?available[available.length-1]:1; const current=typeof root.tripDateParts==='function'?root.tripDateParts():''; const start=root.TRIP_CONFIG?.startDate; const toUtc=value=>{const [y,m,d]=String(value).split('-').map(Number);return Date.UTC(y,m-1,d);}; const end=new Date(toUtc(start)+(max-1)*86400000).toISOString().slice(0,10); const before=current&&current<start; const within=current>=start&&current<=end; const day=within&&typeof root.tripDayNumber==='function'?root.tripDayNumber():(before?1:max); button.href=root.NAVIGATION?.build?root.NAVIGATION.build('day',{query:{day}}):`day.html?day=${day}`; const template=within?cfg().primaryAction?.during:(before?cfg().primaryAction?.before:cfg().primaryAction?.after); button.textContent=String(template||"Let's go · Day {day}").replace('{day}',day);
  }
  function bindModalControls(){
    root.openHomeInfoModal=function(id){const modal=document.getElementById(id);if(!modal)return;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('home-info-modal-open');};
    root.closeHomeInfoModal=function(id){const modal=document.getElementById(id);if(!modal)return;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('home-info-modal-open');};
    document.addEventListener('click',event=>{const modal=event.target.closest&&event.target.closest('.home-info-modal');if(modal&&event.target===modal)root.closeHomeInfoModal(modal.id);});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.home-info-modal.open').forEach(modal=>root.closeHomeInfoModal(modal.id));});
  }
  function init(){renderHome();bindModalControls();updateDashboard();updateWeather(new Date());updatePrimaryAction();setInterval(updateDashboard,30000);setInterval(()=>updateWeather(new Date()),900000);}
  root.renderHome=renderHome;
  if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();}
})(globalThis);
