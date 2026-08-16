const fs=require('fs'),assert=require('assert');
const e=fs.readFileSync('expenses.js','utf8');

assert(e.includes("const explicitDeposit=MONEY.normalizeAmount(booking?.depositAmount)"),
  'booking depositAmount must be considered first');
assert(e.includes("booking?.depositCurrency"),
  'booking depositCurrency must seed Expense currency');
assert(e.includes("seed.kind==='deposit'?`${booking.title||'Booking'} · Deposit`"),
  'deposit payment should be recognisable in Expense details');

const write=e.indexOf('writeExpenses(arr);');
const close=e.indexOf('closeExpenseModal();',write);
const render=e.indexOf('window.renderExpenses(operation)',write);
assert(write>=0 && close>write,'modal must close after local commit');
assert(render>close,'post-save render must happen only after modal is closed');
assert(e.includes("if(localCommitComplete)"),
  'post-commit exception guard missing');
assert(e.includes("Never ask the user to retry a transaction that is already persisted."),
  'save success boundary documentation/guard missing');
console.log('EXPENSE COMMIT BOUNDARY CONTRACT: PASS');