#!/bin/sh
# CCMV Travel Engine — full regression test suite.
# Runs every check against the repository-root production files and exits non-zero if any fails.
# Usage: sh ci-tests/run-all.sh
cd "$(dirname "$0")"
overall=0

echo "== 1/8 JS syntax gate =="
sh test-syntax.sh || overall=1
echo ""

echo "== 2/8 Release integrity (checksums + manifest) =="
sh test-checksums.sh || overall=1
echo ""

echo "== 3/8 Release file separation =="
sh test-release-file-separation.sh || overall=1
echo ""

echo "== 4/8 HTML structure =="
sh test-html-structure.sh || overall=1
echo ""

echo "== 5/8 Entity linkage (places/bookings/itinerary/parties) =="
node test-entity-integrity.js || overall=1
echo ""

echo "== 6/8 Guide address integrity =="
python3 address-integrity-test.py || overall=1
echo ""

echo "== 7/8 Timeline integrity =="
node test-timeline-integrity.js || overall=1
echo ""

echo "== 8/8 UX contract =="
node test-ux-contract.js || overall=1
echo ""

if [ "$overall" -eq 0 ]; then
  echo "ALL TESTS PASSED"
else
  echo "ONE OR MORE TESTS FAILED"
fi
exit $overall
