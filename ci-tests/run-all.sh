#!/bin/sh
# CCMV Travel Engine — full regression test suite.
# Runs every check against the repository-root production files and exits non-zero if any fails.
# Usage: sh ci-tests/run-all.sh
cd "$(dirname "$0")"
overall=0

echo "== 1/13 JS syntax gate =="
sh test-syntax.sh || overall=1
echo ""

echo "== 2/13 Release integrity (checksums + manifest) =="
sh test-checksums.sh || overall=1
echo ""

echo "== 3/13 HTML structure =="
sh test-html-structure.sh || overall=1
echo ""

echo "== 4/13 Entity linkage (places/bookings/itinerary/parties) =="
node test-entity-integrity.js || overall=1
echo ""

echo "== 5/13 Guide address integrity =="
python3 address-integrity-test.py || overall=1
echo ""

echo "== 6/13 Timeline integrity =="
node test-timeline-integrity.js || overall=1
echo ""

echo "== 7/13 UX contract =="
node test-ux-contract.js || overall=1
echo ""

echo "== 8/13 RC24.7 focused contract =="
node test-rc24-7.js || overall=1
echo ""

echo "== 9/13 RC24.7.2 regression contract =="
node test-rc24-7-2.js || overall=1
echo ""

echo "== 10/13 RC25.1 contract =="
node test-rc25-1.js || overall=1
echo ""

echo "== 11/13 RC25.1.6 consistency contract =="
node test-rc25-1-6.js || overall=1
echo ""

echo "== 12/13 RC25.2.2 guide / route contract =="
node test-rc25-2-2.js || overall=1
echo ""

echo "== 13/13 Runtime production integrity =="
node test-runtime-integrity.js || overall=1
echo ""

if [ "$overall" -eq 0 ]; then
  echo "ALL TESTS PASSED"
else
  echo "ONE OR MORE TESTS FAILED"
fi
exit $overall
