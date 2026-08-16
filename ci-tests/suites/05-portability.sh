#!/bin/sh
set -u
failed=0
echo "== PORTABILITY =="
node ci-tests/test-portability-completeness.js || failed=1
node ci-tests/test-portability-runtime-v2.js || failed=1
node ci-tests/test-engine-portability-capability.js || failed=1
[ "$failed" -eq 0 ] || exit 1
echo "PORTABILITY: PASS"
