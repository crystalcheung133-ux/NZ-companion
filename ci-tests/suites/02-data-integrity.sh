#!/bin/sh
set -u
failed=0
echo "== DATA INTEGRITY =="
node ci-tests/test-entity-integrity.js || failed=1
python3 ci-tests/address-integrity-test.py || failed=1
node ci-tests/test-timeline-integrity.js || failed=1
node ci-tests/test-runtime-integrity.js || failed=1
[ "$failed" -eq 0 ] || exit 1
echo "DATA INTEGRITY: PASS"
