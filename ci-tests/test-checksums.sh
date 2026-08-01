#!/bin/sh
# CCMV Travel Engine — release integrity gate. Verifies every file listed in
# SHA256SUMS.txt matches its checksum, and that no shipped file is missing
# from the manifest/checksum list. Run from repo root: sh ci-tests/test-checksums.sh
cd "$(dirname "$0")/../prod"

if [ ! -f SHA256SUMS.txt ]; then
  echo "CHECKSUMS: FAILED — SHA256SUMS.txt is missing from this build"
  exit 1
fi

if ! sha256sum -c SHA256SUMS.txt > /tmp/checksum-out-$$ 2>&1; then
  echo "CHECKSUMS: FAILED"
  grep -v ": OK$" /tmp/checksum-out-$$
  rm -f /tmp/checksum-out-$$
  exit 1
fi
count=$(wc -l < SHA256SUMS.txt | tr -d ' ')
rm -f /tmp/checksum-out-$$
echo "CHECKSUMS: PASS — $count/$count files verified against SHA256SUMS.txt"

if [ -f PRODUCTION-FILE-MANIFEST.txt ]; then
  grep '^- ' PRODUCTION-FILE-MANIFEST.txt | sed 's/^- //' | sort > /tmp/manifest-$$.txt
  ls -1 | grep -v '^PRODUCTION-FILE-MANIFEST.txt$' | grep -v '^SHA256SUMS.txt$' | sort > /tmp/actual-$$.txt
  if ! diff -q /tmp/manifest-$$.txt /tmp/actual-$$.txt > /dev/null 2>&1; then
    echo "MANIFEST: FAILED — PRODUCTION-FILE-MANIFEST.txt does not match shipped files"
    diff /tmp/manifest-$$.txt /tmp/actual-$$.txt
    rm -f /tmp/manifest-$$.txt /tmp/actual-$$.txt
    exit 1
  fi
  rm -f /tmp/manifest-$$.txt /tmp/actual-$$.txt
  echo "MANIFEST: PASS — matches shipped file set exactly"
else
  echo "MANIFEST: FAILED — PRODUCTION-FILE-MANIFEST.txt is missing from this build"
  exit 1
fi
exit 0
