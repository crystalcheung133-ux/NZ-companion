/* party-render-runtime.js — Engine-owned participant control renderer. */
(function(root){
  'use strict';
  function ready(fn){
    if(typeof document==='undefined') return;
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn,{once:true}); else fn();
  }
  function config(){
    const p=root.TRIP_CONFIG&&root.TRIP_CONFIG.participants;
    if(!p||!Array.isArray(p.order)||!p.order.length) throw new Error('TRIP_CONFIG.participants is required');
    return p;
  }
  function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function label(p,key){const id=(p.identities||{})[key]||{};return `${id.code||String(key).slice(0,3).toUpperCase()} · ${id.name||key}`;}
  function fillSelect(select,p){
    if(!select) return;
    const previous=select.value;
    select.innerHTML=p.order.map(key=>`<option value="${esc(key)}">${esc(label(p,key))}</option>`).join('');
    select.value=p.order.includes(previous)?previous:(p.defaultKey||p.order[0]);
  }
  function fillSplit(container,p){
    if(!container) return;
    const onchange=container.dataset.splitOnchange||'';
    container.innerHTML=p.order.map(key=>`<label><input checked data-split type="checkbox" value="${esc(key)}"${onchange?` onchange="${esc(onchange)}"`:''}/><span>${esc(label(p,key))}</span></label>`).join('');
  }
  function run(){
    const p=config();
    ['expensePaidBy','expenseConsumedBy','expensePersonalPaidBy'].forEach(id=>fillSelect(document.getElementById(id),p));
    document.querySelectorAll('[data-party-select]').forEach(el=>fillSelect(el,p));
    document.querySelectorAll('[data-party-split-list]').forEach(el=>fillSplit(el,p));
    if(typeof root.renderFriendChoices==='function') root.renderFriendChoices();
    if(typeof root.updateFriendLabels==='function') root.updateFriendLabels();
  }
  ready(run);
  root.__partyRenderRuntimeRun=run;
})(globalThis);
