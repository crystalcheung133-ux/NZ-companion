#!/bin/sh
set -u
failed=0
run(){ echo "== $1 =="; shift; "$@" || failed=1; echo ""; }
run "SYNTAX" node ci-tests/test-syntax.js
run "PORTABILITY" node ci-tests/test-portability.js
run "PRESENTATION PORTABILITY" node ci-tests/test-presentation-portability.js
run "FIXTURE DATA" node ci-tests/test-fixture-data.js
run "EXPENSE SAFETY" node ci-tests/test-expense-contracts.js
run "MODAL INTERACTION" node ci-tests/test-modal-interaction-contract.js
run "STUDIO IDENTITY" node ci-tests/test-studio-identity-contract.js
run "RELEASE" node ci-tests/test-release.js
run "STUDIO POPUP WORKSPACE" node ci-tests/test-studio-popup-workspace-contract.js
run "SELF-CONTAINED EXPENSE NOTIFICATION" node ci-tests/test-expense-notification-self-contained.js
run "PRESENTATION SHELL OWNERSHIP" node ci-tests/test-presentation-shell-ownership.js starter/styles.css
run "PRESENTATION SHELL INTERACTION" node ci-tests/test-presentation-shell-interaction.js starter/styles.css starter/admin.js
run "RELEASE HYGIENE" node ci-tests/test-release-hygiene.js .
run "BOOKING / GUIDE MODAL STACKING" node ci-tests/test-booking-guide-modal-stacking.js starter/styles.css
run "TRIP / GUIDE SHELL CONSOLIDATION" node ci-tests/test-trip-guide-shell-consolidation.js starter/styles.css
run "STUDIO HOME PREVIEW BOUNDS" node ci-tests/test-studio-home-preview-fit.js starter/styles.css starter/admin.js
run "STUDIO HEADER BADGE" node ci-tests/test-studio-header-badge.js
run "BOOKING AUTHORITY STALE-STATE" node ci-tests/test-booking-authority-stale-poisoning.js
run "BOOKING SURFACE ALLOW-LIST" node ci-tests/test-booking-detail-compact-contract.js
run "GUIDE BOOKING RETURN" node ci-tests/test-guide-booking-return-contract.js
run "MOMENTS ACTIVITY SEMANTICS" node ci-tests/test-moments-plan-activity-canonical.js
run "STUDIO LIFECYCLE CONSOLIDATION" node ci-tests/test-studio-lifecycle-consolidation.js
run "BROWSER GATE DEFINITION" node ci-tests/test-browser-gate-definition.js
run "NEUTRAL FIXTURE INTEGRITY" node ci-tests/test-neutral-fixture-integrity.js
run "TEST REGISTRY" node ci-tests/test-test-registry-contract.js
[ "$failed" -eq 0 ] || { echo "CANONICAL ENGINE CI FAILED"; exit 1; }
echo "CANONICAL ENGINE CI PASSED"
