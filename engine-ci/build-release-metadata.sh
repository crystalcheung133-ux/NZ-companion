#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$ROOT"

# Production runtime = root-level web/runtime assets only.
# Repository/dev artifacts are excluded by deployment hygiene.
find . -maxdepth 1 -type f -printf '%f\n' \
 | grep -Ev '^(SHA256SUMS\.txt|PRODUCTION-FILE-MANIFEST\.txt|VERSION\.txt|.*\.md|.*\.sql|BOOKING-SYNC-EDGE-FUNCTION\.ts|bookings\.html|bookings-runtime\.js)$' \
 | sort > /tmp/travel-engine-prod-files.$$

BUILD_LABEL=$(sed -n '1p' VERSION.txt)

{
  echo 'Saigon Companion Production File Manifest'
  echo "Generated: $(date +%Y-%m-%d)"
  echo "Base: ${BUILD_LABEL}"
  echo 'Reference trip: Vietnam'
  echo
  echo 'Production root files:'
  echo
  sed 's/^/- /' /tmp/travel-engine-prod-files.$$
} > PRODUCTION-FILE-MANIFEST.txt

: > SHA256SUMS.txt
while IFS= read -r f; do sha256sum "$f" >> SHA256SUMS.txt; done < /tmp/travel-engine-prod-files.$$
sha256sum PRODUCTION-FILE-MANIFEST.txt >> SHA256SUMS.txt
rm -f /tmp/travel-engine-prod-files.$$
