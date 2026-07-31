/* trip-config.js — Stage 7A-1 canonical trip identity configuration. */
(function(root){
  'use strict';

  const partyIdentities = {
    'party-lee': Object.freeze({
      partyId:'party-lee', displayName:'Lee', shortName:'MEL',
      colour:'#1f766c', legacyAliases:Object.freeze(['lee']), ordering:1,
      permissions:Object.freeze({adminEligible:true})
    }),
    'party-fowlers': Object.freeze({
      partyId:'party-fowlers', displayName:'Fowlers', shortName:'SYD',
      colour:'#2f6fa3', legacyAliases:Object.freeze(['fowlers']), ordering:2,
      permissions:Object.freeze({adminEligible:false})
    }),
    'party-yau': Object.freeze({
      partyId:'party-yau', displayName:'Yau', shortName:'NTL',
      colour:'#aa6724', legacyAliases:Object.freeze(['yau']), ordering:3,
      permissions:Object.freeze({adminEligible:false})
    })
  };
  /* Portability Stage: admin identity used to be re-hardcoded as the literal
     'lee' independently in admin.js, complete-runtime.js and export-runtime.js
     (plus the user-facing "...available to Lee only." strings). The parties
     directory already models who is admin-eligible, so this derives the one
     canonical admin identity from it instead of leaving three more copies. */
  const adminPartyId = Object.keys(partyIdentities).find(function(id){
    return !!(partyIdentities[id].permissions && partyIdentities[id].permissions.adminEligible);
  }) || 'party-lee';
  const adminParty = partyIdentities[adminPartyId];

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
    participants: Object.freeze({
      defaultKey: 'lee',
      order: Object.freeze(['lee','fowlers','yau']),
      identities: Object.freeze({
        lee: Object.freeze({code:'MEL',name:'Lee'}),
        fowlers: Object.freeze({code:'SYD',name:'Fowlers'}),
        yau: Object.freeze({code:'NTL',name:'Yau'})
      })
    }),
    /* Stage 3.2B: additive Party directory. Existing participant selectors
       remain the presentation compatibility surface during this slice. */
    parties: Object.freeze({
      defaultPartyId: 'party-lee',
      order: Object.freeze(['party-lee','party-fowlers','party-yau']),
      identities: Object.freeze(partyIdentities)
    }),
    /* Single canonical admin identity — see partyIdentities/adminParty above.
       admin.js / complete-runtime.js / export-runtime.js read this instead of
       each hardcoding their own 'lee' literal. */
    admin: Object.freeze({
      user: (adminParty.legacyAliases && adminParty.legacyAliases[0]) || 'lee',
      displayName: adminParty.displayName,
      studioMessage: 'Trip Studio is available to ' + adminParty.displayName + ' only.',
      completeMessage: 'Complete this trip? All trip content will remain available to browse, but editing will be disabled until ' + adminParty.displayName + ' reopens the trip.',
      pin: '260922'
    }),
    home: Object.freeze({
      ariaLabel: 'New Zealand Companion home',
      reunionStory: 'Three cities. One reunion.',
      dateLine: '22 Sep — 1 Oct 2026',
      regionLine: 'South Island',
      clockLabel: 'New Zealand',
      homeCities: 'Melbourne · Sydney · Newcastle',
      clockSuffix: 'NZ',
      seasonLabel: 'Spring road trip',
      seasonNote: 'Alpine weather varies',
      welcomeMessage: 'Welcome to New Zealand',
      completedMessage: 'Thanks for the moments'
    }),
    guide: Object.freeze({ excludedPlaceIds: Object.freeze(['airport-queenstown','christchurch-airport','rental-cars-247','lake-tekapo','good-shepherd','firebirds','wolf-coffee','queenstown-central','te-anau','white-water-rafting']) }),
    exports: Object.freeze({ expenseSummaryTitle: 'CCMV NEW ZEALAND EXPENSE SUMMARY' }),
    heroLine1: 'New Zealand',
    heroEmphasis: 'Companion',
    tagline: 'Drive · Discover · Adventure',
    splashSlogan: 'ADVENTURE AWAITS',
    splashDestination: 'NEW ZEALAND 2026',
    storageNamespace: 'nz-family-2026',
    version: 'RC22.1',
    buildLabel: 'Unicode Mojibake Root Cause Repair',
    theme: root.THEME_CONFIG.colors
  });

  root.TRIP_CONFIG = config;

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
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',applyTripIdentity);
    else applyTripIdentity();
  }
})(globalThis);
