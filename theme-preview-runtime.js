(function(root){'use strict';
const KEY='travelEngine.themePreview.v1';
const UI_KEY='travelEngine.themePreview.ui.v2.1';
const frozen={preset:'nz',bg:'#EEF8FA',primary:'#087F9C',secondary:'#3D7F55',accent:'#F49A24',card:'#FFFFFF',cardOpacity:1,canvasEnabled:false,canvasAsset:'',canvasOpacity:.12,canvasSize:'cover',canvasPosition:'top',heroEnabled:false,heroAsset:'',logoEnabled:true,logoAsset:'nz-adventure-logo.png',logoSize:54,watermark:false,watermarkOpacity:.12,typography:'original',titleScale:1,heroRadius:30,decorative:true};

// Official Theme Studio catalogue — one click applies the complete visual
// package (palette, typography, canvas, cards, buttons, decorative styling).
// Fine Tune only ever exposes the 6 properties in FINE_TUNE_LABELS below;
// every other value in a preset is package-owned and not user-editable.
const THEMES=[
  {id:'adventure',icon:'🏔',name:'Adventure',tagline:'Fresh • Outdoor • Explorer'},
  {id:'japan',icon:'🌸',name:'Japan',tagline:'Warm • Editorial • Calm'},
  {id:'luxury',icon:'🍷',name:'Luxury',tagline:'Boutique • Elegant • Evening'},
  {id:'nature',icon:'🌿',name:'Nature',tagline:'Forest • Organic • Relaxing'},
  {id:'coastal',icon:'🌊',name:'Coastal',tagline:'Bright • Ocean • Summer'},
  {id:'heritage',icon:'🏛',name:'Heritage',tagline:'Classic • Historic • Cultural'},
  {id:'cafe',icon:'☕',name:'Cafe',tagline:'Minimal • Cozy • Lifestyle'},
  {id:'family',icon:'👨‍👩‍👧',name:'Family',tagline:'Friendly • Bright • Fun'}
];

// Each official theme owns a full visual package: base palette (primary/
// secondary/accent), readable ink/muted text tuned to its own card colour,
// a signature multi-stop hero gradient (+ ink/scrim for contrast on it),
// a distinct CTA colour, a hyperlink colour, an active bottom-nav/tab
// colour, and a 3-colour rotating Timeline stripe. These extra fields are
// only consumed by the "official theme package" rules in theme-preview.css
// (guarded to skip the nz/custom presets), so the Frozen NZ baseline is
// completely unaffected by Fine Tune.
const presets={
  nz:frozen,
  adventure:{...frozen,preset:'adventure',bg:'#EEF8FA',primary:'#087F9C',secondary:'#3D7F55',accent:'#F49A24',card:'#FFFFFF',cardOpacity:1,canvasEnabled:true,canvasAsset:'theme-preview-assets/adventure-fresh-outdoor-canvas.svg',canvasOpacity:.12,canvasSize:'cover',canvasPosition:'top',typography:'original',decorative:true,
    ink:'#0E3A42',muted:'#3F6B74',border:'rgba(8,127,140,.24)',
    heroGradient:'linear-gradient(135deg,#0B4B57 0%,#1F6E4A 55%,#F4A93A 100%)',heroInk:'#FFF8EA',heroScrim:'rgba(0,0,0,.16)',
    cta:'#F49A24',ctaInk:'#231200',link:'#2F6844',navActive:'#F49A24',navActiveInk:'#231200',timeline:['#087F9C','#3D7F55','#F49A24'],primaryInk:'#FFFFFF'},
  japan:{...frozen,preset:'japan',bg:'#F4EADB',primary:'#18263D',secondary:'#C98B8B',accent:'#B89A5D',card:'#FFF7E8',cardOpacity:.94,canvasEnabled:true,canvasAsset:'theme-preview-assets/japan-warm-editorial-canvas.svg',canvasOpacity:.12,canvasSize:'cover',canvasPosition:'top',typography:'editorial',decorative:false,
    ink:'#2B2118',muted:'#6B5A4A',border:'rgba(24,38,61,.20)',
    heroGradient:'linear-gradient(135deg,#D9A9A9 0%,#F4EADB 55%,#EDE2CF 100%)',heroInk:'#2B2118',heroScrim:'rgba(255,255,255,.16)',
    cta:'#C98B8B',ctaInk:'#2B1416',link:'#18263D',navActive:'#C98B8B',navActiveInk:'#2B1416',timeline:['#C98B8B','#B89A5D','#18263D'],primaryInk:'#FFFFFF'},
  luxury:{...frozen,preset:'luxury',bg:'#1B1420',primary:'#C9A24B',secondary:'#6B4226',accent:'#E8C77E',card:'#241B29',cardOpacity:.92,canvasEnabled:true,canvasAsset:'theme-preview-assets/luxury-boutique-elegant-canvas.svg',canvasOpacity:.16,canvasSize:'cover',canvasPosition:'center',typography:'editorial',decorative:true,
    ink:'#F3E7D0',muted:'#C9BBA9',border:'rgba(201,162,75,.32)',
    heroGradient:'linear-gradient(135deg,#1B1420 0%,#4B3A2A 45%,#C9A24B 80%,#E8C77E 100%)',heroInk:'#F8ECC9',heroScrim:'rgba(0,0,0,.18)',
    cta:'#E8C77E',ctaInk:'#241405',link:'#E8C77E',navActive:'#C9A24B',navActiveInk:'#241405',timeline:['#C9A24B','#E8C77E','#6B4226'],primaryInk:'#241405'},
  nature:{...frozen,preset:'nature',bg:'#EFF3E8',primary:'#3F6C40',secondary:'#7C9473',accent:'#A9784A',card:'#FBFBF3',cardOpacity:.97,canvasEnabled:true,canvasAsset:'theme-preview-assets/nature-forest-organic-canvas.svg',canvasOpacity:.13,canvasSize:'cover',canvasPosition:'center',typography:'soft',decorative:true,
    ink:'#22331A',muted:'#5B6E52',border:'rgba(63,108,64,.24)',
    heroGradient:'linear-gradient(135deg,#20361F 0%,#5C7C50 55%,#C6D3AE 100%)',heroInk:'#F5F7EC',heroScrim:'rgba(255,255,255,.10)',
    cta:'#A9784A',ctaInk:'#1F160C',link:'#3F6C40',navActive:'#A9784A',navActiveInk:'#1F160C',timeline:['#3F6C40','#7C9473','#A9784A'],primaryInk:'#FFFFFF'},
  coastal:{...frozen,preset:'coastal',bg:'#EAF6FB',primary:'#125E82',secondary:'#F2B705',accent:'#EF6C4D',card:'#FFFFFF',cardOpacity:1,canvasEnabled:true,canvasAsset:'theme-preview-assets/coastal-bright-ocean-canvas.svg',canvasOpacity:.14,canvasSize:'cover',canvasPosition:'top',typography:'modern',decorative:true,
    ink:'#123049',muted:'#4A6E82',border:'rgba(18,94,130,.24)',
    heroGradient:'linear-gradient(135deg,#0E5C82 0%,#3FAFC9 55%,#EAF6FB 100%)',heroInk:'#083247',heroScrim:'rgba(255,255,255,.14)',
    cta:'#EF6C4D',ctaInk:'#3A0E04',link:'#125E82',navActive:'#EF6C4D',navActiveInk:'#FFF8F3',timeline:['#125E82','#F2B705','#EF6C4D'],primaryInk:'#FFFFFF'},
  heritage:{...frozen,preset:'heritage',bg:'#F3ECE0',primary:'#6E3B2C',secondary:'#8C7A4B',accent:'#B0452E',card:'#FAF6EE',cardOpacity:.96,canvasEnabled:true,canvasAsset:'theme-preview-assets/heritage-classic-historic-canvas.svg',canvasOpacity:.12,canvasSize:'cover',canvasPosition:'top',typography:'editorial',decorative:true,
    ink:'#3B2417',muted:'#7A6A55',border:'rgba(110,59,44,.24)',
    heroGradient:'linear-gradient(135deg,#B0452E 0%,#C9A876 60%,#F3ECE0 100%)',heroInk:'#3B2210',heroScrim:'rgba(255,255,255,.10)',
    cta:'#B0452E',ctaInk:'#FFF7EE',link:'#6E3B2C',navActive:'#B0452E',navActiveInk:'#FFF7EE',timeline:['#B0452E','#8C7A4B','#6E3B2C'],primaryInk:'#FFFFFF'},
  cafe:{...frozen,preset:'cafe',bg:'#F7F1EA',primary:'#6F4E37',secondary:'#B08968',accent:'#D97742',card:'#FFFFFF',cardOpacity:.98,canvasEnabled:true,canvasAsset:'theme-preview-assets/cafe-minimal-cozy-canvas.svg',canvasOpacity:.08,canvasSize:'cover',canvasPosition:'center',typography:'modern',decorative:false,
    ink:'#3A2A1D',muted:'#7A6353',border:'rgba(111,78,55,.24)',
    heroGradient:'linear-gradient(135deg,#6F4E37 0%,#E8D2AE 55%,#C9A876 100%)',heroInk:'#2A1B10',heroScrim:'rgba(255,255,255,.14)',
    cta:'#D97742',ctaInk:'#301300',link:'#6F4E37',navActive:'#D97742',navActiveInk:'#FFF8F2',timeline:['#6F4E37','#D97742','#B08968'],primaryInk:'#FFFFFF'},
  family:{...frozen,preset:'family',bg:'#FFF8ED',primary:'#FF6F59',secondary:'#3AACA8',accent:'#FFC145',card:'#FFFFFF',cardOpacity:1,canvasEnabled:true,canvasAsset:'theme-preview-assets/family-friendly-bright-canvas.svg',canvasOpacity:.14,canvasSize:'cover',canvasPosition:'top',typography:'soft',decorative:true,
    ink:'#22314F',muted:'#5C6B85',border:'rgba(58,172,168,.24)',
    heroGradient:'linear-gradient(135deg,#8ED0F0 0%,#FFC145 55%,#8FCB7B 100%)',heroInk:'#1F3A2E',heroScrim:'rgba(255,255,255,.12)',
    cta:'#FF6F59',ctaInk:'#341008',link:'#3AACA8',navActive:'#FF6F59',navActiveInk:'#341008',timeline:['#FF6F59','#FFC145','#3AACA8'],primaryInk:'#341008'}
};

// Fine Tune editable properties — deliberately only these eight. Each is a
// single named property on the preset object; overriding one never touches
// the others. heroGradient is edited as two colour stops (start/end) but
// stored/restored as one override, since the brief lists it as one setting.
const FINE_TUNE_PROPS=['cta','ctaInk','navActive','navActiveInk','heroGradient','bg','card','accent'];
const FINE_TUNE_LABELS={cta:'Primary Button Colour',ctaInk:'Primary Button Text Colour',navActive:'Active Navigation Colour',navActiveInk:'Active Navigation Text / Icon Colour',heroGradient:'Hero Gradient Colours',bg:'Page Background',card:'Card Background',accent:'Accent Colour'};

function loadPersisted(){
  try{
    const raw=JSON.parse(localStorage.getItem(KEY)||'null');
    if(raw&&raw.schemaVersion===2&&typeof raw.selectedTheme==='string'){
      return {selectedTheme:presets[raw.selectedTheme]?raw.selectedTheme:'nz',overrides:raw.overrides&&typeof raw.overrides==='object'?raw.overrides:{}};
    }
  }catch(e){}
  // No recognised v2 record (first run, or a pre-Fine-Tune save) — start clean from Frozen NZ.
  return {selectedTheme:'nz',overrides:{}};
}
const _persisted=loadPersisted();
let selectedTheme=_persisted.selectedTheme;
let overrides=_persisted.overrides; // { themeId: { cta, ctaInk, heroGradient, bg, card, accent } }
let state={...(presets[selectedTheme]||frozen),...(overrides[selectedTheme]||{}),preset:selectedTheme}; // merged/effective values — recomputed by recompute()
let ui=loadUi();
function persist(){localStorage.setItem(KEY,JSON.stringify({schemaVersion:2,selectedTheme,overrides}))}
function loadUi(){try{return {enabled:false,collapsed:true,left:null,top:null,...JSON.parse(localStorage.getItem(UI_KEY)||'{}')}}catch(e){return {enabled:false,collapsed:true,left:null,top:null}}}
function saveUi(){localStorage.setItem(UI_KEY,JSON.stringify(ui))}
function themeOverrides(id){return overrides[id]||{}}
function heroStopsOf(id){const grad=(presets[id]||frozen).heroGradient||'';const hexes=grad.match(/#[0-9a-fA-F]{6}/g)||[];return hexes.length>=2?[hexes[0],hexes[hexes.length-1]]:['#000000','#ffffff']}
function effectiveHeroStops(id){const ov=themeOverrides(id).heroGradient;if(ov){const hexes=ov.match(/#[0-9a-fA-F]{6}/g)||[];if(hexes.length>=2)return [hexes[0],hexes[1]]}return heroStopsOf(id)}
function recompute(){state={...(presets[selectedTheme]||frozen),...themeOverrides(selectedTheme),preset:selectedTheme}}
function setOverride(prop,value){overrides={...overrides,[selectedTheme]:{...themeOverrides(selectedTheme),[prop]:value}};persist();recompute();apply();renderFineTune();syncThemeCards()}
function setHeroStop(which,hex){const [s,e]=effectiveHeroStops(selectedTheme),start=which==='start'?hex:s,end=which==='end'?hex:e;setOverride('heroGradient',`linear-gradient(135deg,${start} 0%,${end} 100%)`)}
function restoreSetting(prop){const cur=themeOverrides(selectedTheme);if(!(prop in cur))return;const next={...cur};delete next[prop];overrides={...overrides,[selectedTheme]:next};if(!Object.keys(next).length){const {[selectedTheme]:_,...rest}=overrides;overrides=rest}persist();recompute();apply();renderFineTune();syncThemeCards()}
function restoreSelectedTheme(){if(!(selectedTheme in overrides))return;const {[selectedTheme]:_,...rest}=overrides;overrides=rest;persist();recompute();apply();renderFineTune();syncThemeCards()}
function resetToFrozenNZ(){selectedTheme='nz';persist();recompute();apply();sync()}
function fontPair(name){if(name==='editorial')return ['Georgia,"Times New Roman",serif','system-ui,-apple-system,"Segoe UI",sans-serif'];if(name==='soft')return ['"Trebuchet MS","Arial Rounded MT Bold",system-ui,sans-serif','system-ui,-apple-system,"Segoe UI",sans-serif'];if(name==='modern')return ['system-ui,-apple-system,"Segoe UI",sans-serif','system-ui,-apple-system,"Segoe UI",sans-serif'];return ['var(--ccmv-fashion-serif,"Cormorant Garamond",Georgia,serif)','var(--font-sans,Inter,system-ui,sans-serif)']}
function asset(path){return path?`url("${String(path).replace(/"/g,'')}")`:'none'}
function apply(){const el=document.documentElement,[heading,body]=fontPair(state.typography);el.classList.add('theme-preview-active');el.classList.toggle('theme-preview-no-decor',!state.decorative);el.classList.toggle('theme-preview-watermark',!!state.watermark);el.classList.toggle('theme-preview-hero-image',!!state.heroEnabled&&!!state.heroAsset);el.classList.toggle('theme-preview-logo-off',!state.logoEnabled);el.setAttribute('data-theme-preset',state.preset||'custom');
  // Fine Tune's "Primary Button Colour/Text" (cta/ctaInk) is the single override
  // that must drive every real primary-CTA button in the Engine — the brand
  // .btn/.home-day-button treatment as well as the .primary-action treatment.
  // When it hasn't been fine-tuned, .btn/.home-day-button keeps rendering the
  // Theme's own `primary`/`primaryInk` exactly as before (no default-palette
  // change); once overridden, both button families converge on the same value.
  const ftOverrides=themeOverrides(selectedTheme),
    primaryButtonBg=('cta' in ftOverrides)?state.cta:state.primary,
    primaryButtonText=('ctaInk' in ftOverrides)?state.ctaInk:state.primaryInk;
  const v={'--tp-bg':state.bg,'--tp-primary':state.primary,'--tp-secondary':state.secondary,'--tp-accent':state.accent,'--tp-card':state.card,'--tp-card-opacity':state.cardOpacity,'--tp-canvas-image':state.canvasEnabled?asset(state.canvasAsset):'none','--tp-canvas-opacity':state.canvasEnabled?state.canvasOpacity:0,'--tp-canvas-size':state.canvasSize,'--tp-canvas-position':state.canvasPosition,'--tp-hero-image':asset(state.heroAsset),'--tp-heading-font':heading,'--tp-body-font':body,'--tp-title-scale':Math.max(.88,Math.min(1.08,Number(state.titleScale)||1)),'--tp-hero-radius':Math.max(20,Math.min(40,Number(state.heroRadius)||30))+'px','--tp-logo-size':Math.max(36,Math.min(84,Number(state.logoSize)||54))+'px','--tp-watermark-opacity':Math.max(.04,Math.min(.25,Number(state.watermarkOpacity)||.12)),'--tp-ink':state.ink||state.primary,
    /* Official Theme Studio package — only read by rules scoped away from the nz/custom presets. */
    '--tp-muted':state.muted||state.primary,'--tp-border':state.border||'transparent',
    '--tp-hero-gradient':state.heroGradient||'none','--tp-hero-ink':state.heroInk||state.ink||state.primary,'--tp-hero-scrim':state.heroScrim||'rgba(0,0,0,0)',
    '--tp-primary-ink':state.primaryInk||'#fff','--tp-cta':state.cta||state.accent,'--tp-cta-ink':state.ctaInk||'#fff','--tp-link':state.link||state.primary,
    '--tp-nav-active':state.navActive||state.accent,'--tp-nav-active-ink':state.navActiveInk||'#fff',
    '--tp-timeline-1':(state.timeline&&state.timeline[0])||state.primary,'--tp-timeline-2':(state.timeline&&state.timeline[1])||state.secondary,'--tp-timeline-3':(state.timeline&&state.timeline[2])||state.accent,
    /* Dedicated Fine Tune "Primary Button" runtime properties — the single
       shared integration point for every real primary CTA selector (Home
       "Let's go", Booking/Expenses/Moments primary-action buttons). */
    '--theme-preview-primary-button-bg':primaryButtonBg||state.accent,'--theme-preview-primary-button-text':primaryButtonText||'#fff'
  };Object.entries(v).forEach(([k,val])=>el.style.setProperty(k,val));if(state.logoEnabled&&state.logoAsset)document.querySelectorAll('[data-brand-logo="header"]').forEach(img=>{img.src=state.logoAsset});document.dispatchEvent(new CustomEvent('travelengine:theme-preview-applied',{detail:{...state}}))}
function setPreset(id){selectedTheme=presets[id]?id:'nz';persist();recompute();apply();sync()}
// Kept for API/back-compat — not wired to any control in the simplified UI.
function exportJson(){const blob=new Blob([JSON.stringify({schema:'travelEngine.themePreview.v1',selectedTheme,overrides},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='travel-engine-theme-preview.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function importJson(file){const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(x.schema!=='travelEngine.themePreview.v1')throw Error();selectedTheme=presets[x.selectedTheme]?x.selectedTheme:'nz';overrides=x.overrides&&typeof x.overrides==='object'?x.overrides:{};persist();recompute();apply();sync()}catch(e){alert('Invalid Theme Preview JSON.')}};r.readAsText(file)}
function sync(){syncThemeCards();renderFineTune()}
function syncThemeCards(){document.querySelectorAll('[data-theme-card]').forEach(card=>{const active=card.dataset.themeCard===selectedTheme;card.classList.toggle('is-active',active);const btn=card.querySelector('[data-apply-theme]');if(btn)btn.textContent=active?'Applied':'Apply'})}
function colourRow(prop){const label=FINE_TUNE_LABELS[prop],overridden=prop in themeOverrides(selectedTheme),value=state[prop]||'#000000';
  return `<div class="theme-preview-field full ft-row"><label>${label}${overridden?' <span class="ft-badge">Custom</span>':''}<button type="button" class="ft-restore" data-ft-restore="${prop}" ${overridden?'':'disabled'} title="Restore This Setting" aria-label="Restore ${label} to theme default">↺</button></label><div class="theme-preview-colour"><input class="ft-picker" data-ft-picker="${prop}" type="color" value="${value}" aria-label="${label} colour picker"><input class="ft-text" data-ft-text="${prop}" type="text" maxlength="7" value="${value}" aria-label="${label} hex value"></div></div>`}
function heroRow(){const overridden='heroGradient' in themeOverrides(selectedTheme),[s,e]=effectiveHeroStops(selectedTheme);
  return `<div class="theme-preview-field full ft-row"><label>${FINE_TUNE_LABELS.heroGradient}${overridden?' <span class="ft-badge">Custom</span>':''}<button type="button" class="ft-restore" data-ft-restore="heroGradient" ${overridden?'':'disabled'} title="Restore This Setting" aria-label="Restore Hero Gradient Colours to theme default">↺</button></label><div class="theme-preview-colour ft-hero-pair"><input class="ft-picker" data-ft-hero="start" type="color" value="${s}" aria-label="Hero gradient start colour"><input class="ft-text" data-ft-hero-text="start" type="text" maxlength="7" value="${s}" aria-label="Hero gradient start hex value"><input class="ft-picker" data-ft-hero="end" type="color" value="${e}" aria-label="Hero gradient end colour"><input class="ft-text" data-ft-hero-text="end" type="text" maxlength="7" value="${e}" aria-label="Hero gradient end hex value"></div></div>`}
function fineTuneBody(){if(selectedTheme==='nz')return '<p class="ft-empty">Select an official Theme above to Fine Tune it.</p>';
  return `${colourRow('cta')}${colourRow('ctaInk')}${colourRow('navActive')}${colourRow('navActiveInk')}${heroRow()}${colourRow('bg')}${colourRow('card')}${colourRow('accent')}<button type="button" class="ft-restore-theme" data-ft-restore-theme="1" ${selectedTheme in overrides?'':'disabled'}>Restore Selected Theme</button>`}
function renderFineTune(){const body=document.getElementById('ftBody');if(body)body.innerHTML=fineTuneBody()}
function themeCard(t){const p=presets[t.id];return `<div class="theme-card" data-theme-card="${t.id}"><div class="theme-card-swatch" style="background:${p.heroGradient||('linear-gradient(135deg,'+p.primary+','+p.accent+')')}"></div><div class="theme-card-copy"><strong>${t.icon} ${t.name}</strong><small>${t.tagline}</small></div><button class="theme-card-apply" data-apply-theme="${t.id}" type="button">Apply</button></div>`}
function controls(){return `<div class="theme-preview-notice">PREVIEW ONLY · LIVE ON THE REAL COMPANION</div>
<p class="theme-preview-section-label">Choose Theme</p>
<div class="theme-preview-list">${THEMES.map(themeCard).join('')}</div>
<details class="theme-preview-advanced"><summary>Fine Tune</summary><div class="theme-preview-advanced-body" id="ftBody">${fineTuneBody()}</div></details>
<button id="tpReset" class="theme-preview-reset" type="button">Reset to Frozen NZ</button>`}
function build(){buildStudioLauncher();buildFloatingInspector();wire();sync();syncVisibility()}
function buildStudioLauncher(){const host=document.getElementById('tripStudioThemePreview');if(!host)return;if(host.dataset.themePreviewLauncher==='1'){syncLauncher();return}host.dataset.themePreviewLauncher='1';host.hidden=false;host.innerHTML=`<p class="trip-studio-label">🎨 THEME PREVIEW</p><div class="theme-preview-launch-card"><div><strong>Floating Theme Inspector</strong><small id="tpLauncherStatus">Closed · preview controls are not covering Studio.</small></div><div class="theme-preview-launch-actions"><button id="tpLaunchFloating" type="button">Open Inspector</button><button id="tpDisableFloating" class="secondary" type="button">Close Inspector</button></div></div>`;document.getElementById('tpLaunchFloating').addEventListener('click',()=>{setEnabled(true);setCollapsed(false);if(typeof root.closeTripStudioPanel==='function')root.closeTripStudioPanel();else document.querySelector('.trip-studio-close')?.click()});document.getElementById('tpDisableFloating').addEventListener('click',()=>setEnabled(false));syncLauncher()}
function syncLauncher(){const status=document.getElementById('tpLauncherStatus'),open=document.getElementById('tpLaunchFloating'),close=document.getElementById('tpDisableFloating');if(status)status.textContent=ui.enabled?(ui.collapsed?'Open · collapsed to the 🎨 button.':'Open · live controls are floating over the Companion.'):'Closed · preview controls are not covering Studio.';if(open)open.textContent=ui.enabled?'Show Inspector':'Open Inspector';if(close)close.disabled=!ui.enabled}
function buildFloatingInspector(){if(document.getElementById('themePreviewInspector'))return;const shell=document.createElement('aside');shell.id='themePreviewInspector';shell.className='theme-preview-inspector';shell.setAttribute('aria-label','Floating Theme Inspector');shell.innerHTML=`<button class="theme-preview-fab" id="tpFab" type="button" aria-label="Open Theme Inspector">🎨</button><div class="theme-preview-window"><header class="theme-preview-window-head" id="tpDragHandle"><div><strong>🎨 Theme</strong><small>PREVIEW ONLY</small></div><div class="theme-preview-head-actions"><button id="tpCollapse" type="button" aria-label="Collapse Theme Inspector">−</button><button id="tpCloseInspector" type="button" aria-label="Close Theme Inspector">×</button></div></header><div class="theme-preview-window-body">${controls()}</div></div>`;document.body.appendChild(shell);applyUi();document.getElementById('tpFab').addEventListener('click',()=>setCollapsed(false));document.getElementById('tpCollapse').addEventListener('click',()=>setCollapsed(true));document.getElementById('tpCloseInspector').addEventListener('click',()=>setEnabled(false));enableDrag(shell,document.getElementById('tpDragHandle'))}
function wire(){const inspector=document.getElementById('themePreviewInspector');if(!inspector)return;
  inspector.addEventListener('click',e=>{
    const themeBtn=e.target.closest('[data-apply-theme]');if(themeBtn){setPreset(themeBtn.dataset.applyTheme);return}
    const restoreBtn=e.target.closest('[data-ft-restore]');if(restoreBtn&&!restoreBtn.disabled){restoreSetting(restoreBtn.dataset.ftRestore);return}
    const restoreThemeBtn=e.target.closest('[data-ft-restore-theme]');if(restoreThemeBtn&&!restoreThemeBtn.disabled){restoreSelectedTheme();return}
  });
  inspector.addEventListener('input',e=>{
    const picker=e.target.closest('[data-ft-picker]');if(picker){const prop=picker.dataset.ftPicker,text=inspector.querySelector(`[data-ft-text="${prop}"]`);if(text)text.value=picker.value;setOverride(prop,picker.value);return}
    const heroPicker=e.target.closest('[data-ft-hero]');if(heroPicker){const which=heroPicker.dataset.ftHero,text=inspector.querySelector(`[data-ft-hero-text="${which}"]`);if(text)text.value=heroPicker.value;setHeroStop(which,heroPicker.value);return}
  });
  inspector.addEventListener('change',e=>{
    const text=e.target.closest('[data-ft-text]');if(text){const prop=text.dataset.ftText;if(/^#[0-9a-f]{6}$/i.test(text.value))setOverride(prop,text.value);else renderFineTune();return}
    const heroText=e.target.closest('[data-ft-hero-text]');if(heroText){const which=heroText.dataset.ftHeroText;if(/^#[0-9a-f]{6}$/i.test(heroText.value))setHeroStop(which,heroText.value);else renderFineTune();return}
  });
  document.getElementById('tpReset')?.addEventListener('click',resetToFrozenNZ);
}
function setEnabled(enabled){ui.enabled=!!enabled;if(ui.enabled)ui.collapsed=false;saveUi();applyUi();syncVisibility();syncLauncher()}
function setCollapsed(collapsed){ui.collapsed=!!collapsed;saveUi();applyUi();syncLauncher()}
function applyUi(){const shell=document.getElementById('themePreviewInspector');if(!shell)return;shell.classList.toggle('is-collapsed',ui.collapsed);if(innerWidth>700&&Number.isFinite(ui.left)&&Number.isFinite(ui.top)){shell.style.left=Math.max(8,Math.min(innerWidth-shell.offsetWidth-8,ui.left))+'px';shell.style.top=Math.max(8,Math.min(innerHeight-shell.offsetHeight-8,ui.top))+'px';shell.style.right='auto';shell.style.bottom='auto'}else{shell.style.removeProperty('left');shell.style.removeProperty('top');shell.style.removeProperty('right');shell.style.removeProperty('bottom')}}
function syncVisibility(){const shell=document.getElementById('themePreviewInspector');if(shell)shell.hidden=!ui.enabled}
function enableDrag(shell,handle){let drag=null;handle.addEventListener('pointerdown',event=>{if(innerWidth<=700||event.target.closest('button'))return;const rect=shell.getBoundingClientRect();drag={x:event.clientX-rect.left,y:event.clientY-rect.top};handle.setPointerCapture(event.pointerId);shell.classList.add('is-dragging')});handle.addEventListener('pointermove',event=>{if(!drag)return;const left=Math.max(8,Math.min(innerWidth-shell.offsetWidth-8,event.clientX-drag.x));const top=Math.max(8,Math.min(innerHeight-shell.offsetHeight-8,event.clientY-drag.y));shell.style.left=left+'px';shell.style.top=top+'px';shell.style.right='auto';shell.style.bottom='auto';ui.left=left;ui.top=top});const stop=event=>{if(!drag)return;drag=null;shell.classList.remove('is-dragging');saveUi();try{handle.releasePointerCapture(event.pointerId)}catch(e){}};handle.addEventListener('pointerup',stop);handle.addEventListener('pointercancel',stop)}
document.addEventListener('DOMContentLoaded',()=>{apply();setTimeout(build,0);const observer=new MutationObserver(()=>{const host=document.getElementById('tripStudioThemePreview');if(host&&host.dataset.themePreviewLauncher!=='1')buildStudioLauncher();syncVisibility()});observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});addEventListener('resize',applyUi)});root.ThemePreviewStudio={apply,reset:resetToFrozenNZ,setPreset,restoreSetting,restoreSelectedTheme,exportJson,importJson,open:()=>{setEnabled(true);setCollapsed(false)},close:()=>setEnabled(false),getState:()=>({...state}),themes:()=>THEMES.slice()};
})(globalThis);
