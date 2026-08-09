#!/bin/sh
set -u
failed=0
echo "== RUNTIME RELIABILITY =="
node ci-tests/test-runtime-booking-persistence.js || failed=1
node ci-tests/test-runtime-indexeddb-lifecycle.js || failed=1
node ci-tests/test-runtime-reset-generation.js || failed=1
node ci-tests/test-runtime-reset-sequence.js || failed=1
[ "$failed" -eq 0 ] || exit 1
echo "RUNTIME RELIABILITY: PASS"
