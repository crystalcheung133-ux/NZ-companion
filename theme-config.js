/* theme-config.js — Stage 7B-2 audited canonical visual theme configuration. */
(function(root){
  'use strict';
  const theme = Object.freeze({
    name: 'New Zealand Adventure',
    colors: Object.freeze({
      primary: '#087F9C', primaryDeep: '#075B73', secondary: '#3D7F55', secondaryDeep: '#2F6844',
      accent: '#F49A24', accentDeep: '#C96D00', highlight: '#E94F37',
      background: '#EEF8FA', surface: '#FFFFFF', ink: '#15324B', muted: '#557086',
      border: 'rgba(21,50,75,.16)', heroSky: '#DDF4FA', heroMeadow: '#E8F7EF', heroSun: '#FFF2D6'
    }),
    gradients: Object.freeze({
      hero: 'linear-gradient(135deg,#DDF4FA 0%,#E8F7EF 58%,#FFF2D6 100%)',
      primaryAction: 'linear-gradient(135deg,#087F9C,#075B73)',
      secondaryAction: 'linear-gradient(135deg,#3D7F55,#2F6844)',
      accentAction: 'linear-gradient(135deg,#F49A24,#E67E00)',
      homeHero: 'linear-gradient(135deg,#CFEFF7 0%,#DFF4E5 55%,#FFE6B8 100%)',
      splash: 'linear-gradient(180deg,#DDF4FA 0%,#DFF3E4 58%,#FFF2D6 100%)'
    }),
    radius: Object.freeze({ surface: '26px', hero: '30px', button: '18px', compactButton: '14px' }),
    borderWeight: '1px',
    shadows: Object.freeze({ surface: '0 11px 28px rgba(16,42,67,.09)', hero: '0 16px 38px rgba(21,50,75,.09)', nav: '0 3px 15px rgba(21,50,75,.045)', action: '0 10px 24px rgba(7,91,115,.18)' }),
    treatments: Object.freeze({ navigation: 'light-glass', hero: 'light-adventure-gradient', watermark: 'none', splash: 'full-badge-light-gradient' })
  });
  root.THEME_CONFIG=theme;
  if(typeof document!=='undefined'){
    const c=theme.colors,g=theme.gradients,r=theme.radius,s=theme.shadows;
    const vars={
      '--theme-primary':c.primary,'--theme-primary-deep':c.primaryDeep,'--theme-secondary':c.secondary,'--theme-secondary-deep':c.secondaryDeep,
      '--theme-accent':c.accent,'--theme-accent-deep':c.accentDeep,'--theme-highlight':c.highlight,'--theme-background':c.background,
      '--theme-surface':c.surface,'--theme-ink':c.ink,'--theme-muted':c.muted,'--theme-border':c.border,'--theme-hero-sky':c.heroSky,'--theme-hero-meadow':c.heroMeadow,'--theme-hero-sun':c.heroSun,
      '--theme-hero-gradient':g.hero,'--theme-primary-action':g.primaryAction,'--theme-secondary-action':g.secondaryAction,
      '--theme-accent-action':g.accentAction,'--theme-home-hero':g.homeHero,'--theme-splash':g.splash,
      '--theme-surface-radius':r.surface,'--theme-hero-radius':r.hero,'--theme-button-radius':r.button,'--theme-compact-button-radius':r.compactButton,
      '--theme-border-weight':theme.borderWeight,'--theme-shadow-surface':s.surface,'--theme-shadow-hero':s.hero,'--theme-shadow-nav':s.nav,'--theme-shadow-action':s.action
    };
    const style=document.createElement('style'); style.id='travel-engine-theme-tokens';
    style.textContent=':root{'+Object.entries(vars).map(([k,v])=>k+':'+v).join(';')+';}';
    document.head.appendChild(style);
  }
})(globalThis);
