#!/bin/sh
set -u
failed=0
echo "== VN PRODUCT CONTRACTS =="
node ci-tests/test-ux-contract.js || failed=1
node ci-tests/test-booking-foundation.js || failed=1
node ci-tests/test-booking-collaboration-capability.js || failed=1
node ci-tests/test-vn-reference-integration.js || failed=1
node ci-tests/test-dual-currency-expenses.js . || failed=1
node ci-tests/test-admin-modal-release-capability.js || failed=1
node ci-tests/test-presentation-identity-capability.js || failed=1
node ci-tests/test-guide-shopping-capability.js || failed=1
node ci-tests/test-guide-trip-navigation-capability.js || failed=1
node ci-tests/test-timeline-copy-capability.js || failed=1
node ci-tests/test-guide-booking-capability.js || failed=1
node ci-tests/test-vn-itinerary-content-contract.js || failed=1
node ci-tests/test-guide-menu-alignment.js || failed=1
node ci-tests/test-itinerary-d2-d4-reconciliation.js || failed=1
node ci-tests/test-vn-content-contract.js || failed=1
node ci-tests/test-guide-booking-return-contract.js || failed=1
node ci-tests/test-vn-route-first-spa-contract.js || failed=1
node ci-tests/test-vn-restaurant-booking-guide-contract.js || failed=1
[ "$failed" -eq 0 ] || exit 1
echo "VN PRODUCT CONTRACTS: PASS"

node ci-tests/test-booking-sync-canonical-master-contract.js || failed=1

node ci-tests/test-booking-authority-stale-poisoning.js || failed=1


node ci-tests/test-booking-detail-compact-contract.js || failed=1

node ci-tests/test-cross-surface-day-consistency.js || failed=1

node ci-tests/test-moments-plan-activity-canonical.js || failed=1

node ci-tests/test-open-day-and-arrival-flow.js || failed=1


