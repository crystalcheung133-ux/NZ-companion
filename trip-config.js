/* trip-config.js — Stage 7A-1 canonical trip identity configuration. */
(function(root){
  'use strict';

  const config = Object.freeze({
    tripName: 'New Zealand Family Companion',
    destination: 'New Zealand',
    country: 'New Zealand',
    startDate: '2026-09-22',
    endDate: '2026-10-01',
    currency: root.LOCALE_CONFIG.currency,
    timeZone: root.LOCALE_CONFIG.timeZone,
    language: root.LOCALE_CONFIG.language,
    logo: Object.freeze({
      splash: root.ASSET_CONFIG.branding.splashLogo,
      header: root.ASSET_CONFIG.branding.secondaryMark,
      icon192: root.ASSET_CONFIG.icons.icon192,
      icon512: root.ASSET_CONFIG.icons.icon512
    }),
    coverImage: root.ASSET_CONFIG.hero.coverImage,
    themeName: root.THEME_CONFIG.name,

    /* Existing presentation labels retained here so identity has one owner. */
    engineName: 'CCMV Travel Engine',
    shortName: 'NZ Family',
    navLabel: 'New Zealand Companion',
    familyLabel: 'MELBOURNE · SYDNEY · NEWCASTLE',
    heroLine1: 'New Zealand',
    heroEmphasis: 'Companion',
    tagline: 'Drive · Discover · Adventure',
    splashSlogan: 'ADVENTURE AWAITS',
    splashDestination: 'NEW ZEALAND 2026',
    storageNamespace: 'nz-family-2026',
    version: '1.0-rc4.6',
    buildLabel: 'RC4.6 Guide List Status & PWA Cold Launch Fix',
    theme: root.THEME_CONFIG.colors
  });

  root.TRIP_CONFIG = config;

  function createManifest(){
    if(typeof document==='undefined') return;
    const manifest = {
      name: config.tripName,
      short_name: config.shortName,
      id: './',
      start_url: './index.html?v=rc4-6&source=pwa',
      scope: './',
      display: 'standalone',
      orientation: 'portrait',
      background_color: config.theme.background,
      theme_color: config.theme.primary,
      icons: [
        {src: root.ASSET_CONFIG.icons.icon192, sizes: '192x192', type: 'image/png', purpose: 'any maskable'},
        {src: root.ASSET_CONFIG.icons.icon512, sizes: '512x512', type: 'image/png', purpose: 'any maskable'}
      ],
      description: config.tripName
    };
    const blob = new Blob([JSON.stringify(manifest)], {type:'application/manifest+json'});
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = URL.createObjectURL(blob);
    link.dataset.tripManifest = 'true';
    document.head.appendChild(link);
  }

  function applyTripIdentity(){
    if(typeof document==='undefined') return;
    document.documentElement.lang = config.language;

    document.querySelectorAll('[data-trip-page-title]').forEach(function(el){
      const page = el.getAttribute('data-trip-page-title');
      document.title = page ? page + ' · ' + config.tripName : config.tripName;
    });
    document.querySelectorAll('[data-brand-text]').forEach(function(el){
      const key = el.getAttribute('data-brand-text');
      const value = config[key];
      if(value==null) return;
      if(key==='splashSlogan') el.innerHTML=String(value).replace(/\n/g,'<br>');
      else el.textContent=value;
    });
    document.querySelectorAll('[data-brand-logo]').forEach(function(img){
      const key=img.getAttribute('data-brand-logo');
      if(config.logo[key]) img.src=config.logo[key];
    });
    document.querySelectorAll('[data-trip-icon]').forEach(function(link){
      const key=link.getAttribute('data-trip-icon');
      if(config.logo[key]) link.href=config.logo[key];
    });
    document.querySelectorAll('[data-trip-apple-title]').forEach(function(meta){
      meta.content=config.destination;
    });
    document.querySelectorAll('[data-trip-theme-color]').forEach(function(meta){
      meta.content=config.theme.primary;
    });
    document.querySelectorAll('[data-trip-currency-placeholder]').forEach(function(input){
      input.placeholder='Total ' + root.LOCALE_CONFIG.currency.code;
    });
    document.querySelectorAll('[data-locale-currency-placeholder]').forEach(function(input){
      input.placeholder='0.00 ' + root.LOCALE_CONFIG.currency.code;
    });
  }

  root.applyTripIdentity = applyTripIdentity;
  if(typeof document!=='undefined'){
    createManifest();
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyTripIdentity);
    else applyTripIdentity();
  }
})(globalThis);
