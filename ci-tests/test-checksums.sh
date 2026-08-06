#!/bin/sh
# Travel Engine — release integrity gate.
# Production files live at the repository root. Repository-only folders such as
# ci-tests/ and .github/ are intentionally outside the production manifest.

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
cd "$REPO_ROOT"

if [ ! -f SHA256SUMS.txt ]; then
  echo "CHECKSUMS: FAILED — SHA256SUMS.txt is missing from the repository root"
  exit 1
fi

if [ ! -f PRODUCTION-FILE-MANIFEST.txt ]; then
  echo "MANIFEST: FAILED — PRODUCTION-FILE-MANIFEST.txt is missing from the repository root"
  exit 1
fi

checksum_output=$(mktemp)
manifest_list=$(mktemp)
checksum_list=$(mktemp)
cleanup() {
  rm -f "$checksum_output" "$manifest_list" "$checksum_list"
}
trap cleanup EXIT HUP INT TERM

if ! sha256sum -c SHA256SUMS.txt > "$checksum_output" 2>&1; then
  echo "CHECKSUMS: FAILED"
  grep -v ': OK$' "$checksum_output" || cat "$checksum_output"
  exit 1
fi

checksum_count=$(wc -l < SHA256SUMS.txt | tr -d ' ')
echo "CHECKSUMS: PASS — $checksum_count/$checksum_count files verified against SHA256SUMS.txt"

# Manifest entries define the production runtime file set. SHA256SUMS.txt must
# contain exactly that set plus PRODUCTION-FILE-MANIFEST.txt itself.
grep '^- ' PRODUCTION-FILE-MANIFEST.txt | sed 's/^- //' | sort > "$manifest_list"
awk '{print $2}' SHA256SUMS.txt   | grep -v '^PRODUCTION-FILE-MANIFEST\.txt$'   | sort > "$checksum_list"

# Explicit guard: repository-only/development artifacts must never be declared
# as production files.
if grep -E '^(ci-tests/|\.github/|reports?/|implementation-reports?/|changed-files/|Changed-Files/)' "$manifest_list" "$checksum_list" > /dev/null 2>&1; then
  echo "MANIFEST: FAILED — repository-only or development artifacts are listed as production files"
  grep -E '^(ci-tests/|\.github/|reports?/|implementation-reports?/|changed-files/|Changed-Files/)' "$manifest_list" "$checksum_list" || true
  exit 1
fi

if ! diff -u "$manifest_list" "$checksum_list"; then
  echo "MANIFEST: FAILED — production manifest and checksum production file set differ"
  exit 1
fi

while IFS= read -r file; do
  if [ ! -f "$file" ]; then
    echo "MANIFEST: FAILED — listed production file is missing: $file"
    exit 1
  fi
done < "$manifest_list"

manifest_count=$(wc -l < "$manifest_list" | tr -d ' ')
echo "MANIFEST: PASS — $manifest_count production files match the checksum file set exactly"
exit 0
