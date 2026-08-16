#!/bin/sh
set -u
failed=0
echo "== RELEASE =="
node ci-tests/test-release-metadata.js || failed=1
node ci-tests/test-ci-orchestration.js || failed=1
node ci-tests/test-build-meta-consistency.js || failed=1
node ci-tests/test-test-registry-contract.js || failed=1
node ci-tests/test-browser-gate-definition.js || failed=1
sh ci-tests/test-python-ci-syntax.sh || failed=1
[ "$failed" -eq 0 ] || exit 1
echo "RELEASE: PASS"
