# Travel Engine V2 Architecture — RC21

## Authorities

- `trip-config.js` owns trip and release identity.
- `data.js` owns canonical places, itinerary, Guide relationships, bookings, Trip cards and navigation-bearing fields.
- `engine-integrity.js` is the single E1–E5 and Planning Semantics validation authority.
- `generation-selection-adapter.js` is the single production projection authority.

No renderer owns planning selection rules. Canonical history remains available to Admin and sync; production consumers receive derived read-only views.

## Acceptance and generation pipeline

```text
Canonical trip data + configuration
                  |
                  v
       Engine Integrity E1–E5
                  |
                  v
       Planning Semantics (RC20)
                  |
             PASS only
                  |
                  v
  Generation Selection Adapter (RC21)
                  |
        deeply frozen projection
                  |
       +----------+----------+
       |     |       |       |
     Guide  Trip  Bookings  Navigation
       |     |       |       |
       +-----+--- Export -----+
                  |
               Future AI
```

`TravelEngineIntegrity.acceptTripData(data, config)` remains the acceptance entry point. The adapter calls it before creating any view.

## Planning semantics

The canonical optional field is `planningStatus`, with `confirmed`, `planned`, `backup`, `optional`, and `cancelled` as allowed values. Omission preserves pre-RC20 behavior. The adapter calls `isProductionEligible(record, 'selection')` and `filterProductionRecords(records, 'selection')`; it does not reproduce status decisions.

Production selection is therefore:

- confirmed and planned: included;
- backup and optional: excluded;
- cancelled: always excluded;
- omitted status: included for backward compatibility.

## Generation Adapter API

```text
GenerationSelectionAdapter.createProductionProjection(data, config)
GenerationSelectionAdapter.validateProductionProjection(projection, data, config)
GenerationSelectionAdapter.formatProjectionReport(result, options)
GenerationSelectionAdapter.rebuild(data, config)
GenerationSelectionAdapter.getCurrent()
GenerationSelectionAdapter.requireCurrent()
GenerationSelectionAdapter.view(name)
GenerationSelectionAdapter.promoteAndRebuild(change)
```

The browser exposes the current frozen view as `PRODUCTION_PROJECTION`. A successful rebuild dispatches `travelengine:productionprojectionchange`.

## Projection model

```text
productionProjection
├── guide
│   ├── places
│   ├── categories
│   ├── order
│   └── dayLinks
├── itinerary
│   └── days
├── trip
│   ├── cards
│   ├── order
│   └── places
├── bookings
│   ├── byId
│   └── order
├── navigation
│   └── actions
├── export
├── ai
└── acceptance
```

Every branch is cloned from canonical data and deeply frozen. Export and AI receive production-only copies, not canonical planning history.

## Promotion

`promoteAndRebuild(change)` delegates the planning transition to RC20 `promotePlanningRecord`. A failed promotion leaves the registered canonical dataset and current projection unchanged. A successful promotion registers the accepted cloned dataset, rebuilds all consumer views, and emits one projection-change event. The caller’s original canonical object is never mutated.

## Projection validation

Blocking codes are:

- `PROJECTION_DUPLICATE`
- `PROJECTION_CANCELLED_VISIBLE`
- `PROJECTION_BACKUP_VISIBLE`
- `PROJECTION_SOURCE_MISSING`
- `PROJECTION_INCONSISTENT`
- `PROJECTION_MUTABLE`

Validation checks deep immutability, eligible-record completeness, canonical provenance, duplicate IDs/order entries, selection leakage, navigation ownership, and consistency between shared views.

## Runtime boundaries

Guide, Trip, Day, Home day navigation, place details, Booking Pack accommodation data, and itinerary exports consume adapter views. `navigation.js` remains a generic URL/action utility; canonical destination selection occurs in the adapter’s navigation view. Admin, itinerary authority, sync, Expenses, Moments, Complete Trip, CSS, and service-worker strategy remain unchanged.

`freeze-validation.js` composes the existing Engine acceptance with adapter validation and package/runtime checks. The two dependency-free test suites are `engine-integrity.test.js` and `generation-selection-adapter.test.js`.
