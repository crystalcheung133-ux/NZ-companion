/* Travel Engine Stage 7K-2B — Moments page module
   Canonical Moments capture, photo prototype, context, timeline, and
   shared latest-expense mini-card compatibility extracted from script.js.
   Existing global handler names and storage schemas are preserved. */

/* v3.2 P0 workflow fixes: append Moments, latest-first Expenses, save-and-stay expense tool */
(function(){
  let editingMomentId = null;
  let currentMomentPhoto = null;
  let currentMomentContext = null;
  let momentSelectorDay = '1';
  let momentEntryIsPlanned = false; /* Stage 5B-2B2: true only while the composer was opened via the "Planned activity" landing card */
  const prototypePhotoUrls = new Map();
  function readJson(key, fallback){try{return STORAGE.local.readJSON(key,fallback);}catch(e){return fallback;}}
  function writeJson(key, value){STORAGE.local.writeJSON(key,value);}
  function clearMomentPhoto(revoke=true){
    if(currentMomentPhoto?.url && revoke && ![...prototypePhotoUrls.values()].includes(currentMomentPhoto.url)){
      try{ URL.revokeObjectURL(currentMomentPhoto.url); }catch(e){}
    }
    currentMomentPhoto = null;
    const inputCamera=document.getElementById('momentsPhotoCamera');
    const inputLibrary=document.getElementById('momentsPhotoLibrary');
    if(inputCamera) inputCamera.value='';
    if(inputLibrary) inputLibrary.value='';
    renderMomentPhotoPreview();
  }
  function renderMomentPhotoPreview(){
    const preview=document.getElementById('momentsPhotoPreview');
    if(!preview) return;
    if(!currentMomentPhoto){
      preview.hidden=true;
      preview.innerHTML='';
      return;
    }
    const meta=currentMomentPhoto.meta||{};
    preview.hidden=false;
    preview.innerHTML=`<div class="photo-prototype-card">
      <img src="${currentMomentPhoto.url}" alt="Compressed moment preview"/>
      <div class="photo-prototype-copy"><strong>✨ Looking good!</strong><span>${meta.width||'?'} × ${meta.height||'?'} · ${FORMATTER.bytes(meta.bytes)}</span><small>${meta.originalBytes ? `Original ${FORMATTER.bytes(meta.originalBytes)} → ` : ''}Compressed preview · local prototype</small></div>
      <button type="button" class="photo-remove" onclick="removeMomentPhoto()" aria-label="Remove photo">×</button>
    </div>`;
  }
  function loadImageFromFile(file){
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(file);
      const img=new Image();
      img.onload=()=>{URL.revokeObjectURL(url);resolve(img);};
      img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not read this photo.'));};
      img.src=url;
    });
  }
  function canvasToBlob(canvas,type,quality){
    return new Promise(resolve=>canvas.toBlob(resolve,type,quality));
  }
  async function compressMomentPhoto(file){
    if(!file || !file.type.startsWith('image/')) throw new Error('Please choose a photo.');
    const img=await loadImageFromFile(file);
    const maxEdge=1600;
    const scale=Math.min(1,maxEdge/Math.max(img.naturalWidth,img.naturalHeight));
    const width=Math.max(1,Math.round(img.naturalWidth*scale));
    const height=Math.max(1,Math.round(img.naturalHeight*scale));
    const canvas=document.createElement('canvas');
    canvas.width=width; canvas.height=height;
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,width,height);
    ctx.drawImage(img,0,0,width,height);
    /* RC10F: always encode Moment photos as JPEG. Mobile browsers can produce
       WebP blobs inconsistently inside installed PWAs; JPEG is the stable
       cross-device upload format and is allowed by the Supabase bucket. */
    const type='image/jpeg';
    let blob=await canvasToBlob(canvas,type,.82);
    for(const q of [.74,.66,.58]){
      if(blob && blob.size<=500*1024) break;
      const next=await canvasToBlob(canvas,type,q);
      if(next) blob=next;
    }
    if(!blob) throw new Error('Photo compression failed. Please try another photo.');
    return {blob,url:URL.createObjectURL(blob),meta:{name:file.name||'camera-photo',bytes:blob.size,width,height,type:blob.type,originalBytes:file.size||0}};
  }
  async function handleMomentPhotoFile(file){
    const zone=document.querySelector('#momentsModal .photo-capture-zone');
    if(zone) zone.classList.add('is-processing');
    try{
      const processed=await compressMomentPhoto(file);
      clearMomentPhoto(true);
      currentMomentPhoto=processed;
      renderMomentPhotoPreview();
    }catch(err){
      alert(err?.message||'Unable to prepare this photo.');
    }finally{
      if(zone) zone.classList.remove('is-processing');
      queueAppNavSync();
    }
  }
  function stabiliseAppNavAfterViewportChange(){
    const nav=document.querySelector('.app-nav');
    if(!nav) return;
    nav.classList.add('app-nav--layout-sync');
    void nav.offsetHeight;
    requestAnimationFrame(()=>requestAnimationFrame(()=>nav.classList.remove('app-nav--layout-sync')));
  }
  let appNavSyncTimer=0;
  function queueAppNavSync(){
    clearTimeout(appNavSyncTimer);
    appNavSyncTimer=setTimeout(stabiliseAppNavAfterViewportChange,80);
  }
  window.addEventListener('focus',queueAppNavSync);
  window.addEventListener('pageshow',queueAppNavSync);
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize',queueAppNavSync);
    window.visualViewport.addEventListener('scroll',queueAppNavSync);
  }
  window.removeMomentPhoto=function(){ clearMomentPhoto(true); };
  function normaliseDayId(value){
    if(value == null) return null;
    const raw=String(value);
    if(/^day(?:10|[1-9])$/.test(raw)) return raw;
    if(/^(?:10|[1-9])$/.test(raw)) return 'day'+raw;
    return null;
  }
  function dayNumberFromId(dayId){
    const match=String(dayId||'').match(/day(10|[1-9])/);
    return match ? match[1] : null;
  }
  function currentDayItems(dayNumber){
    const key=String(dayNumber);
    const master=((typeof ITINERARY_DATA!=='undefined'&&ITINERARY_DATA)||{})[key];
    if(window.ITINERARY_AUTHORITY&&typeof ITINERARY_AUTHORITY.resolveDayItems==='function'){
      return ITINERARY_AUTHORITY.resolveDayItems(key,master?.items||[]);
    }
    return (master?.items||[]).map(item=>({...item}));
  }
  function itineraryItems(){
    const out=[];
    Object.entries((typeof ITINERARY_DATA!=='undefined'&&ITINERARY_DATA)||{}).forEach(([dayNumber])=>{
      currentDayItems(dayNumber).forEach(item=>out.push({...item,_dayNumber:String(dayNumber),dayId:normaliseDayId(item.dayId)||('day'+dayNumber)}));
    });
    return out;
  }
  function stripMomentTitle(title){
    return String(title||'Moment').replace(/^[^\p{L}\p{N}]+/u,'').trim() || 'Moment';
  }
  function guideCandidates(placeKey){
    const links=(typeof DAY_LINKS!=='undefined'&&DAY_LINKS[placeKey])||[];
    return links.map(link=>{
      const href=Array.isArray(link)?link[1]:'';
      const dayMatch=String(href||'').match(/[?&]day=(10|[1-9])/);
      const idMatch=String(href||'').match(/#([^#?&]+)/);
      if(!dayMatch||!idMatch) return null;
      const item=itineraryItems().find(x=>x._dayNumber===dayMatch[1]&&x.id===decodeURIComponent(idMatch[1]));
      return item||null;
    }).filter(Boolean);
  }
  function momentEntrySource(){
    const guideModalOpen=document.getElementById('guideModal')?.classList.contains('show');
    if(guideModalOpen || NAVIGATION.isPage('guide') || NAVIGATION.isPage('place') || document.getElementById('placeMain')) return 'guide';
    if(NAVIGATION.isPage('day')) return 'days';
    return 'unknown';
  }
  function resolveMomentContext(key, sourceHint){
    const raw=key||'general';
    if(raw==='general') return {contextType:'custom',placeKey:null,activityId:null,dayId:null,displayTitleSnapshot:'Just this moment'};
    const source=sourceHint||momentEntrySource();
    if(source==='guide' && typeof PLACES!=='undefined' && PLACES[raw]){
      const candidates=guideCandidates(raw);
      const unique=new Map(candidates.map(x=>[x.dayId+'|'+x.id,x]));
      const only=unique.size===1?[...unique.values()][0]:null;
      return {contextType:'guide',placeKey:raw,activityId:only?.id||null,dayId:only?.dayId||null,displayTitleSnapshot:PLACES[raw].title||'Moment'};
    }
    const item=itineraryItems().find(x=>x.id===raw);
    if(item){
      return {contextType:'days',placeKey:item.placeId||null,activityId:item.id,dayId:item.dayId,displayTitleSnapshot:stripMomentTitle(item.title)};
    }
    if(typeof PLACES!=='undefined'&&PLACES[raw]){
      const candidates=guideCandidates(raw);
      const unique=new Map(candidates.map(x=>[x.dayId+'|'+x.id,x]));
      const only=unique.size===1?[...unique.values()][0]:null;
      return {contextType:'guide',placeKey:raw,activityId:only?.id||null,dayId:only?.dayId||null,displayTitleSnapshot:PLACES[raw].title||'Moment'};
    }
    return {contextType:'custom',placeKey:null,activityId:null,dayId:null,displayTitleSnapshot:'Just this moment'};
  }
  function plannedMomentContext(dayNumber,item){
    return {contextType:'planned-activity',placeKey:item.placeId||null,activityId:item.id,dayId:normaliseDayId(item.dayId)||('day'+dayNumber),displayTitleSnapshot:stripMomentTitle(item.title)};
  }
  function suggestedMomentDay(){
    return String(tripDayNumber());
  }
  function renderMomentContextSummary(){
    const box=document.getElementById('momentContextSummary');
    if(!box) return;
    const c=currentMomentContext||resolveMomentContext('general');
    if(c.contextType==='custom'){
      box.hidden=true;
      box.innerHTML='';
      box.closest('.moment-context-panel')?.classList.add('is-custom');
    } else {
      box.hidden=false;
      box.closest('.moment-context-panel')?.classList.remove('is-custom');
      box.innerHTML=`<span class="moment-context-dot">✓</span><span><strong>${c.displayTitleSnapshot}</strong><small>${c.dayId ? `Day ${dayNumberFromId(c.dayId)} · ` : ''}${c.contextType==='guide'?'From Guide':'Planned activity'}</small></span>`;
    }
  }
  function renderPlannedActivityPicker(){
    const host=document.getElementById('momentPlannedPicker');
    if(!host) return;
    const chips=currentDayItems(momentSelectorDay).map(item=>`<button type="button" class="moment-activity-chip" onclick="chooseMomentActivity('${momentSelectorDay}','${String(item.id).replace(/'/g,"\'")}')"><span>${stripMomentTitle(item.title)}</span><small>${item.time||''}</small></button>`).join('');
    /* Stage 5B-2B2: the "Just this moment" chip is redundant when the composer was entered via the
       Planned activity card — returning to free capture is done by closing the composer and choosing
       the other card instead. Only render the chip for the general-entry "+Add planned activity" path. */
    const customChoiceHTML=momentEntryIsPlanned ? '' : `<button type="button" class="moment-custom-choice" onclick="clearMomentActivity()">✨ Just this moment</button>`;
    host.innerHTML=`${customChoiceHTML}<div class="moment-day-tabs">${Object.keys((typeof ITINERARY_DATA!=='undefined'&&ITINERARY_DATA)||{}).sort((a,b)=>Number(a)-Number(b)).map(n=>`<button type="button" class="moment-day-tab ${n===momentSelectorDay?'active':''}" onclick="setMomentSelectorDay('${n}')">Day ${n}</button>`).join('')}</div><div class="moment-activity-grid">${chips}</div>`;
  }
  function ensureMomentContextUI(){
    const form=document.querySelector('#momentsModal .moments-form');
    if(!form||form.querySelector('.moment-context-panel')) return;
    const panel=document.createElement('div');
    panel.className='moment-context-panel';
    panel.innerHTML=`<div id="momentContextSummary" class="moment-context-summary"></div><button type="button" id="momentPlannedToggle" class="moment-planned-toggle" onclick="toggleMomentPlannedPicker()">＋ Add planned activity</button><div id="momentPlannedPicker" class="moment-planned-picker" hidden></div>`;
    form.insertBefore(panel,form.firstChild);
  }
  window.toggleMomentPlannedPicker=function(){
    const picker=document.getElementById('momentPlannedPicker');
    const toggle=document.getElementById('momentPlannedToggle');
    if(!picker) return;
    picker.hidden=!picker.hidden;
    if(!picker.hidden){ renderPlannedActivityPicker(); if(toggle) toggle.textContent='− Hide planned activities'; }
    else if(toggle) toggle.textContent=currentMomentContext?.contextType==='custom'?'＋ Add planned activity':'Change planned activity';
  };
  window.openPlannedMomentCapture=function(){
    window.openMomentsModal('general');
    momentEntryIsPlanned=true;
    momentSelectorDay=suggestedMomentDay();
    const picker=document.getElementById('momentPlannedPicker');
    const toggle=document.getElementById('momentPlannedToggle');
    if(picker){
      picker.hidden=false;
      renderPlannedActivityPicker();
    }
    if(toggle) toggle.textContent='− Hide planned activities';
  };
  window.setMomentSelectorDay=function(dayNumber){ momentSelectorDay=String(dayNumber); renderPlannedActivityPicker(); };
  window.chooseMomentActivity=function(dayNumber,activityId){
    const item=currentDayItems(dayNumber).find(x=>x.id===activityId);
    if(!item) return;
    currentMomentKey=item.id;
    currentMomentContext=plannedMomentContext(String(dayNumber),item);
    const title=document.getElementById('momentsTitle');
    if(title) title.textContent=currentMomentContext.displayTitleSnapshot;
    renderMomentContextSummary();
    const picker=document.getElementById('momentPlannedPicker');
    const toggle=document.getElementById('momentPlannedToggle');
    if(picker) picker.hidden=true;
    if(toggle) toggle.textContent='Change planned activity';
  };
  window.clearMomentActivity=function(){
    currentMomentKey='general';
    currentMomentContext=resolveMomentContext('general');
    const title=document.getElementById('momentsTitle'); if(title) title.textContent='Just this moment';
    renderMomentContextSummary();
    const picker=document.getElementById('momentPlannedPicker'); if(picker) picker.hidden=true;
    const toggle=document.getElementById('momentPlannedToggle'); if(toggle) toggle.textContent='＋ Add planned activity';
  };
  function enhanceMomentPhotoInput(){
    document.querySelectorAll('#momentsModal .photo-input').forEach(host=>{
      if(host.dataset.photoEnhanced==='true') return;
      host.dataset.photoEnhanced='true';
      host.classList.add('photo-capture-zone');
      host.innerHTML=`<div class="photo-capture-heading"><span class="photo-capture-spark">📸</span><span><strong>Add a happy snap</strong><small>We compress it before anything is saved.</small></span></div>
        <div class="photo-capture-actions">
          <label class="photo-capture-btn photo-capture-btn--camera">📷 Take Photo<input id="momentsPhotoCamera" type="file" accept="image/*" capture="environment" hidden></label>
          <label class="photo-capture-btn">🖼 Choose Photo<input id="momentsPhotoLibrary" type="file" accept="image/*" hidden></label>
        </div>
        <div id="momentsPhotoPreview" class="photo-prototype-preview" hidden></div>`;
      host.querySelectorAll('input[type=file]').forEach(input=>input.addEventListener('change',e=>{
        const file=e.target.files?.[0]; if(file) handleMomentPhotoFile(file);
      }));
    });
  }
  window.openMomentsModal = function(key){
    editingMomentId = null;
    momentEntryIsPlanned = false; /* Stage 5B-2B2: only openPlannedMomentCapture re-enables planned-entry mode, right after this call */
    currentMomentKey = key || 'general';
    currentMomentContext = resolveMomentContext(currentMomentKey);
    momentSelectorDay = dayNumberFromId(currentMomentContext.dayId) || suggestedMomentDay();
    const g = PLACES[currentMomentContext.placeKey||currentMomentKey] || PLACES.general || {title:'Moment'};
    const title = document.getElementById('momentsTitle');
    const friend = document.getElementById('momentsFriend');
    const text = document.getElementById('momentsText');
    if(title) title.textContent = currentMomentContext.displayTitleSnapshot || g.title || 'Moment';
    if(friend) friend.textContent = FRIENDS[getFriend()];
    if(text) text.value = '';
    ensureMomentContextUI();
    renderMomentContextSummary();
    const picker=document.getElementById('momentPlannedPicker'); if(picker) picker.hidden=true;
    const toggle=document.getElementById('momentPlannedToggle'); if(toggle) toggle.textContent=currentMomentContext.contextType==='custom'?'＋ Add planned activity':'Change planned activity';
    clearMomentPhoto(true);
    setStars(0);
    renderMoodButtons([]);
    const save=document.querySelector('#momentsModal .moments-form .btn');
    if(save) save.textContent='Save';
    const modal=document.getElementById('momentsModal');
    if(modal) modal.classList.add('show');
    try{ if(typeof window.simplifyMomentsAuthor === 'function') window.simplifyMomentsAuthor(); }catch(e){}
  };
  window.saveMoments = async function(){
    const key = currentMomentKey || 'general';
    const g = PLACES[key] || PLACES.general || {title:'Moment'};
    const textEl=document.getElementById('momentsText');
    const ratingEl=document.getElementById('momentsRating');
    const now=new Date().toISOString();
    let arr=readJson(STORAGE_CONFIG.keys.momentsList,[]);
    let entry={
      id:editingMomentId || ('m_'+Date.now()+'_'+Math.random().toString(36).slice(2,7)),
      itemKey:key,
      itemTitle:currentMomentContext?.displayTitleSnapshot || g.title || 'Moment',
      context:{...(currentMomentContext||resolveMomentContext(key))},
      friendLabel:FRIENDS[getFriend()],
      rating:Number(ratingEl?.value||0),
      moods:(currentMood||[]).slice(),
      text:textEl?.value||'',
      photoPrototype:currentMomentPhoto ? {...currentMomentPhoto.meta, retained:false} : null,
      createdAt:now,
      updatedAt:now,
      createdBy:(typeof getFriend==='function'?getFriend():'lee'),
      editedBy:(typeof getFriend==='function'?getFriend():'lee')
    };
    if(editingMomentId){
      const existing=arr.find(e=>e.id===editingMomentId);
      if(!currentMomentPhoto && existing?.photoPrototype) entry.photoPrototype=existing.photoPrototype;
      arr=arr.map(e=> e.id===editingMomentId ? {...e,...entry,createdAt:e.createdAt||now,createdBy:e.createdBy||entry.createdBy,editedAt:now,updatedAt:now,editedBy:(typeof getFriend==='function'?getFriend():'lee')} : e);
    }else{
      arr.push(entry);
    }
    if(currentMomentPhoto?.url) prototypePhotoUrls.set(entry.id,currentMomentPhoto.url);
    if(currentMomentPhoto?.blob && window.MOMENT_SYNC){
      const photoState=await window.MOMENT_SYNC.stagePhoto(entry.id,currentMomentPhoto.blob);
      entry={...entry,...(photoState||{}),updatedAt:new Date().toISOString()};
      arr=arr.map(e=>e.id===entry.id?{...e,...entry}:e);
    }
    writeJson(STORAGE_CONFIG.keys.momentsList,arr);
    window.MOMENT_SYNC?.queueSync();
    STORAGE.local.writeJSON(STORAGE_CONFIG.keys.latestMomentPrefix+key,entry);
    editingMomentId=null;
    if(textEl) textEl.value='';
    currentMomentPhoto=null;
    renderMomentPhotoPreview();
    setStars(0); renderMoodButtons([]);
    const save=document.querySelector('#momentsModal .moments-form .btn');
    if(save) save.textContent='Save';
    closeMomentsModal(); renderMoments();
  };
  window.editMoment = function(id){
    const arr=readJson(STORAGE_CONFIG.keys.momentsList,[]);
    const e=arr.find(x=>x.id===id);
    if(!e) return;
    editingMomentId=id;
    momentEntryIsPlanned = false; /* Stage 5B-2B2: editing an existing moment always keeps the full planned-activity picker */
    currentMomentKey=e.itemKey || 'general';
    currentMomentContext=e.context ? {...e.context} : resolveMomentContext(currentMomentKey);
    momentSelectorDay=dayNumberFromId(currentMomentContext.dayId)||suggestedMomentDay();
    ensureMomentContextUI();
    renderMomentContextSummary();
    const picker=document.getElementById('momentPlannedPicker'); if(picker) picker.hidden=true;
    const toggle=document.getElementById('momentPlannedToggle'); if(toggle) toggle.textContent=currentMomentContext.contextType==='custom'?'＋ Add planned activity':'Change planned activity';
    const title=document.getElementById('momentsTitle');
    const friend=document.getElementById('momentsFriend');
    const text=document.getElementById('momentsText');
    if(title) title.textContent=e.context?.displayTitleSnapshot || e.itemTitle || 'Moment';
    if(friend) friend.textContent=e.friendLabel || FRIENDS[getFriend()];
    if(text) text.value=e.text || '';
    clearMomentPhoto(true);
    const rememberedUrl=prototypePhotoUrls.get(e.id);
    if(rememberedUrl && e.photoPrototype){
      currentMomentPhoto={url:rememberedUrl,meta:e.photoPrototype};
      renderMomentPhotoPreview();
    }
    setStars(e.rating||0);
    renderMoodButtons(e.moods||[]);
    const save=document.querySelector('#momentsModal .moments-form .btn');
    if(save) save.textContent='Save Changes';
    const modal=document.getElementById('momentsModal');
    if(modal) modal.classList.add('show');
    try{ if(typeof window.simplifyMomentsAuthor === 'function') window.simplifyMomentsAuthor(); }catch(e){}
  };
  window.deleteMoment = function(idOrKey){
    let arr=readJson(STORAGE_CONFIG.keys.momentsList,[]);
    const before=arr.length;
    const deleting=arr.find(e=>e.id===idOrKey);
    window.MOMENT_SYNC?.markDeleted(deleting);
    arr=arr.filter(e=>e.id!==idOrKey);
    writeJson(STORAGE_CONFIG.keys.momentsList,arr);
    if(before===arr.length && idOrKey && !idOrKey.startsWith('m_')) STORAGE.local.remove(STORAGE_CONFIG.keys.momentPrefix+idOrKey);
    const photoUrl=prototypePhotoUrls.get(idOrKey);
    if(photoUrl){try{URL.revokeObjectURL(photoUrl);}catch(e){} prototypePhotoUrls.delete(idOrKey);}
    window.MOMENT_SYNC?.queueSync();
    renderMoments();
  };
  window.renderMoments = function(){
    const box=document.getElementById('momentsTimeline'); if(!box) return;
    let arr=readJson(STORAGE_CONFIG.keys.momentsList,[]);
    // Include legacy one-per-place moments once so older saved data still appears.
    for(const k of STORAGE.local.keys()){
      if(k && k.startsWith(STORAGE_CONFIG.keys.momentPrefix) && !k.startsWith(STORAGE_CONFIG.keys.latestMomentPrefix)){
        try{
          const e=STORAGE.local.readJSON(k,null);
          if(e && !arr.some(x=>x.id===e.id || (x.createdAt===e.createdAt && x.itemKey===e.itemKey && x.text===e.text))){
            arr.push({...e,id:e.id||('legacy_'+k.replace(STORAGE_CONFIG.keys.momentPrefix,''))});
          }
        }catch(err){}
      }
    }
    arr.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    if(!arr.length){box.innerHTML='<p>No Moments yet.</p>';return;}
    box.innerHTML=arr.map(e=>`<div class="moments-entry">
      <strong>${escapeHTML(e.itemTitle||'Moment')}</strong>
      <p class="timestamp">${escapeHTML(e.friendLabel||'')} · ${formatTime(e.createdAt)}${e.editedAt?` · Edited ${formatTime(e.editedAt)}`:''}</p>
      ${(e.photoUrl||prototypePhotoUrls.get(e.id)) ? `<img class="moment-prototype-photo" src="${escapeHTML(e.photoUrl||prototypePhotoUrls.get(e.id))}" alt="Moment photo">` : (e.photoPending?`<p class="moment-photo-note">📸 Photo saved offline · waiting to sync</p>`:(e.photoPrototype?`<p class="moment-photo-note">📸 Photo preview unavailable on this device</p>`:''))}
      <p class="moment-mood">${moodLabel(e.moods||[])}</p>
      <p class="moment-stars">${'⭐'.repeat(e.rating||0)}</p>
      <p class="moment-copy">${escapeHTML(e.text||'')}</p>
      <div class="entry-actions"><button class="mini-btn" onclick="editMoment('${e.id||e.itemKey}')">✏️ Edit</button><button class="mini-btn" onclick="deleteMoment('${e.id||e.itemKey}')">🗑 Delete</button></div>
    </div>`).join('');
  };
  /* Stage 4C-6: removed legacy v3.2 window.saveExpense; canonical handler is later in this file. */

  /* Stage 4C-6: removed legacy v3.2 window.renderExpenses; canonical handler is later in this file. */

  document.addEventListener('DOMContentLoaded',()=>{enhanceMomentPhotoInput();renderMoodButtons([]);renderMoments();renderExpenses();window.MOMENT_SYNC?.queueSync(150);document.addEventListener(window.MOMENT_SYNC?.EVENTS?.changed||'travelengine:momentsyncchanged',()=>renderMoments());});
})();
