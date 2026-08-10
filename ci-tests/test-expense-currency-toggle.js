const fs=require('fs'),assert=require('assert');
const e=fs.readFileSync('expenses.js','utf8');
assert(!e.includes("Settlement currency · ${home}"),'settlement-currency message must not replace conversion');
assert(e.includes("const other=code===home?trip:home"),'toggle must convert to the opposite currency');
assert(e.includes("${FORMATTER.decimal(basis,0)} ${code} ≈ ${FORMATTER.decimal(basisConverted,2)} ${other}"),'directional FX label missing');
assert(e.includes("input.placeholder=`0.00 ${expenseCurrency"),'amount placeholder must follow selected input currency');
console.log('EXPENSE CURRENCY TOGGLE CONTRACT: PASS');
