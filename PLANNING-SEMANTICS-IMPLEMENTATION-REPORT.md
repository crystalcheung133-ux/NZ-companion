# Planning Semantics Implementation Report

## Outcome

RC20 extends the RC19 Engine Integrity authority with a reusable Planning Semantics stage. It does not introduce another validator, schema authority, acceptance gate, runtime framework, or UI system.

The unchanged RC19 New Zealand dataset passes with zero errors and zero warnings.

## Architecture changes

- `engine-integrity.js` now runs `E1 → E2 → E3 → E4 → E5 → PLANNING`.
- `validateTripData` and `acceptTripData` remain the only integrated acceptance entry points.
- Planning results appear in `stages.PLANNING` and `summary.planningCounts`.
- Planning issues use the same structured error/warning/report format as E1–E5.
- Production eligibility and promotion behavior are exposed through the same Engine API.

## Planning API

- `validatePlanning(data, config)`: stage-only deterministic planning validation.
- `isProductionEligible(record, channel)`: status-aware production/edit/search decision.
- `filterProductionRecords(records, channel)`: non-mutating production filter.
- `promotePlanningRecord(data, change, config)`: immutable change plus complete acceptance revalidation.
- Existing `validateTripData`, `acceptTripData`, and `formatValidationReport` include planning without interface duplication.

Constants exposed by the Engine:

- `PLANNING_STATUSES`
- `PLANNING_ROLES`
- `INTEGRITY_STAGES`
- combined `STAGES`

## Canonical fields

- `planningStatus`: `confirmed`, `planned`, `backup`, `optional`, or `cancelled`.
- `planningGroupId`: reference to generic `PLANNING_GROUPS`.
- `planningRole`: `primary` or `alternative`.
- `PLANNING_GROUPS[id].primaryRequired`: enables deterministic missing-primary validation.

Status omission preserves RC19 behavior. Existing legacy `status` fields are not reclassified or rewritten.

## Validation rules

The Engine detects:

- invalid planning status;
- invalid/missing planning group;
- role without group;
- invalid group role;
- more than one primary;
- missing primary where required;
- more than one confirmed selection;
- cancelled records marked active/selected/production Guide/booking/export;
- optional records treated as mandatory;
- backup records treated as active or exported as confirmed.

Optional/backup/cancelled bookings that are not selected do not inherit active-booking required fields. Any navigation they actually declare remains validated.

## Promotion behavior

- Backup → confirmed is accepted only if full Engine acceptance remains valid.
- Alternative → primary automatically demotes the previous primary to alternative.
- A promotion creating duplicate confirmed selections is rejected transactionally.
- Inputs are never mutated.
- The return value includes `accepted`, accepted `data`, attempted `candidate`, and the full acceptance `result`.

## Files changed

Core implementation/test:

- `engine-integrity.js`
- `engine-integrity.test.js`
- `freeze-validation.js`

Release identity/client generation:

- `VERSION.txt`
- `trip-config.js`
- nine production HTML files

Documentation:

- `TRAVEL_ENGINE_ARCHITECTURE.md`
- `PLANNING-SEMANTICS-IMPLEMENTATION-REPORT.md`
- `PLANNING-SEMANTICS-TEST-REPORT.md`

`data.js`, Guide content, itinerary content, booking decisions, Service Worker implementation, CSS, and protected functional runtimes were not modified.

## Tests added

Fourteen planning tests cover:

- valid/invalid/omitted status;
- group and required-primary behavior;
- duplicate primary and confirmed selections;
- optional records and incomplete optional bookings;
- cancelled history, production exclusion, and active cancellation failure;
- cancelled booking deferral;
- backup confirmation;
- alternative primary promotion;
- transactional rejection of conflicting confirmation.

The four existing integration tests now execute Planning as part of RC19 acceptance.

## Test results

- E1: 5/5
- E2: 6/6
- E3: 6/6
- E4: 6/6
- E5: 5/5
- Planning: 14/14
- Integration: 4/4
- Total: **46/46 PASS**
- Freeze validation: PASS
- JavaScript syntax: PASS
- RC19 dataset through RC20 acceptance: PASS, 0 blocking errors, 0 warnings

## Canonical planning data

No New Zealand canonical entity received `planningStatus`, `planningGroupId`, or `planningRole`. No planning decision was inferred or changed.

## Known limitations

- Legacy free-form `status` fields remain outside the canonical planning model until a future trip deliberately maps them.
- Current NZ render/export behavior is unchanged because the dataset contains no canonical cancelled/backup/optional planning semantics. Future generators must consume the Engine production-eligibility API when emitting Guide/export/booking selections.
- Promotion is in-memory and transactional; persistence remains the responsibility of the existing caller/storage authority.

## Recommended RC21

RC21 should add a Generation Selection Adapter that consumes accepted planning groups and produces an immutable production projection for Guide, itinerary export, booking packets, and navigation manifests. It should use the RC20 eligibility API and never alter canonical planning history.
