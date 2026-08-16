const fs=require('fs');
const e=fs.readFileSync('expenses.js','utf8');
const fail=[];
const open=e.indexOf('openExpenseModal');
const close=e.indexOf('closeExpenseModal');
if(open<0||close<0) fail.push('Expense modal open/close functions missing');
if((e.match(/expenseSheetFocusScroll=null;/g)||[]).length<2) fail.push('expense focus scroll not reset on both open and close');
if((e.match(/expenseModal\.scrollTop=0;/g)||[]).length<2) fail.push('expense modal scroll top not reset on open/close');
if((e.match(/expenseSheet\.scrollTop=0;/g)||[]).length<2) fail.push('expense sheet scroll top not reset on open/close');
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('EXPENSE MODAL SCROLL RESET: PASS');