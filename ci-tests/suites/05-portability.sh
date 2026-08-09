#!/bin/sh
set -u
failed=0
echo "== PORTABILITY =="
node ci-tests/test-portability-completeness.js || failed=1
[ "$failed" -eq 0 ] || exit 1
echo "PORTABILITY: PASS"
