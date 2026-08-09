#!/bin/sh
set -u
failed=0
echo "== RELEASE ORCHESTRATION =="
node ci-tests/test-ci-orchestration.js || failed=1
node ci-tests/test-release-metadata.js || failed=1
[ "$failed" -eq 0 ] || exit 1
echo "RELEASE ORCHESTRATION: PASS"
