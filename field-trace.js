(function(root){
'use strict';
const MAX=120; const rows=[]; const now=()=>Math.round(performance.now());
function slimEl(el){if(!el)return null;return {tag:el.tagName||'',id:el.id||'',cls:String(el.className||''),text:String(el.textContent||'').trim().slice(0,40)};}
function menus(){const out={};['tripMenu','guideMenu','daysMenu'].forEach(id=>{const e=document.getElementById(id);out[id]=e?{cls:e.className,children:e.children.length}:null;});return out;}
function push(type,extra){rows.push(Object.assign({t:now(),type},extra||{}));if(rows.length>MAX)rows.shift();try{localStorage.setItem('nz_field_trace3',JSON.stringify(rows));}catch(e){}}
function show(target){
 const old=document.getElementById('nzTrace3Panel'); if(old)old.remove();
 const p=document.createElement('pre');p.id='nzTrace3Panel';
 p.style.cssText='position:fixed;z-index:2147483647;left:6px;right:6px;top:6px;max-height:82vh;overflow:auto;margin:0;padding:10px;border:3px solid #7b2;background:#fffbd8;color:#211;font:11px/1.28 monospace;white-space:pre-wrap;text-align:left;';
 const relevant=rows.slice(-40);p.textContent='NZ TRACE3 — screenshot/copy this\nTARGET '+target+'\n'+JSON.stringify({final:menus(),body:document.body.className,rows:relevant},null,2);document.body.appendChild(p);
}
function navTarget(el){const b=el&&el.closest&&el.closest('.trip-trigger,.guide-trigger,.days-trigger');if(!b)return null;return b.classList.contains('trip-trigger')?'trip':b.classList.contains('guide-trigger')?'guide':'days';}
['pointerdown','touchstart','click'].forEach(type=>document.addEventListener(type,e=>{const target=navTarget(e.target);if(target)push(type+'-capture',{target,phase:e.eventPhase,hit:slimEl(e.target),menus:menus()});},true));
document.addEventListener('click',e=>{const target=navTarget(e.target);if(!target)return;push('click-bubble',{target,phase:e.eventPhase,menus:menus()});setTimeout(()=>{push('final-250ms',{target,menus:menus()});show(target);},250);},false);
function install(){
 [['toggleTripMenu','trip'],['toggleGuideMenu','guide'],['toggleDays','days']].forEach(([name,target])=>{
  const fn=root[name];if(typeof fn!=='function'||fn.__trace3)return;
  function wrapped(){push(name+'-ENTER',{target,menus:menus()});let result;try{result=fn.apply(this,arguments);push(name+'-EXIT',{target,result:String(result),menus:menus()});return result;}catch(err){push(name+'-THROW',{target,name:err&&err.name,message:err&&err.message,menus:menus()});throw err;}}
  wrapped.__trace3=true;wrapped.__trace3Original=fn;root[name]=wrapped;
 });
 ['tripMenu','guideMenu','daysMenu'].forEach(id=>{const el=document.getElementById(id);if(!el||el.__trace3)return;el.__trace3=true;new MutationObserver(ms=>{for(const m of ms)if(m.attributeName==='class')push('class-mutation',{id,cls:el.className});}).observe(el,{attributes:true,attributeFilter:['class']});});
 push('installed',{menus:menus(),ready:document.readyState});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install();setTimeout(install,50);},{once:true});else {install();setTimeout(install,50);}
const badge=document.createElement('div');badge.textContent='TRACE3';badge.style.cssText='position:fixed;right:4px;top:4px;z-index:2147483646;background:#111;color:#fff;padding:3px 6px;border-radius:5px;font:700 10px sans-serif;pointer-events:none';(document.body||document.documentElement).appendChild(badge);
root.NZ_FIELD_TRACE3={rows,show,install};
})(globalThis);
