/* Travel Engine v1.0 — Stage 7M modular runtime. */
let currentMomentKey='';
function closeMomentsModal(){$('momentsModal').classList.remove('show')}
function setStars(n){document.querySelectorAll('.star').forEach((el,i)=>el.classList.toggle('active',i<n));$('momentsRating').value=n;}

/* Stage 4C-4: legacy one-per-place Moments functions were removed.
   The active Moments API is the append/edit/delete implementation below
   (moments_list + legacy localStorage compatibility inside renderMoments).
   These vars keep global onclick/bare calls stable until the canonical API assigns
   window.openMomentsModal / window.saveMoments / window.editMoment /
   window.deleteMoment / window.renderMoments later in this file. */
var openMomentsModal, saveMoments, editMoment, deleteMoment, renderMoments;

function openUnexpectedModal(){$('unexpectedFriend').textContent=FRIENDS[getFriend()];$('unexpectedText').value='';$('unexpectedModal').classList.add('show')}
function closeUnexpectedModal(){$('unexpectedModal').classList.remove('show')}
function saveUnexpected(){const arr=STORAGE.local.readJSON(STORAGE_CONFIG.keys.momentsFreeform,[]);arr.push({page:document.title.replace(' · '+TRIP_CONFIG.tripName,''),friendLabel:FRIENDS[getFriend()],text:$('unexpectedText').value,savedAt:new Date().toISOString()});STORAGE.local.writeJSON(STORAGE_CONFIG.keys.momentsFreeform,arr);closeUnexpectedModal();renderUnexpected();}
function renderUnexpected(){const box=$('unexpectedTimeline');if(!box)return;let arr=[];try{arr=STORAGE.local.readJSON(STORAGE_CONFIG.keys.momentsFreeform,[]);if(!Array.isArray(arr))arr=[];}catch(e){arr=[];}box.innerHTML=arr.length?arr.map(e=>`<div class="moments-entry"><strong>✨ ${escapeHTML(e.page)}</strong><p>${escapeHTML(e.friendLabel)}</p><p>${escapeHTML(e.text)}</p></div>`).join(''):'<p>No Moments yet.</p>'}


const MOODS=[
  ["🤩","Wow"],["😋","Delicious"],["😵","Exhausted"],["🔥","Amazing"],
  ["🤯","Unexpected"],["😶","Speechless"],["🥲","Oh no"],["🤬","Damn"]
];
let currentMood=[];

function renderMoodButtons(selected=[]){
  currentMood = selected || [];
  const box=document.getElementById('moodGrid');
  if(!box) return;
  box.innerHTML=MOODS.map(([emoji,label])=>{
    const on=currentMood.includes(label);
    return `<button type="button" class="mood-btn ${on?'active':''}" aria-pressed="${on?'true':'false'}" onclick="toggleMood('${label}')">${emoji} ${label}</button>`;
  }).join('');
}
function toggleMood(label){
  if(currentMood.includes(label)){
    currentMood=currentMood.filter(x=>x!==label);
  }else{
    if(currentMood.length>=2) currentMood.shift();
    currentMood.push(label);
  }
  renderMoodButtons(currentMood);
}
function moodLabel(labels=[]){
  return labels.map(l=>{
    const m=MOODS.find(x=>x[1]===l);
    return m?m[0]+' '+m[1]:l;
  }).join(' · ');
}
function formatTime(iso){
  if(!iso) return '';
  try{
    return FORMATTER.dateTime(new Date(iso));
  }catch(e){return iso}
}


/* v3.5 guard: bottom bar is summary navigation; buttons on summary pages open tools */
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.summary-link-row').forEach(x=>x.remove());
  try{ renderExpenses(); renderMoments(); }catch(e){}
});

/* v3.6 production polish: non-overriding expense copy polish only.
   Stage 4C-6 removed the old open/save wrappers from this block. */
(function(){
  function polishExpenseCopy(){
    document.querySelectorAll('button,a').forEach(el=>{
      if((el.textContent||'').includes('Add Expense') || (el.textContent||'').includes('Split Bill')){
        el.textContent='💸 What did we spend?';
      }
    });
    const title=document.getElementById('expenseModalTitle'); if(title) title.textContent='💸 What did we spend?';
    const intro=document.getElementById('expenseIntro'); if(intro) intro.textContent='Record each shared or personal expense. Personal Spend and Settlement update automatically.';
    const save=document.getElementById('expenseSaveButton'); if(save) save.textContent='Save';
  }
  document.addEventListener('DOMContentLoaded',polishExpenseCopy);
  window.polishExpenseCopy = polishExpenseCopy;
})();

/* Stage 4C-6: removed legacy v3.7 Expenses save/open wrappers. */

/* Stage 4F-A: removed stale legacy dayN.html swipe handler. Active day route is day.html?day=N. */

/* v3.9.6c Final UX Hotfix: current-user Moments author label.
   Stage 4C-6 removed the expense open/save/edit wrappers from this block;
   Expense current-user defaults are handled by the Stage 4F-Q module. */
(function(){
  const DEFAULT_FRIEND = 'lee';
  function currentUser(){
    try { return (typeof getFriend === 'function' ? getFriend() : STORAGE.local.get(STORAGE_CONFIG.keys.friend)) || DEFAULT_FRIEND; }
    catch(e){ return DEFAULT_FRIEND; }
  }
  function friendLabel(k){
    try { return (typeof FRIENDS !== 'undefined' && FRIENDS[k]) ? FRIENDS[k] : (FRIENDS?.[DEFAULT_FRIEND] || 'MEL · Lee'); }
    catch(e){ return 'MEL · Lee'; }
  }
  function simplifyMomentsAuthor(){
    const row=document.querySelector('#momentsModal p:has(#momentsFriend)');
    const badge=document.getElementById('momentsFriend');
    if(badge) badge.textContent='By ' + friendLabel(currentUser());
    if(row){
      row.classList.add('moments-author-row');
      row.querySelectorAll('button').forEach(btn=>btn.remove());
    }
  }
  window.simplifyMomentsAuthor = simplifyMomentsAuthor;


  document.addEventListener('DOMContentLoaded',()=>{
    simplifyMomentsAuthor();
  });
})();

