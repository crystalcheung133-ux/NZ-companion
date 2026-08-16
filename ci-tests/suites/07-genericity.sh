#!/bin/sh
set -u
failed=0
echo "== GENERICITY =="
node ci-tests/test-stage1-genericity-vn.js || failed=1
[ "$failed" -eq 0 ] || exit 1
echo "GENERICITY: PASS"
