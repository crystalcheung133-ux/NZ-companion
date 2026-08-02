(function(root){'use strict';
const KEY='travelEngine.themePreview.v1';
const UI_KEY='travelEngine.themePreview.ui.v2.1';
const frozen={preset:'nz',bg:'#EEF8FA',primary:'#087F9C',secondary:'#3D7F55',accent:'#F49A24',card:'#FFFFFF',cardOpacity:1,canvasEnabled:false,canvasAsset:'',canvasOpacity:.12,canvasSize:'cover',canvasPosition:'top',heroEnabled:false,heroAsset:'',logoEnabled:true,logoAsset:'nz-adventure-logo.png',logoSize:54,watermark:false,watermarkOpacity:.12,typography:'original',titleScale:1,heroRadius:30,decorative:true};

// Official Theme Studio catalogue — one click applies the complete visual
// package (palette, typography, canvas, cards, buttons, decorative styling).
// Advanced only ever exposes Background Colour / Card Opacity / Typography;
// every other value below is preset-owned and not user-editable.
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
// (guarded to skip the nz/custom presets), so the Frozen NZ baseline and
// the Advanced panel are completely unaffected.
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
    cta:'#A9784A',ctaInk:'#FFF8EE',link:'#3F6C40',navActive:'#A9784A',navActiveInk:'#FFF8EE',timeline:['#3F6C40','#7C9473','#A9784A'],primaryInk:'#FFFFFF'},
  coastal:{...frozen,preset:'coastal',bg:'#EAF6FB',primary:'#1583B7',secondary:'#F2B705',accent:'#EF6C4D',card:'#FFFFFF',cardOpacity:1,canvasEnabled:true,canvasAsset:'theme-preview-assets/coastal-bright-ocean-canvas.svg',canvasOpacity:.14,canvasSize:'cover',canvasPosition:'top',typography:'modern',decorative:true,
    ink:'#123049',muted:'#4A6E82',border:'rgba(21,131,183,.24)',
    heroGradient:'linear-gradient(135deg,#0E5C82 0%,#3FAFC9 55%,#EAF6FB 100%)',heroInk:'#083247',heroScrim:'rgba(255,255,255,.14)',
    cta:'#EF6C4D',ctaInk:'#3A0E04',link:'#1583B7',navActive:'#EF6C4D',navActiveInk:'#FFF8F3',timeline:['#1583B7','#F2B705','#EF6C4D'],primaryInk:'#FFFFFF'},
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
    cta:'#FF6F59',ctaInk:'#FFF8F5',link:'#3AACA8',navActive:'#FF6F59',navActiveInk:'#FFF8F5',timeline:['#FF6F59','#FFC145','#3AACA8'],primaryInk:'#FFFFFF'}
};

