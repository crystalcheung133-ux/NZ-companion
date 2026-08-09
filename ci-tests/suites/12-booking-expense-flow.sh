#!/bin/sh
set -u
node ci-tests/test-booking-expense-flow.js
echo "BOOKING / EXPENSE FLOW: PASS"
