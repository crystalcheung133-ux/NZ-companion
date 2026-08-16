const fs=require('fs'),assert=require('assert');
const e=fs.readFileSync('expenses.js','utf8');
const t=fs.readFileSync('trip-runtime.js','utf8');
assert(e.includes("document.getElementById('tripModal')?.classList.remove('show')"));
assert(e.includes("window.location.href=`expenses.html?expenseId=${encodeURIComponent(savedId)}`"));
assert(e.includes("id=\"expense-${escapeHTML(e.id)}\""));
assert(e.includes("focusExpenseFromURL()"));
assert(t.includes("expenses.html?expenseId=${encodeURIComponent(newest.id)}"));
console.log('BOOKING / EXPENSE FLOW CONTRACT: PASS');
