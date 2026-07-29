/* layout-config.js — Engine-owned responsive layout contract.
   Trip data must not override fixed navigation safety or front-page geometry. */
(function(root){
  'use strict';
  root.LAYOUT_CONFIG = Object.freeze({
    siteNavHeight: 68,
    bottomNavHeight: 68,
    bottomNavOffset: 12,
    pageBottomGap: 24,
    homeCardMaxWidth: 820,
    homeCardRadius: 36,
    homeCardPaddingDesktop: 36,
    homeCardPaddingMobile: 22,
    homeContentGap: 18
  });
})(globalThis);
