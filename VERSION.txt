# RC24.5 — Release Integrity Hardening

## Fixed
- Rebuilt `SHA256SUMS.txt` independently using native Linux `sha256sum`.
- Verified the checksum file is not identical to the production manifest.
- Verified every checksum line uses strict `64-hex + two spaces + filename` format.
- Verified checksum count matches the production file set.

## Prevention
- Added a release-file-separation CI test that resolves paths from its own location.
- Added the same guard to GitHub Actions.
- The package is re-opened after ZIP creation and validated again.

## Runtime
No Travel Engine interface, trip data, Guide, Timeline, Expense, Moments or Studio behaviour changed.
