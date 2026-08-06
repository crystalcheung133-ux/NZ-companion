/* party-render-runtime.js — config-owned party control renderer. */
(function(root){
  'use strict';
  function ready(fn){ if(typeof document==='undefined')return; if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn); else fn(); }
  function esc(v){ return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function model(){
    const p=root.TRIP_CONFIG&&root.TRIP_CONFIG.participants;
    if(!p||!Array.isArray(p.order)||!p.order.length)return null;
    return {order:p.order.slice(),identities:p.identities||{},defaultKey:p.order.indexOf(p.defaultKey)>=0?p.defaultKey:p.order[0]};
  }
  function ident(m,key){ const x=m.identities[key]||{}; return {code:x.code||String(key).slice(0,3).toUpperCase(),name:x.name||key}; }
  function label(m,key){ const x=ident(m,key); return x.code+' · '+x.name; }
  function valid(m,key){ return m.order.indexOf(key)>=0?key:m.defaultKey; }
  function optionHtml(m,key,selected){ return '<option value="'+esc(key)+'"'+(key===selected?' selected':'')+'>'+esc(label(m,key))+'</option>'; }
  function renderPartySelect(el,m){
    const selected=valid(m,el.value||m.defaultKey);
    el.innerHTML=m.order.map(function(key){return optionHtml(m,key,selected);}).join('');
  }
  function renderFriends(m){
    const list=document.querySelector('#mamaModal .friend-choice-list'); if(!list)return;
    const current=typeof root.getFriend==='function'?valid(m,root.getFriend()):m.defaultKey;
    list.innerHTML=m.order.map(function(key){
      const x=ident(m,key);
      return '<button type="button" class="family-choice'+(key===current?' active':'')+'" data-family="'+esc(key)+'" onclick="setFriend(\''+esc(key)+'\')"><span class="family-identity family-'+esc(key)+'"><span class="family-code">'+esc(x.code)+'</span><span class="family-name">'+esc(x.name)+'</span></span></button>';
    }).join('');
  }
  function splitOptionHtml(m,key,picker){
    return '<label><input checked data-split type="checkbox" value="'+esc(key)+'"'+(picker?' onchange="updateSplitUI()"':'')+'/>'+(picker?'<span>'+esc(label(m,key))+'</span>':esc(label(m,key)))+'</label>';
  }
  function renderSplitOptions(holder,m){
    const picker=holder.id==='splitPickerMenu'||holder.classList.contains('split-picker-menu');
    holder.innerHTML=m.order.map(function(key){return splitOptionHtml(m,key,picker);}).join(picker?'':'<br/>');
  }
  function run(){
    const m=model(); if(!m)return;
    document.querySelectorAll('select[data-party-options]').forEach(function(el){renderPartySelect(el,m);});
    document.querySelectorAll('[data-party-split-options]').forEach(function(holder){renderSplitOptions(holder,m);});
    renderFriends(m);
    if(typeof root.updateFriendLabels==='function')root.updateFriendLabels();
    if(typeof root.updateSplitUI==='function'&&document.getElementById('splitPickerSummary'))root.updateSplitUI();
  }
  ready(run); root.__partyRenderRuntimeRun=run;
})(globalThis);
