# Travel Engine V2 Architecture — RC22

## Authority chain

```text
Human Master File
        |
        v
MasterFileImporter (RC22)
        |
        v
Canonical Travel Data
        |
        v
Engine Integrity E1–E5 (RC19)
        |
        v
Planning Semantics (RC20)
        |
        v
Generation Selection Adapter (RC21)
        |
        v
Production Companion views
```

Each stage has one owner:

- `masterfile-importer.js` translates human Master File wording into canonical structures.
- `data.js` remains the active shipped trip-data authority.
- `engine-integrity.js` owns structural and planning acceptance.
- `generation-selection-adapter.js` owns immutable production selection.
- Renderers consume production views and do not import Master Files.

The importer does not require, call, copy, or modify downstream authorities. A caller explicitly hands its output to `TravelEngineIntegrity.acceptTripData()` and, only after PASS, to `GenerationSelectionAdapter.rebuild()`.

## Importer stages

### I — Parse

`parse(masterText)` recognizes destination-independent sections in flexible order:

- Trip
- Accommodation / Hotel / Stay
- Restaurant / Café / Dining
- Activity / Attraction / Tour
- Rental / Rental Vehicle
- Flight
- Transport / Transfer
- Notes
- Day N
- Unknown

The dependency-free grammar accepts Markdown headings, plain section labels, `Field: value` lines, bullets, and `---` record separators. Unknown sections, fields, and raw wording are retained for review.

### II — Normalize

`normalize(parsed)` applies exported schema descriptors and aliases. It creates deterministic canonical IDs, normalizes only structural fields, and stores the original record text, fields, notes, tips, and unknown fields in `sourceWording`.

Explicit `planningStatus`, `planningGroupId`, and `planningRole` fields are copied as stated. Planning language embedded in prose is not applied.

### III — Relationship building

`buildRelationships(normalized)` creates canonical collections:

```text
PLACES
CATEGORIES
GUIDE_ORDER
DAY_LINKS
ACTIVITIES
BOOKINGS_DATA
NAVIGATION_ACTIONS
TRIP_DATA
TRIP_ORDER
ITINERARY_DATA
NOTES
CANONICAL_REFERENCES
IMPORT_SOURCE
```

Accommodation creates a Guide place plus accommodation booking. Restaurants create Guide places. Activities remain activity entities and create a place only when the source supplies a location/address. Rental pickup and return bindings remain independent. Flights become standalone flight bookings. Scheduled records create Day relationships where structurally supported.

### IV — Question generation

`generateQuestions(relationshipResult)` reports ambiguity without changing canonical output. Each question contains:

- code and stage;
- affected section/entity/field;
- reason;
- question;
- suggested interpretation;
- confidence.

Question cases include ambiguous planning language, alternative choices, unresolved place classification, missing flight endpoints, missing rental navigation bindings, and unknown sections.

## Public API

```text
MasterFileImporter.import(masterText)
MasterFileImporter.parse(masterText)
MasterFileImporter.normalize(parsed)
MasterFileImporter.buildRelationships(normalized)
MasterFileImporter.generateQuestions(relationshipResult)
MasterFileImporter.formatReport(importResult, options)
```

`import()` returns:

```text
version
canonicalData
config
questions
warnings
statistics
stages
```

Statistics cover entities, bookings, Guide places, activities, itinerary days/items, unresolved questions, and warnings.

## Wording preservation

Display descriptions, notes, and travel tips are copied unchanged. Structural transformations—field aliases, booleans, day numbers, and canonical ID slugs—are deterministic. Explicit IDs that require normalization produce a warning. The importer never rewrites prose to improve tone or content.

## Non-guessing policy

The importer never:

- infers planning status from words such as “maybe,” “preferred,” or “backup”;
- groups alternatives automatically;
- converts named activities into fake places;
- reuses pickup addresses as return navigation;
- fabricates airport endpoints, booking references, addresses, dates, or times;
- repairs data to make downstream validation pass.

Ambiguity is represented by questions. Structural problems remain visible to RC19–20 validation.

## Runtime boundaries

The importer is a generation/tooling module and is not loaded by Companion pages. RC22 changes no Guide, Trip, Navigation, Booking, Export, Admin, Expenses, Moments, sync, CSS, manifest, or service-worker behavior.

`freeze-validation.js` confirms authority isolation and composes existing RC19–21 regression checks. `masterfile-importer.test.js` provides dependency-free translation and handoff tests.
