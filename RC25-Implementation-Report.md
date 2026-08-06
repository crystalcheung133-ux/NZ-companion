# RC25 Implementation Report

## Scope

RC25 is a clean production freeze focused on the Guide → Booking modal stack and release-package cleanup.

## Implemented

- Guide-card **Booking** opens the exact in-page booking modal.
- The booking modal is layered above the still-open Guide modal.
- Closing Booking reveals the original Guide card, preserving the originating page and Guide context.
- Added a UX contract for the stacked-modal state and z-index requirement.
- Updated release version and service-worker cache identifier.
- Removed legacy RC22–RC24 implementation and regression reports from the Full Deploy package.
- Retained only the current RC25 implementation/regression reports and the canonical UX rules document.

## Files changed

- `guide-runtime.js`
- `trip-runtime.js`
- `styles.css`
- `ci-tests/test-ux-contract.js`
- `sw.js`
- `VERSION.txt`
- `PRODUCTION-FILE-MANIFEST.txt`
- `SHA256SUMS.txt`

## Verification

- JavaScript syntax gate passed.
- Timeline integrity passed.
- Entity integrity passed.
- RC24.7 focused contract passed.
- RC24.7.2 accommodation regression contract passed.
- UX contract passed, including Guide → Booking modal layering and return-state assertions.
- Final clean-copy release-integrity verification passed.

## Limitation

No automated browser click runner was available in this environment. The release does not claim automated visual interaction testing.
