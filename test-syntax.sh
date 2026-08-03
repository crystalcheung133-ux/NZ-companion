#!/bin/sh
# CCMV Travel Engine — HTML structure sanity check. Confirms every shipped
# .html file has balanced <div>/</div> tags. Run from repo root:
# sh ci-tests/test-html-structure.sh
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
cd "$REPO_ROOT"
fail=0
count=0
for f in *.html; do
  count=$((count+1))
  open=$(grep -o "<div" "$f" | wc -l | tr -d ' ')
  close=$(grep -o "</div>" "$f" | wc -l | tr -d ' ')
  if [ "$open" != "$close" ]; then
    echo "FAIL: $f — <div> open=$open close=$close"
    fail=1
  fi
done
if [ "$fail" -eq 0 ]; then
  echo "HTML STRUCTURE: PASS — $count/$count HTML files have balanced <div> tags"
  exit 0
else
  echo "HTML STRUCTURE: FAILED"
  exit 1
fi
