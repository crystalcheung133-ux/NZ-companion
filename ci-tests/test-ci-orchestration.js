const fs=require('fs'),assert=require('assert');
const runAll=fs.readFileSync('ci-tests/run-all.sh','utf8'),workflow=fs.readFileSync('.github/workflows/ci.yml','utf8');
for(const suite of ['01-foundation.sh','02-data-integrity.sh','03-product-contracts.sh','04-analytics.sh','05-portability.sh','06-runtime-reliability.sh','07-trip-validation.sh','08-release-orchestration.sh','09-destructive-action-security.sh','10-stage1-genericity.sh','11-expense-booking-linkage.sh','12-booking-expense-flow.sh','13-inline-booking-from-expense.sh'])assert(runAll.includes(suite),`run-all missing ${suite}`);
assert(/run:\s*sh ci-tests\/run-all\.sh/.test(workflow),'GitHub Actions must call canonical run-all.sh');
assert(!/node ci-tests\/test-[^\n]+/.test(workflow),'GitHub Actions must not hand-pick tests');
console.log('CI ORCHESTRATION CONTRACT: PASS');
