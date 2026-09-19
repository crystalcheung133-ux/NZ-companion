/* money-config.js — Travel Engine money / FX configuration. */
(function(root){
  'use strict';
  root.MONEY_CONFIG = Object.freeze({
    homeCurrency: 'AUD',
    settlementCurrency: 'AUD',
    expenseCurrencyMode: 'home_and_destination',
    exchangeProvider: 'frankfurter',
    apiBase: 'https://api.frankfurter.dev/v1/latest',
    fallbackApiBases: Object.freeze([
      'https://latest.currency-api.pages.dev/v1/currencies/{base}.json'
    ]),
    cacheHours: 12,
    storageVersion: 2
  });
})(globalThis);
