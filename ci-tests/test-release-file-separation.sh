#!/bin/sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
manifest="$REPO_ROOT/PRODUCTION-FILE-MANIFEST.txt"
checksums="$REPO_ROOT/SHA256SUMS.txt"

if cmp -s "$manifest" "$checksums"; then
  echo "RELEASE FILE SEPARATION: FAILED — manifest and checksum files are identical"
  exit 1
fi

first_line="$(head -n 1 "$checksums" || true)"
printf '%s
' "$first_line" | grep -Eq '^[0-9a-f]{64}  .+' || {
  echo "RELEASE FILE SEPARATION: FAILED — SHA256SUMS.txt does not start with a checksum line"
  exit 1
}

grep -q '^CCMV Travel Engine Production File Manifest$' "$manifest" || {
  echo "RELEASE FILE SEPARATION: FAILED — manifest header missing"
  exit 1
}

echo "RELEASE FILE SEPARATION: PASS"
