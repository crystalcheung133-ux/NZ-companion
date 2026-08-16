#!/bin/sh
set -u
failed=0
node ci-tests/test-booking-expense-linkage.js || failed=1
node ci-tests/test-expense-notifications.js || failed=1
node ci-tests/test-expense-currency-toggle.js || failed=1
[ "$failed" -eq 0 ] || exit 1
echo "EXPENSE / BOOKING LINKAGE: PASS"
