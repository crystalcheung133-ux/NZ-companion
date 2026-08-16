#!/bin/sh
set -u
failed=0
run(){ printf '\n== %s ==\n' "$1"; shift; "$@" || failed=1; }

run "SYNTAX" sh ci-tests/test-syntax.sh
run "HTML STRUCTURE" sh ci-tests/test-html-structure.sh
run "ENGINE 25.6 MIGRATION" node ci-tests/test-engine-25-6-migration.js
run "ENTITY INTEGRITY" node ci-tests/test-entity-integrity.js
run "TIMELINE INTEGRITY" node ci-tests/test-timeline-integrity.js
run "RUNTIME INTEGRITY" node ci-tests/test-runtime-integrity.js
run "BOOKING PERSISTENCE" node ci-tests/test-runtime-booking-persistence.js
run "INDEXEDDB LIFECYCLE" node ci-tests/test-runtime-indexeddb-lifecycle.js
run "RESET GENERATION" node ci-tests/test-runtime-reset-generation.js
run "RESET SEQUENCE" node ci-tests/test-runtime-reset-sequence.js
run "BOOKING / EXPENSE LINKAGE" node ci-tests/test-booking-expense-linkage.js
run "INLINE BOOKING FROM EXPENSE" node ci-tests/test-inline-booking-from-expense.js
run "EXPENSE NOTIFICATIONS" node ci-tests/test-expense-notifications.js
run "EXPENSE CURRENCY TOGGLE" node ci-tests/test-expense-currency-toggle.js
run "ANALYTICS V1.2" node ci-tests/test-analytics-v1.js
run "ANALYTICS PERMISSIONS" node ci-tests/test-analytics-permission-contract.js
run "BROWSER GATE DEFINITION" node ci-tests/test-browser-gate-definition.js
run "DESTRUCTIVE ACTION SECURITY" node ci-tests/test-destructive-action-security.js
run "SOLO PARTY" node ci-tests/test-stage1-solo-party.js
run "BACKWARD COMPAT" node ci-tests/test-stage1-backward-compat.js

run "CANONICAL STUDIO + EXPENSE DEEP-LINK" node ci-tests/test-canonical-studio-expense-deeplink.js
run "CANONICAL STUDIO VISUAL CONTRACT 25.6.2" node ci-tests/test-studio-visual-contract-2562.js
if [ "$failed" -eq 0 ]; then
  printf '\nNZ 25.6 MIGRATION CI PASSED\n'
  exit 0
fi
printf '\nNZ 25.6 MIGRATION CI FAILED\n' >&2
exit 1
