# Travel Engine V2 Architecture — RC19

## Authority model

Trip-specific identity and content remain owned by the existing canonical files:

- `trip-config.js`: trip identity, dates, participants, release identity, Guide exclusions, and export labels.
- `theme-config.js`, `asset-config.js`, `locale-config.js`, `money-config.js`: visual, asset, locale, and currency configuration.
- `data.js`: canonical places, itinerary, Guide relationships, bookings, Trip cards, and navigation-bearing booking fields.

The runtime modules remain trip-agnostic. A Vietnam or Japan Companion can replace the trip-owned data/configuration without copying validation rules.

## Engine integrity flow

```text
Canonical trip data + trip configuration
                    |
                    v
        engine-integrity.js
   E1 -> E2 -> E3 -> E4 -> E5
                    |
          +---------+---------+
          |                   |
        PASS                 FAIL
          |                   |
 structured result     structured result
 runtime acceptance    TravelEngineIntegrityError
 renderer/generator    readable failure report
```

`engine-integrity.js` is the single implementation of Engine structural rules. It has no DOM, storage, network, NZ-specific ID, venue, address, or day dependency.

## Public API

```text
TravelEngineIntegrity.validateE1(data, config)
TravelEngineIntegrity.validateE2(data, config)
TravelEngineIntegrity.validateE3(data, config)
TravelEngineIntegrity.validateE4(data, config)
TravelEngineIntegrity.validateE5(data, config)
TravelEngineIntegrity.validateTripData(data, config)
TravelEngineIntegrity.acceptTripData(data, config)
TravelEngineIntegrity.formatValidationReport(result, options)
```

- `validateTripData` returns the machine-readable acceptance result.
- `acceptTripData` returns that result on PASS and throws `TravelEngineIntegrityError` with the same structured result on FAIL.
- `formatValidationReport` produces Markdown by default or plain text with `{format: 'text'}`.

## Runtime acceptance

Every production page that loads `data.js` first loads `engine-integrity.js`. After `data.js` constructs the existing `TRAVEL_DATASETS` authority, it calls `acceptTripData(TRAVEL_DATASETS, TRIP_CONFIG)`. Invalid structural data therefore produces a blocking error before downstream rendering/generation logic can treat the dataset as accepted.

The successful result is exposed as `TRAVEL_ENGINE_ACCEPTANCE`. No second trip schema or repaired data copy is created.

## Node/static acceptance

`freeze-validation.js` loads the same module and calls `validateTripData`. It adds only release/package/presentation gates, such as asset existence, RC19 release identity, manifest authority, Service Worker assets, renderer suppression, and protected entry points. It does not reimplement E1–E5.

`engine-integrity.test.js` is dependency-free and executes in Node.

## Booking and navigation schema

Existing booking records remain canonical. Type-specific validators read the fields relevant to each booking type.

Rental bookings use independent canonical roles:

- `pickupDepotAddress`
- `pickupNavigationDestination`
- `returnDepotAddress`
- `returnNavigationDestination`
- optional `shuttleCollectionAddress`
- `sameDepot` or `oneWay` where applicable

Legacy fields remain readable for backward compatibility, but validation never substitutes one role for another.

## Non-place records

`nonPlace: true` is the canonical compatible classification mechanism. `nonPlaceRole` is an optional registered role that improves deterministic reporting without requiring a second hierarchy. Non-place records may retain instructions, time, notes, type, and route context, but cannot contain place/Guide/address/map/navigation actions.

## Failure policy

- `error`: blocking structural defect; overall acceptance is FAIL.
- `warning`: non-blocking ambiguity or unsupported optional extension requiring review.
- optional commercial booking details are not required unless the current type model declares them structural.

Validation is read-only. It never fabricates fields, rewrites data, opens map services, creates places, or silently classifies descriptive text.
