# Engine Integrity Implementation Report

## 1. Architecture before and after

Before RC19, `freeze-validation.js` contained NZ release-specific structural checks. Those checks could detect known RC18 problems, but they were not a reusable Engine API and could not gate future trip generation.

RC19 introduces one trip-agnostic `engine-integrity.js` authority. It accepts the existing canonical dataset/configuration, runs E1–E5, returns a structured result, and can throw a blocking acceptance error. The freeze validator now composes this module and retains only packaging/release/presentation checks.

No UI, CSS, sync engine, canonical trip schema, or parallel data authority was created.

## 2. Validation module/API

- `validateE1` through `validateE5`: stage-specific deterministic validators.
- `validateTripData(data, config)`: authoritative integrated acceptance entry point.
- `acceptTripData(data, config)`: runtime/generation gate; throws `TravelEngineIntegrityError` on blocking errors.
- `formatValidationReport(result, options)`: Markdown or text report.

Result shape includes `valid`, `status`, `blockingErrorCount`, `warningCount`, `errors`, `warnings`, `issues`, `stages`, and grouped entity/relationship/navigation/booking/non-place counts.

## 3. E1 — Canonical Entity Validator

- Validates place, itinerary item, booking, day, Guide order/category, and trip-configuration structures.
- Detects duplicate IDs, including raw object-literal key metadata supplied by static validation.
- Requires stable, non-empty, trimmed, non-placeholder IDs.
- Detects malformed records, ID/key mismatches, malformed day item arrays, and unresolved declared canonical references.
- Never uses display labels as canonical IDs.

Checkpoint: **5/5 tests passed**.

Files at checkpoint: `engine-integrity.js`, `engine-integrity.test.js`.

## 4. E2 — Relationship Validator

- Requires every timeline item to be place-linked or explicitly non-place.
- Validates timeline-to-place, timeline-to-booking, timeline-to-Guide, booking-to-place/standalone, `DAY_LINKS`, Guide order, and Guide category relationships.
- Detects dangling references, orphan/unreachable Guide entries, copied Guide presentation authorities, and ambiguous timeline records.
- Does not create fake places or repair data.

Checkpoint: **6/6 tests passed**.

Files at checkpoint: `engine-integrity.js`, `engine-integrity.test.js`.

## 5. E3 — Navigation Validator

- Validates owner, role, destination source, destination value, and label.
- Validates rental pickup and return bindings independently.
- Detects missing destinations, cross-bound role destinations, ambiguous generic labels, and suspicious identical destinations.
- Supports explicitly valid same-depot and one-way rentals without opening map services.

Checkpoint: **6/6 tests passed**.

Files at checkpoint: `engine-integrity.js`, `engine-integrity.test.js`.

## 6. E4 — Booking Validator

Type-specific rules support:

- Accommodation: identity, check-in/out, location relationship/address, stay dates.
- Rental vehicle: provider, pickup/return times, depots, and role-specific navigation destinations.
- Flight: departure/arrival times and airports.
- Activity/tour: identity, date/time, conditional meeting/pickup arrangement, and place/operator/standalone classification.

Price, cancellation, reference, carrier, provider, and other optional commercial fields do not block unless structurally applicable.

Checkpoint: **6/6 tests passed**.

Files at checkpoint: `engine-integrity.js`, `engine-integrity.test.js`.

## 7. E5 — Non-place Classification

- Keeps `nonPlace: true` as the compatible canonical mechanism.
- Registers reusable optional roles: meal choice, accommodation/operator meal, fuel check, final refuel, comfort stop, free time, check-in/out, preparation, and transfer instruction.
- Blocks placeId, Guide, address, map, and navigation actions on non-place records.
- Blocks ambiguous records with neither a valid place relationship nor explicit non-place classification.
- Warns when descriptive text may identify a named venue; it never auto-classifies or creates a place.

Checkpoint: **5/5 tests passed**.

Files at checkpoint: `engine-integrity.js`, `engine-integrity.test.js`, `data.js`.

## 8. Blocking versus warning policy

- Any `severity: error` is blocking and produces overall FAIL.
- Warnings remain visible but do not block acceptance.
- Validation is read-only and never supplies fabricated corrections.
- Recommendations are included only when the required correction is deterministic.

## 9. Files changed

Modified:

- `VERSION.txt`
- `data.js`
- `day.html`
- `expenses.html`
- `freeze-validation.js`
- `index.html`
- `itinerary.html`
- `memory.html`
- `moments.html`
- `offline.html`
- `place.html`
- `sw.js`
- `trip.html`
- `trip-config.js`
- `TRAVEL_ENGINE_ARCHITECTURE.md`

Added:

- `engine-integrity.js`
- `engine-integrity.test.js`
- `ENGINE-INTEGRITY-IMPLEMENTATION-REPORT.md`
- `ENGINE-INTEGRITY-TEST-REPORT.md`
- `SAMPLE-FAILURE-REPORT.md`

## 10. Tests added

The dependency-free suite contains **32 tests**: E1 (5), E2 (6), E3 (6), E4 (6), E5 (5), and integration (4).

## 11. Test results

- Engine Integrity suite: **32/32 PASS**.
- Integrated RC19 dataset: **PASS, 0 blocking errors, 0 warnings**.
- RC19 freeze validation: **PASS**.
- JavaScript syntax checks: **PASS for every production/test JavaScript file**.
- Browser smoke: Home, itinerary, Trip, Expenses, Moments, offline shell, Guide, and Days 1–10 rendered; no core console errors.
- Protected runtime hash comparison: **PASS**.

## 12. RC18.2 canonical data corrections

No itinerary sequence, venue choice, booking decision, address fact, date, or time was changed.

Minimal schema/binding corrections were necessary:

1. Existing rental facts were assigned explicit canonical roles:
   - pickup: 22 Sep 2026 17:30, 79 Stanleys Road;
   - return: 1 Oct 2026 17:00, 2/13 Red Oaks Drive;
   - shuttle collection: existing 264 Russley Road value moved to `shuttleCollectionAddress`;
   - role-specific pickup/return navigation destinations added;
   - booking marked `oneWay: true` and `standalone: true`.
2. The eleven already explicit non-place items received compatible `nonPlaceRole` values.
3. Four dormant map fields were removed from non-place fuel/comfort instructions because E5 prohibits place actions on non-place records.

These corrections expose existing facts and classification intent; they do not invent content.

## 13. Known limitations

- Current RC19 production data contains accommodation and rental booking records. Flight and activity/tour rules are covered by automated fixtures and are ready for future canonical booking records.
- Navigation presentation binding is structurally checked for the current rental Trip card. Future renderers should emit canonical navigation actions rather than embed them in arbitrary HTML strings.
- Duplicate object keys require raw-source metadata because JavaScript object evaluation necessarily overwrites duplicate keys; `freeze-validation.js` supplies this metadata.

## 14. Recommended next Engine V2 stage

E6 should define a small canonical import adapter contract for future trip generators. It should normalize incoming Vietnam/Japan source data into the existing Engine collections, call `acceptTripData`, and refuse artifact generation on FAIL while preserving the same issue/result schema.

## Final stage

The runtime acceptance call, release metadata, Service Worker asset/cache identity, static freeze gate, architecture documentation, browser regression, and packaging were integrated only after all E1–E5 stage checkpoints passed.
