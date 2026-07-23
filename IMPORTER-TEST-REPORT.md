# RC22 Master File Importer V1 — Test Report

## Result

PASS

- Master File Importer tests: 23/23 passed.
- Existing Engine Integrity and Planning tests: 46/46 passed.
- Existing Generation Adapter tests: 19/19 passed.
- Total automated tests: 88/88 passed.
- RC22 freeze validation: PASS.
- Production JavaScript syntax validation: PASS.

## Importer coverage

Tests cover:

- flexible section ordering;
- accommodation;
- restaurant/Guide place creation;
- activity entity and place behavior;
- flights;
- rental pickup and return;
- Day, Guide, booking, navigation, and canonical-reference relationships;
- original wording preservation;
- backup and optional wording;
- compact preferred/backup alternatives and planning-group questions;
- explicit planning fields without planning inference;
- alternative/planning-group ambiguity;
- unknown sections;
- malformed and empty input;
- named activity without fake-place creation;
- missing flight endpoint;
- rental navigation without address reuse;
- generic airport/station-style location ambiguity;
- question reason, suggested interpretation, and confidence;
- report statistics;
- RC19–20 acceptance handoff;
- RC21 projection rebuild handoff.

## Regression

The unchanged RC21 New Zealand dataset passes existing Engine and Generation Adapter suites. Freeze validation confirms one importer authority and verifies that importer code does not require or embed `data.js`, Engine Integrity, or the Generation Adapter.

## Protected runtime comparison

The following remain byte-identical to RC21:

- `data.js`
- `engine-integrity.js`
- `generation-selection-adapter.js`
- Guide, Trip, Navigation, Booking, Export, Admin, Expenses, Moments, sync, Complete Trip, CSS, manifest, and service-worker implementation files.

HTML changes are limited to RC22 cache-busting query values. No importer script is loaded by Companion pages.
