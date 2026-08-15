const fs=require('fs');
const css=fs.readFileSync('styles.css','utf8');
const exp=fs.readFileSync('runtime/expenses.js','utf8');
const fail=[];
if(!css.includes('--engine-modal-layer:7000'))fail.push('canonical modal layer token missing');
if(!css.includes('pointer-events:none!important'))fail.push('bottom nav must be disabled');
if(!css.includes('bottom:0!important'))fail.push('overlay must extend to screen bottom');
if(/#expenseModal\s+\.tools-sheet\s*\{[^}]*max-height/s.test(css))fail.push('legacy expense max-height override remains');
if(/#momentsModal\.show\s*,\s*#expenseModal\.show\s*\{/s.test(css))fail.push('legacy moments/expense show override remains');
if((exp.match(/expenseSheetFocusScroll=null;/g)||[]).length<2)fail.push('Expense focus scroll reset incomplete');
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('MODAL INTERACTION CONTRACT: PASS');