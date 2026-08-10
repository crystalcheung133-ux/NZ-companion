const fs=require('fs');
const a=fs.readFileSync('admin.js','utf8'),e=fs.readFileSync('expenses.js','utf8'),c=fs.readFileSync('styles.css','utf8');
const fail=[];
if(!a.includes("studio.scrollIntoView({block:'start',inline:'nearest'})"))fail.push('Studio re-entry target missing');
if(!a.includes('key!==previousFriend'))fail.push('traveller switch guard missing');
for(const x of ['setStoredMode(false);','lockAdminSession();','closeTripStudioPanel();'])if(!a.includes(x))fail.push('atomic Studio exit missing '+x);
if((e.match(/expenseSheetFocusScroll=null;/g)||[]).length<2)fail.push('expense scroll reset incomplete');
if(!c.includes('Engine 25.4.31 — canonical full-overlay modal contract'))fail.push('full-overlay contract missing');
if(/#expenseModal\s+\.tools-sheet\s*\{[^}]*max-height/s.test(c))fail.push('legacy expense max-height conflict remains');
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('NZ ENGINE 25.4.31 INTERACTION CONTRACT: PASS');