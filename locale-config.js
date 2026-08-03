/* locale-config.js — Stage 7C canonical locale configuration.
   Single source for locale, currency, timezone and formatting conventions.
   Runtime formatting is owned by formatter.js. */
(function(root){
  'use strict';

  const locale = Object.freeze({
    locale: 'en-NZ',
    language: 'en-NZ',
    region: 'NZ',
    currency: Object.freeze({ code: 'NZD', symbol: '$', name: 'New Zealand Dollar' }),
    timeZone: 'Pacific/Auckland',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberFormat: 'en-NZ',
    distanceUnit: 'km',
    temperatureUnit: 'C',
    weekStart: 'Monday'
  });

  root.LOCALE_CONFIG = locale;

})(globalThis);
