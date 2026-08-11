#!/bin/sh
set -u
failed=0
run(){ echo "== $1 =="; shift; "$@" || failed=1; echo ""; }

run "FOUNDATION" sh ci-tests/suites/01-foundation.sh
run "DATA INTEGRITY" sh ci-tests/suites/02-data-integrity.sh
run "PRODUCT CONTRACTS" sh ci-tests/suites/03-product-contracts.sh
run "ANALYTICS" sh ci-tests/suites/04-analytics.sh
run "PORTABILITY" sh ci-tests/suites/05-portability.sh
run "RUNTIME RELIABILITY" sh ci-tests/suites/06-runtime-reliability.sh
run "TRIP VALIDATION" sh ci-tests/suites/07-trip-validation.sh
run "RELEASE ORCHESTRATION" sh ci-tests/suites/08-release-orchestration.sh
run "DESTRUCTIVE ACTION SECURITY" sh ci-tests/suites/09-destructive-action-security.sh
run "STAGE 1 GENERICITY" sh ci-tests/suites/10-stage1-genericity.sh
run "EXPENSE / BOOKING LINKAGE" sh ci-tests/suites/11-expense-booking-linkage.sh
run "BOOKING / EXPENSE FLOW" sh ci-tests/suites/12-booking-expense-flow.sh
run "INLINE BOOKING FROM EXPENSE" sh ci-tests/suites/13-inline-booking-from-expense.sh

[ "$failed" -eq 0 ] || { echo "MASTER CI SUITE FAILED"; exit 1; }
echo "MASTER CI SUITE PASSED"

node ci-tests/test-engine-interaction-contract.js

echo "== ENGINE 25.4.32 STUDIO POPUP == "

echo "== PRESENTATION SHELL OWNERSHIP =="
node ci-tests/test-presentation-shell-ownership.js styles.css
echo "== PRESENTATION SHELL INTERACTION =="
node ci-tests/test-presentation-shell-interaction.js styles.css admin.js

echo "== RELEASE HYGIENE =="
node ci-tests/test-release-hygiene.js .
