#!/bin/sh
# CCMV Travel Engine — full regression test suite.
# Runs every check against the repository-root production files and exits non-zero if any fails.
# Usage: sh ci-tests/run-all.sh
cd "$(dirname "$0")"
overall=0

echo "== 1/9 JS syntax gate =="
sh test-syntax.sh || overall=1
echo ""

echo "== 2/9 Release integrity (checksums + manifest) =="
sh test-checksums.sh || overall=1
echo ""

echo "== 3/9 HTML structure =="
sh test-html-structure.sh || overall=1
echo ""

echo "== 4/9 Entity linkage (places/bookings/itinerary/parties) =="
node test-entity-integrity.js || overall=1
echo ""

echo "== 5/9 Guide address integrity =="
python3 address-integrity-test.py || overall=1
echo ""

echo "== 6/9 Timeline integrity =="
node test-timeline-integrity.js || overall=1
echo ""

echo "== 7/9 UX contract =="
node test-ux-contract.js || overall=1
echo ""

echo "== 8/9 RC24.7 focused contract =="
node test-rc24-7.js || overall=1
echo ""

echo "== 9/9 RC24.7.1 corrective contract =="
node test-rc24-7-1.js || overall=1
echo ""

if [ "$overall" -eq 0 ]; then
  echo "ALL TESTS PASSED"
else
  echo "ONE OR MORE TESTS FAILED"
fi
exit $overall
