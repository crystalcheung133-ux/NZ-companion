/* layout-runtime.js — Applies Engine-owned layout variables consistently.
   Prevents fixed bottom navigation from covering page content or actions. */
(function(root){
  'use strict';
  function px(value){ return String(Number(value)||0)+'px'; }
  function applyLayoutContract(){
    if(typeof document==='undefined') return;
    const cfg=root.LAYOUT_CONFIG||{};
    const style=document.documentElement.style;
    style.setProperty('--engine-site-nav-height',px(cfg.siteNavHeight||68));
    style.setProperty('--engine-bottom-nav-height',px(cfg.bottomNavHeight||68));
    style.setProperty('--engine-bottom-nav-offset',px(cfg.bottomNavOffset||12));
    style.setProperty('--engine-page-bottom-gap',px(cfg.pageBottomGap||24));
    style.setProperty('--engine-page-bottom-safe',`calc(${px((cfg.bottomNavHeight||68)+(cfg.bottomNavOffset||12)+(cfg.pageBottomGap||24))} + env(safe-area-inset-bottom))`);
    style.setProperty('--engine-home-card-max-width',px(cfg.homeCardMaxWidth||820));
    style.setProperty('--engine-home-card-radius',px(cfg.homeCardRadius||36));
    style.setProperty('--engine-home-card-padding-desktop',px(cfg.homeCardPaddingDesktop||36));
    style.setProperty('--engine-home-card-padding-mobile',px(cfg.homeCardPaddingMobile||22));
    style.setProperty('--engine-home-content-gap',px(cfg.homeContentGap||18));
    document.documentElement.classList.add('engine-layout-ready');
  }
  root.applyLayoutContract=applyLayoutContract;
  applyLayoutContract();
})(globalThis);
