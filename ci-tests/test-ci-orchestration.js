const fs=require('fs'),assert=require('assert');
const runAll=fs.readFileSync('ci-tests/run-all.sh','utf8');
for(const s of ['01-foundation.sh','02-data-integrity.sh','03-product-contracts.sh','04-analytics.sh','05-portability.sh','06-runtime-reliability.sh','07-genericity.sh','08-booking-expense.sh','09-release.sh','10-expense-save-safety.sh','11-expense-commit-boundary.sh'])assert(runAll.includes(s),`missing ${s}`);
console.log('CI ORCHESTRATION CONTRACT: PASS');