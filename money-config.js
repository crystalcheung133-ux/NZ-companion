/* money-config.js — Stage 7E-1/7E-2 canonical money/FX configuration.
   Single source for home currency, exchange provider and FX cache settings.
   Trip currency remains owned by LOCALE_CONFIG.currency; not duplicated here. */
(function(root){
  'use strict';

  const money = Object.freeze({
    homeCurrency: 'AUD',
    exchangeProvider: 'frankfurter',
    apiBase: 'https://api.frankfurter.dev/v1/latest',
    cacheHours: 12,
    storageVersion: 1,
    supportedCurrencies: Object.freeze(['AUD', 'NZD', 'JPY', 'VND'])
  });

  root.MONEY_CONFIG = money;

})(globalThis);
