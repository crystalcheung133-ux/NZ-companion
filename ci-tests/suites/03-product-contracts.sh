#!/bin/sh
set -u
failed=0
echo "== PRODUCT CONTRACTS =="
node ci-tests/test-ux-contract.js || failed=1
node ci-tests/test-rc24-7.js || failed=1
node ci-tests/test-rc24-7-2.js || failed=1
node ci-tests/test-rc25-1.js || failed=1
node ci-tests/test-rc25-1-6.js || failed=1
node ci-tests/test-rc25-2-2.js || failed=1
node ci-tests/test-rc25-2-3.js || failed=1
node ci-tests/test-engine-backport-25-4-12.js || failed=1
[ "$failed" -eq 0 ] || exit 1
echo "PRODUCT CONTRACTS: PASS"
