#!/bin/sh
set -u
failed=0
echo "== FOUNDATION =="
sh ci-tests/test-syntax.sh || failed=1
sh ci-tests/test-checksums.sh || failed=1
sh ci-tests/test-html-structure.sh || failed=1
[ "$failed" -eq 0 ] || exit 1
echo "FOUNDATION: PASS"
