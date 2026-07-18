/* script.js — Stage 7K-2E compatibility entry and shared startup.
   Domain behavior lives in focused runtime modules. */
document.addEventListener('DOMContentLoaded',()=>{
  updateFriendLabels();
  if(typeof renderMoments==='function') renderMoments();
  if(typeof renderUnexpected==='function') renderUnexpected();
  if(typeof renderExpenses==='function') renderExpenses();
  if(typeof loadChecklist==='function') loadChecklist();
  if(typeof renderDashboard==='function') renderDashboard();
  document.querySelectorAll('.summary-link-row').forEach(x=>x.remove());
});
