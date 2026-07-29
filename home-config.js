/* home-config.js — Trip-supplied home content expressed through an Engine-owned format. */
(function(root){
  'use strict';
  const trip=root.TRIP_CONFIG||{};
  const home=trip.home||{};
  const locale=root.LOCALE_CONFIG||{};
  const money=locale.currency||{};
  root.HOME_CONFIG=Object.freeze({
    ariaLabel:home.ariaLabel||trip.tripName||'Trip Companion home',
    hero:Object.freeze({
      eyebrow:trip.familyLabel||'',
      line1:trip.heroLine1||trip.destination||'Trip',
      emphasis:trip.heroEmphasis||'Companion',
      story:home.reunionStory||'',
      dateLine:home.dateLine||'',
      regionLine:home.regionLine||''
    }),
    cards:Object.freeze([
      Object.freeze({type:'countdown',icon:'⏳',label:'Countdown'}),
      Object.freeze({type:'clock',icon:'🕒',label:home.clockLabel||trip.destination||'Destination',action:'View clocks ›'}),
      Object.freeze({type:'weather',icon:'🌦',label:'Today',action:'Open details ›'}),
      Object.freeze({type:'currency',icon:'💱',label:'Currency',action:'Convert ›',value:`${money.code||'NZD'} 100 ≈ ${(money.homeCode||'AUD')} --`})
    ]),
    primaryAction:Object.freeze({before:"Let's go · Day 1",during:"Let's go · Day {day}",after:'Open Day {day}'}),
    clocks:Object.freeze({
      kicker:'TRIP CLOCKS',
      title:'Destination & home',
      noteBefore:`Before departure, the Home card shows ${home.clockLabel||trip.destination||'destination'} time.`,
      noteDuring:`During the trip, it switches to ${root.GEO_CONFIG?.homeLabel||'home'} time so it is easier to contact home.`
    }),
    currency:Object.freeze({kicker:'LIVE EXCHANGE',title:'Currency converter'})
  });
})(globalThis);
