/* asset-config.js — Stage 7D canonical asset configuration.
   Single source for every branding, hero, icon and splash asset reference.
   Manifest, Service Worker, HTML, CSS and JS must read asset paths from here. */
(function(root){
  'use strict';

  const assets = Object.freeze({
    branding: Object.freeze({
      primaryLogo: 'nz-adventure-logo.png',
      secondaryMark: 'nz-adventure-mark.png',
      splashLogo: 'nz-adventure-logo.png',
      splashMark: 'nz-adventure-mark.png'
    }),
    hero: Object.freeze({
      coverImage: null,
      heroImage: null,
      heroOverlay: null
    }),
    icons: Object.freeze({
      favicon: 'icon-192.png',
      appIcon: 'icon-192.png',
      appleIcon: 'icon-192.png',
      icon192: 'icon-192.png',
      icon512: 'icon-512.png'
    }),
    splash: Object.freeze({
      background: null,
      assets: Object.freeze(['nz-adventure-logo.png'])
    })
  });

  root.ASSET_CONFIG = assets;
})(globalThis);