let state=load();
let ui=loadUi();
function load(){try{return {...frozen,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(e){return {...frozen}}}
function loadUi(){try{return {enabled:false,collapsed:true,left:null,top:null,...JSON.parse(localStorage.getItem(UI_KEY)||'{}')}}catch(e){return {enabled:false,collapsed:true,left:null,top:null}}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function saveUi(){localStorage.setItem(UI_KEY,JSON.stringify(ui))}
function fontPair(name){if(name==='editorial')return ['Georgia,"Times New Roman",serif','system-ui,-apple-system,"Segoe UI",sans-serif'];if(name==='soft')return ['"Trebuchet MS","Arial Rounded MT Bold",system-ui,sans-serif','system-ui,-apple-system,"Segoe UI",sans-serif'];if(name==='modern')return ['system-ui,-apple-system,"Segoe UI",sans-serif','system-ui,-apple-system,"Segoe UI",sans-serif'];return ['var(--ccmv-fashion-serif,"Cormorant Garamond",Georgia,serif)','var(--font-sans,Inter,system-ui,sans-serif)']}
function asset(path){return path?`url("${String(path).replace(/"/g,'')}")`:'none'}
function apply(){const el=document.documentElement,[heading,body]=fontPair(state.typography);el.classList.add('theme-preview-active');el.classList.toggle('theme-preview-no-decor',!state.decorative);el.classList.toggle('theme-preview-watermark',!!state.watermark);el.classList.toggle('theme-preview-hero-image',!!state.heroEnabled&&!!state.heroAsset);el.classList.toggle('theme-preview-logo-off',!state.logoEnabled);el.setAttribute('data-theme-preset',state.preset||'custom');const v={'--tp-bg':state.bg,'--tp-primary':state.primary,'--tp-secondary':state.secondary,'--tp-accent':state.accent,'--tp-card':state.card,'--tp-card-opacity':state.cardOpacity,'--tp-canvas-image':state.canvasEnabled?asset(state.canvasAsset):'none','--tp-canvas-opacity':state.canvasEnabled?state.canvasOpacity:0,'--tp-canvas-size':state.canvasSize,'--tp-canvas-position':state.canvasPosition,'--tp-hero-image':asset(state.heroAsset),'--tp-heading-font':heading,'--tp-body-font':body,'--tp-title-scale':Math.max(.88,Math.min(1.08,Number(state.titleScale)||1)),'--tp-hero-radius':Math.max(20,Math.min(40,Number(state.heroRadius)||30))+'px','--tp-logo-size':Math.max(36,Math.min(84,Number(state.logoSize)||54))+'px','--tp-watermark-opacity':Math.max(.04,Math.min(.25,Number(state.watermarkOpacity)||.12)),'--tp-ink':state.ink||state.primary,
    /* Official Theme Studio package — only read by rules scoped away from the nz/custom presets. */
    '--tp-muted':state.muted||state.primary,'--tp-border':state.border||'transparent',
    '--tp-hero-gradient':state.heroGradient||'none','--tp-hero-ink':state.heroInk||state.ink||state.primary,'--tp-hero-scrim':state.heroScrim||'rgba(0,0,0,0)',
    '--tp-primary-ink':state.primaryInk||'#fff','--tp-cta':state.cta||state.accent,'--tp-cta-ink':state.ctaInk||'#fff','--tp-link':state.link||state.primary,
    '--tp-nav-active':state.navActive||state.accent,'--tp-nav-active-ink':state.navActiveInk||'#fff',
    '--tp-timeline-1':(state.timeline&&state.timeline[0])||state.primary,'--tp-timeline-2':(state.timeline&&state.timeline[1])||state.secondary,'--tp-timeline-3':(state.timeline&&state.timeline[2])||state.accent
  };Object.entries(v).forEach(([k,val])=>el.style.setProperty(k,val));if(state.logoEnabled&&state.logoAsset)document.querySelectorAll('[data-brand-logo="header"]').forEach(img=>{img.src=state.logoAsset});document.dispatchEvent(new CustomEvent('travelengine:theme-preview-applied',{detail:{...state}}))}
function update(patch){state={...state,...patch,preset:patch.preset||'custom'};save();apply();sync()}
function setPreset(id){state={...(presets[id]||frozen)};save();apply();sync()}
function reset(){localStorage.removeItem(KEY);state={...frozen};apply();sync()}
// Kept for API/back-compat — not wired to any control in the simplified UI.
function exportJson(){const blob=new Blob([JSON.stringify({schema:'travelEngine.themePreview.v1',settings:state},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='travel-engine-theme-preview.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function importJson(file){const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(x.schema!=='travelEngine.themePreview.v1'||!x.settings)throw Error();state={...frozen,...x.settings,preset:'custom'};save();apply();sync()}catch(e){alert('Invalid Theme Preview JSON.')}};r.readAsText(file)}
function val(id){const n=document.getElementById(id);return n&&n.type==='checkbox'?n.checked:n?.value}
function sync(){const map={tpBg:state.bg,tpCardOpacity:state.cardOpacity,tpTypography:state.typography};Object.entries(map).forEach(([id,x])=>{const n=document.getElementById(id);if(!n)return;if(n.type==='checkbox')n.checked=!!x;else n.value=x});document.querySelectorAll('[data-tp-value]').forEach(n=>{const k=n.dataset.tpValue;n.textContent=formatValue(k,state[k])});syncPickers();syncThemeCards()}
function syncThemeCards(){document.querySelectorAll('[data-theme-card]').forEach(card=>{const active=card.dataset.themeCard===state.preset;card.classList.toggle('is-active',active);const btn=card.querySelector('[data-apply-theme]');if(btn)btn.textContent=active?'Applied':'Apply'})}
function formatValue(key,value){if(key==='cardOpacity')return Math.round(Number(value)*100)+'%';return String(value)}
function key(id){return({tpBg:'bg',tpCardOpacity:'cardOpacity',tpTypography:'typography'})[id]}
function colour(label,id){return `<div class="theme-preview-field full"><label>${label}</label><div class="theme-preview-colour"><input id="${id}Picker" type="color" aria-label="${label} colour picker"><input id="${id}" type="text" maxlength="7" aria-label="${label} hex value"></div></div>`}
function range(label,id,k,min,max,step){return `<div class="theme-preview-field full"><label>${label}<span class="theme-preview-value" data-tp-value="${k}"></span></label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}"></div>`}
function themeCard(t){const p=presets[t.id];return `<div class="theme-card" data-theme-card="${t.id}"><div class="theme-card-swatch" style="background:${p.heroGradient||('linear-gradient(135deg,'+p.primary+','+p.accent+')')}"></div><div class="theme-card-copy"><strong>${t.icon} ${t.name}</strong><small>${t.tagline}</small></div><button class="theme-card-apply" data-apply-theme="${t.id}" type="button">Apply</button></div>`}
function controls(){return `<div class="theme-preview-notice">PREVIEW ONLY · LIVE ON THE REAL COMPANION</div>
<p class="theme-preview-section-label">Choose Theme</p>
<div class="theme-preview-list">${THEMES.map(themeCard).join('')}</div>
<details class="theme-preview-advanced"><summary>Advanced</summary><div class="theme-preview-advanced-body">
${colour('Background Colour','tpBg')}${range('Card opacity','tpCardOpacity','cardOpacity',.55,1,.01)}
<div class="theme-preview-field full"><label>Typography</label><select id="tpTypography"><option value="original">Original Engine</option><option value="editorial">Editorial Serif heading</option><option value="soft">Soft / rounded heading</option><option value="modern">Modern</option></select></div>
</div></details>
<button id="tpReset" class="theme-preview-reset" type="button">Reset Theme</button>`}
function build(){buildStudioLauncher();buildFloatingInspector();wire();sync();syncVisibility()}
function buildStudioLauncher(){const host=document.getElementById('tripStudioThemePreview');if(!host)return;if(host.dataset.themePreviewLauncher==='1'){syncLauncher();return}host.dataset.themePreviewLauncher='1';host.hidden=false;host.innerHTML=`<p class="trip-studio-label">🎨 THEME PREVIEW</p><div class="theme-preview-launch-card"><div><strong>Floating Theme Inspector</strong><small id="tpLauncherStatus">Closed · preview controls are not covering Studio.</small></div><div class="theme-preview-launch-actions"><button id="tpLaunchFloating" type="button">Open Inspector</button><button id="tpDisableFloating" class="secondary" type="button">Close Inspector</button></div></div>`;document.getElementById('tpLaunchFloating').addEventListener('click',()=>{setEnabled(true);setCollapsed(false);if(typeof root.closeTripStudioPanel==='function')root.closeTripStudioPanel();else document.querySelector('.trip-studio-close')?.click()});document.getElementById('tpDisableFloating').addEventListener('click',()=>setEnabled(false));syncLauncher()}
function syncLauncher(){const status=document.getElementById('tpLauncherStatus'),open=document.getElementById('tpLaunchFloating'),close=document.getElementById('tpDisableFloating');if(status)status.textContent=ui.enabled?(ui.collapsed?'Open · collapsed to the 🎨 button.':'Open · live controls are floating over the Companion.'):'Closed · preview controls are not covering Studio.';if(open)open.textContent=ui.enabled?'Show Inspector':'Open Inspector';if(close)close.disabled=!ui.enabled}
function buildFloatingInspector(){if(document.getElementById('themePreviewInspector'))return;const shell=document.createElement('aside');shell.id='themePreviewInspector';shell.className='theme-preview-inspector';shell.setAttribute('aria-label','Floating Theme Inspector');shell.innerHTML=`<button class="theme-preview-fab" id="tpFab" type="button" aria-label="Open Theme Inspector">🎨</button><div class="theme-preview-window"><header class="theme-preview-window-head" id="tpDragHandle"><div><strong>🎨 Theme</strong><small>PREVIEW ONLY</small></div><div class="theme-preview-head-actions"><button id="tpCollapse" type="button" aria-label="Collapse Theme Inspector">−</button><button id="tpCloseInspector" type="button" aria-label="Close Theme Inspector">×</button></div></header><div class="theme-preview-window-body">${controls()}</div></div>`;document.body.appendChild(shell);applyUi();document.getElementById('tpFab').addEventListener('click',()=>setCollapsed(false));document.getElementById('tpCollapse').addEventListener('click',()=>setCollapsed(true));document.getElementById('tpCloseInspector').addEventListener('click',()=>setEnabled(false));enableDrag(shell,document.getElementById('tpDragHandle'))}
function wire(){const fields=['tpBg','tpCardOpacity','tpTypography'];fields.forEach(id=>document.getElementById(id)?.addEventListener('input',()=>update({[key(id)]:val(id)})));document.getElementById('themePreviewInspector')?.addEventListener('click',e=>{const btn=e.target.closest('[data-apply-theme]');if(btn)setPreset(btn.dataset.applyTheme)});document.getElementById('tpReset')?.addEventListener('click',reset);wirePickers()}
function wirePickers(){['tpBg'].forEach(id=>{const text=document.getElementById(id),picker=document.getElementById(id+'Picker');if(!text||!picker)return;picker.oninput=()=>{text.value=picker.value;update({[key(id)]:picker.value})};text.addEventListener('change',()=>{if(/^#[0-9a-f]{6}$/i.test(text.value))update({[key(id)]:text.value});else sync()})})}
function syncPickers(){['tpBg'].forEach(id=>{const text=document.getElementById(id),picker=document.getElementById(id+'Picker');if(text&&picker&&/^#[0-9a-f]{6}$/i.test(text.value))picker.value=text.value})}
function setEnabled(enabled){ui.enabled=!!enabled;if(ui.enabled)ui.collapsed=false;saveUi();applyUi();syncVisibility();syncLauncher()}
function setCollapsed(collapsed){ui.collapsed=!!collapsed;saveUi();applyUi();syncLauncher()}
function applyUi(){const shell=document.getElementById('themePreviewInspector');if(!shell)return;shell.classList.toggle('is-collapsed',ui.collapsed);if(innerWidth>700&&Number.isFinite(ui.left)&&Number.isFinite(ui.top)){shell.style.left=Math.max(8,Math.min(innerWidth-shell.offsetWidth-8,ui.left))+'px';shell.style.top=Math.max(8,Math.min(innerHeight-shell.offsetHeight-8,ui.top))+'px';shell.style.right='auto';shell.style.bottom='auto'}else{shell.style.removeProperty('left');shell.style.removeProperty('top');shell.style.removeProperty('right');shell.style.removeProperty('bottom')}}
function syncVisibility(){const shell=document.getElementById('themePreviewInspector');if(shell)shell.hidden=!ui.enabled}
function enableDrag(shell,handle){let drag=null;handle.addEventListener('pointerdown',event=>{if(innerWidth<=700||event.target.closest('button'))return;const rect=shell.getBoundingClientRect();drag={x:event.clientX-rect.left,y:event.clientY-rect.top};handle.setPointerCapture(event.pointerId);shell.classList.add('is-dragging')});handle.addEventListener('pointermove',event=>{if(!drag)return;const left=Math.max(8,Math.min(innerWidth-shell.offsetWidth-8,event.clientX-drag.x));const top=Math.max(8,Math.min(innerHeight-shell.offsetHeight-8,event.clientY-drag.y));shell.style.left=left+'px';shell.style.top=top+'px';shell.style.right='auto';shell.style.bottom='auto';ui.left=left;ui.top=top});const stop=event=>{if(!drag)return;drag=null;shell.classList.remove('is-dragging');saveUi();try{handle.releasePointerCapture(event.pointerId)}catch(e){}};handle.addEventListener('pointerup',stop);handle.addEventListener('pointercancel',stop)}
document.addEventListener('DOMContentLoaded',()=>{apply();setTimeout(build,0);const observer=new MutationObserver(()=>{const host=document.getElementById('tripStudioThemePreview');if(host&&host.dataset.themePreviewLauncher!=='1')buildStudioLauncher();syncVisibility()});observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});addEventListener('resize',applyUi)});root.ThemePreviewStudio={apply,reset,setPreset,exportJson,importJson,open:()=>{setEnabled(true);setCollapsed(false)},close:()=>setEnabled(false),getState:()=>({...state}),themes:()=>THEMES.slice()};
})(globalThis);
