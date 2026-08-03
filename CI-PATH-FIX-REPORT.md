# CI Path Fix Report

Baseline: Stage3.2H-PORT1-BOOKING-SAVE-ROOTFIX1-CI-EXPENSE-CLEANUP1-Full-Deploy

Scope: CI-only path and production-manifest validation fix. No production runtime files were modified.

Files changed:
- ci-tests/test-checksums.sh
- ci-tests/test-syntax.sh
- ci-tests/test-html-structure.sh
- ci-tests/test-entity-integrity.js
- ci-tests/address-integrity-test.py
- ci-tests/run-all.sh (comment only)

Fixes:
- Removed every assumption that production lives in a prod/ directory.
- All tests now resolve the repository root from their own script location.
- Manifest validation compares the production manifest with the checksum production file set, rather than all repository entries.
- ci-tests/, .github/, reports and changed-files metadata are explicitly rejected if listed as production files.
- Production checksum verification remains strict for every listed runtime file.

Local Ubuntu-compatible command: sh ci-tests/run-all.sh

Results:
- JavaScript syntax: PASS — 42/42
- SHA256 checksums: PASS — 61/61
- Production manifest: PASS — 60 production files
- HTML structure: PASS — 10/10
- Entity integrity: PASS
- Guide address integrity: PASS
- Final result: ALL TESTS PASSED
