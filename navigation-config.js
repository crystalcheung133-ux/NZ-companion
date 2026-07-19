(function(global){
  'use strict';

  const NAVIGATION_CONFIG = Object.freeze({
    pages: Object.freeze({
      home: 'index.html',
      trip: 'trip.html',
      guide: 'guide.html',
      days: 'itinerary.html',
      day: 'day.html',
      place: 'place.html',
      moments: 'moments.html',
      expenses: 'expenses.html',
      memory: 'memory.html',
      offline: 'offline.html'
    }),
    query: Object.freeze({
      day: 'day',
      placeId: 'id',
      legacyPlaceId: 'place',
      placeIds: 'ids',
      source: 'source',
      coldLaunch: 'coldLaunch'
    }),
    hash: Object.freeze({
      shoppingDirectory: 'shopping-directory'
    }),
    fallback: Object.freeze({
      placeClose: 'home',
      unknown: 'home'
    }),
    permittedReturnPages: Object.freeze([
      'index.html',
      'trip.html',
      'guide.html',
      'itinerary.html',
      'day.html',
      'place.html',
      'moments.html',
      'expenses.html',
      'memory.html'
    ])
  });

  global.NAVIGATION_CONFIG = NAVIGATION_CONFIG;
})(typeof self !== 'undefined' ? self : window);
