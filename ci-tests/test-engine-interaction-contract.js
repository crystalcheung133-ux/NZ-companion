const fs=require('fs');
const admin=fs.readFileSync('admin.js','utf8');
const expenses=fs.readFileSync('expenses.js','utf8');
const css=fs.readFileSync('styles.css','utf8');
const fail=[];

if(!css.includes('Travel Engine 25.4.34 — canonical presentation shell')) fail.push('canonical presentation shell missing');
if(!admin.includes("studio.scrollIntoView({block:'start',inline:'nearest'})")) fail.push('Studio re-entry must target Studio card via scrollIntoView');
if(!admin.includes('key!==previousFriend')) fail.push('traveller-switch Studio exit guard missing');
for(const token of ['setStoredMode(false);','lockAdminSession();','closeTripStudioPanel();']){
  if(!admin.includes(token)) fail.push('atomic Studio exit missing '+token);
}
if((expenses.match(/expenseSheetFocusScroll=null;/g)||[]).length<2) fail.push('Expense modal scroll-state reset incomplete');
if(!admin.includes("modal.classList.add('studio-view')")) fail.push('Studio popup open state missing');
if(!admin.includes("modal.classList.remove('show')")) fail.push('Studio popup close behavior missing');

if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('ENGINE INTERACTION CONTRACT: PASS');
