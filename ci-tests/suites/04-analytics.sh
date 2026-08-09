#!/bin/sh
set -u
failed=0
echo "== ANALYTICS =="
node ci-tests/test-analytics-v1.js || failed=1
node ci-tests/test-analytics-permission-contract.js || failed=1
[ "$failed" -eq 0 ] || exit 1
echo "ANALYTICS: PASS"
