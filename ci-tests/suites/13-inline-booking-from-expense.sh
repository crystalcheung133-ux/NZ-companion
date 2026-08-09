#!/bin/sh
set -u
node ci-tests/test-inline-booking-from-expense.js
echo "INLINE BOOKING FROM EXPENSE: PASS"
