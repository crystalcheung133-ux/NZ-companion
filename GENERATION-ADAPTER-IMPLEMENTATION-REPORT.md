# RC21 Generation Adapter Implementation Report

## Outcome

RC21 adds one reusable Generation Selection Adapter after RC20 Planning Semantics. It creates a deeply immutable production projection and is now the selection boundary for Guide, Trip, Day, Booking Pack accommodation data, Navigation, Export, and future AI consumption.

## Architecture changes

Before RC21, production renderers read canonical collections directly and could independently interpret planning state. After RC21:

1. canonical data passes the existing E1–E5 and Planning acceptance gate;
2. `generation-selection-adapter.js` applies RC20 `isProductionEligible` / `filterProductionRecords`;
3. the adapter creates and validates one frozen projection;
4. production renderers read the corresponding projection view.

No new schema or validation authority was created. `engine-integrity.js` remains unchanged.

## API and model

The public API provides projection creation, validation, report formatting, current-view access, rebuild, and promotion/rebuild. Projection branches are Guide, itinerary/Trip, bookings, navigation, export, and AI. All branches are derived clones and deeply frozen.

Promotion delegates to RC20 `promotePlanningRecord`. Only an accepted candidate becomes the next registered source and projection; the caller’s canonical object remains unchanged.

## Validation rules

The adapter blocks:

- duplicate production entities or ordering entries;
- cancelled or backup leakage;
- entities without canonical sources;
- missing eligible production records;
- inconsistent Export/AI views;
- navigation actions whose owner is not in production;
- any projection that is not deeply immutable.

Failures use the `PROJECTION` stage and structured `PROJECTION_*` codes.

## Files changed

- `generation-selection-adapter.js` — new authoritative adapter.
- `generation-selection-adapter.test.js` — new dependency-free tests.
- `guide-runtime.js`, `trip-runtime.js`, `script.js`, `export-runtime.js` — production consumers switched to adapter views.
- `day.html`, `index.html`, `place.html` — inline production reads switched to adapter views.
- `expenses.html`, `itinerary.html`, `memory.html`, `moments.html`, `trip.html` — adapter loaded in the shared data pipeline.
- `offline.html` — RC21 asset-generation query only.
- `freeze-validation.js` — adapter/release/package gate.
- `trip-config.js`, `VERSION.txt` — RC21 identity.
- `TRAVEL_ENGINE_ARCHITECTURE.md` — updated architecture.
- `GENERATION-ADAPTER-IMPLEMENTATION-REPORT.md`, `GENERATION-ADAPTER-TEST-REPORT.md` — RC21 reports.

## Scope and data

No canonical New Zealand data, planning status, itinerary decision, Guide content, booking decision, or export layout was changed. No CSS, service-worker, sync, Admin, Expenses, Moments, Complete Trip, or manifest behavior was changed.

## Known limitations

- The current dataset has no canonical `planningStatus` values, so omission intentionally retains RC20 behavior.
- Navigation projection supports canonical `NAVIGATION_ACTIONS` and the existing rental pickup/return destination fields. Additional future booking roles should be added as canonical navigation actions rather than inferred by renderers.
- The adapter dispatches a projection-change event; future interactive planning UI should subscribe and rerender its active view after a successful promotion.

## Recommended RC22

Add a renderer contract layer that formalizes projection-change subscriptions and consumer capability declarations, while preserving the single adapter and avoiding a second projection authority.
