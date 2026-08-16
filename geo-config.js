/* geo-config.js — Portability Stage canonical trip geography configuration.
   Single source for the home-dashboard weather rotation, the per-day
   weather location used on day.html, and the "home" side of the two-clock
   display. Destination timezone/locale stay owned by LOCALE_CONFIG /
   TRIP_CONFIG — not duplicated here.

   Loads before TRIP_CONFIG (same head position as locale-config.js /
   asset-config.js), so nothing here reads TRIP_CONFIG at parse time. */
(function(root){
  'use strict';

  const geo = Object.freeze({
    /* Used for the "during trip, show Home time instead" branch on the
       dashboard clock. The destination side already comes from
       LOCALE_CONFIG.timeZone; this is the only side that was missing an
       owner (it was a literal 'Australia/Melbourne' in index.html). */
    homeTimeZone: 'Australia/Melbourne',
    homeLabel: 'Melbourne',
    homeFlag: '🇦🇺',
    destinationFlag: '🇳🇿',

    /* Home-dashboard weather rotation (index.html). One entry per distinct
       place the trip passes through; dayWeatherIndex maps a 1-based trip
       day number to an index into this list. */
    weatherStops: Object.freeze([
      { name:'Christchurch', lat:-43.5321, lon:172.6362 },
      { name:'Lake Tekapo', lat:-44.0047, lon:170.4771 },
      { name:'Aoraki / Mt Cook', lat:-43.7340, lon:170.0960 },
      { name:'Wānaka', lat:-44.6940, lon:169.1410 },
      { name:'Queenstown', lat:-45.0312, lon:168.6626 },
      { name:'Te Anau', lat:-45.4145, lon:167.7189 },
      { name:'Milford Sound', lat:-44.6716, lon:167.9256 }
    ]),
    dayWeatherIndex: Object.freeze([0,0,1,2,3,4,4,4,5,6,4]),

    /* Per-day weather location for day.html, keyed by day number. */
    dayLocations: Object.freeze({
      1: { name:'Christchurch', lat:-43.5321, lon:172.6362 },
      2: { name:'Lake Tekapo', lat:-44.0047, lon:170.4771 },
      3: { name:'Aoraki / Mt Cook & Wānaka', lat:-43.7340, lon:170.0960 },
      4: { name:'Wānaka & Queenstown', lat:-44.6940, lon:169.1410 },
      5: { name:'Queenstown', lat:-45.0312, lon:168.6626 },
      6: { name:'Queenstown', lat:-45.0312, lon:168.6626 },
      7: { name:'Arrowtown & Queenstown', lat:-44.9384, lon:168.8355 },
      8: { name:'Te Anau', lat:-45.4145, lon:167.7189 },
      9: { name:'Milford Sound', lat:-44.6716, lon:167.9256 },
      10: { name:'Queenstown', lat:-45.0312, lon:168.6626 }
    })
  });

  root.GEO_CONFIG = geo;

  /* Populates the home-dashboard clock modal's flag + destination/home
     labels from config instead of leaving them as literal text baked into
     index.html. Additive/idempotent; harmless if the markers aren't present
     on a given page. */
  function applyGeoIdentity(){
    if (typeof document === 'undefined') return;
    document.querySelectorAll('[data-geo-flag]').forEach(function(el){
      const key = el.getAttribute('data-geo-flag');
      if (geo[key]) el.textContent = geo[key];
    });
    document.querySelectorAll('[data-geo-label]').forEach(function(el){
      const key = el.getAttribute('data-geo-label');
      if (geo[key]) el.textContent = geo[key];
    });
  }

  root.applyGeoIdentity = applyGeoIdentity;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyGeoIdentity);
    else applyGeoIdentity();
  }
})(globalThis);
