#!/bin/sh
set -u
failed=0
node ci-tests/test-stage1-solo-party.js || failed=1
node ci-tests/test-stage1-open-state.js || failed=1
node ci-tests/test-stage1-backward-compat.js || failed=1
[ "$failed" -eq 0 ] || exit 1
echo "STAGE 1 GENERICITY: PASS"
