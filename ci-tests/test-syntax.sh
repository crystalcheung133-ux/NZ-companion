#!/bin/sh
# CCMV Travel Engine — JS syntax gate. Fails the build if any shipped .js file
# does not parse. Run from repo root: sh ci-tests/test-syntax.sh
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
cd "$REPO_ROOT"
fail=0
count=0
for f in *.js; do
  count=$((count+1))
  if ! node --check "$f" 2>/tmp/syntax-err-$$; then
    echo "FAIL: $f"
    cat /tmp/syntax-err-$$
    fail=1
  fi
  rm -f /tmp/syntax-err-$$
done
if [ "$fail" -eq 0 ]; then
  echo "SYNTAX: PASS — $count/$count JS files parse cleanly"
  exit 0
else
  echo "SYNTAX: FAILED"
  exit 1
fi
