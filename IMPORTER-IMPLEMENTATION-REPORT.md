# RC22 Master File Importer V1 — Implementation Report

## Outcome

RC22 adds `masterfile-importer.js` as the only Master File translation authority. It is destination-independent, dependency-free, schema-driven, and separate from rendering, Engine acceptance, Planning Semantics, and production selection.

## Architecture

The new pipeline is:

```text
Human Master File
→ MasterFileImporter
→ Canonical Travel Data
→ RC19 Integrity
→ RC20 Planning
→ RC21 Generation Adapter
→ Companion
```

No importer logic was placed in `data.js`, `engine-integrity.js`, `generation-selection-adapter.js`, Guide, Trip, or HTML.

## Import grammar

The parser accepts Markdown or plain-text section headings in flexible order, record headings, `Field: value` pairs, bullet notes, and record separators. Section and field aliases are schema data rather than destination-specific branches.

Supported sections are Trip, Accommodation, Restaurant/Café, Activity/Tour, Rental, Flight, Transport, Notes, Day N, and Unknown.

## Stage implementation

### Parse

Recognizes sections and records while preserving raw lines. Unknown sections/fields are retained and reported.

### Normalize

Creates deterministic canonical IDs and applies structural aliases. Original names, descriptions, notes, tips, fields, unknown fields, and record text remain available in `sourceWording`.

### Relationship building

Creates places, Guide categories/order, Day links, activities, bookings, navigation actions, itinerary days/items, notes, and canonical reference records. Rental pickup/return destinations are independently bound.

### Question generation

Creates structured clarification questions for planning language, alternatives, unknown sections, unresolved activity/place classification, missing flight endpoints, and missing rental navigation bindings. Suggested interpretations are advisory only and are never applied.

## Public API

- `MasterFileImporter.import(masterText)`
- `MasterFileImporter.parse(masterText)`
- `MasterFileImporter.normalize(parsed)`
- `MasterFileImporter.buildRelationships(normalized)`
- `MasterFileImporter.generateQuestions(relationshipResult)`
- `MasterFileImporter.formatReport(result, options)`

## Downstream integration

The importer does not call downstream systems. The tested caller sequence is:

```js
const imported = MasterFileImporter.import(masterText);
TravelEngineIntegrity.acceptTripData(imported.canonicalData, imported.config);
GenerationSelectionAdapter.rebuild(imported.canonicalData, imported.config);
```

If questions remain or Integrity fails, the caller must resolve source data rather than asking the importer to guess.

## Files changed

- `masterfile-importer.js`
- `masterfile-importer.test.js`
- `freeze-validation.js`
- `trip-config.js`
- `VERSION.txt`
- RC22 asset-generation references in active HTML
- `TRAVEL_ENGINE_ARCHITECTURE.md`
- `IMPORTER-IMPLEMENTATION-REPORT.md`
- `IMPORTER-TEST-REPORT.md`

## Canonical data and protected behavior

No New Zealand canonical content or planning decision changed. RC19, RC20, and RC21 implementation files are unchanged. Companion renderers, exports, Admin, Expenses, Moments, sync, CSS, manifest, and service worker are unchanged.

## Known limitations

- V1 is a deterministic text/Markdown importer, not a PDF/DOCX layout extractor or AI prose interpreter.
- It does not geocode addresses or resolve venue names against external services.
- It intentionally leaves incomplete or ambiguous records for questions and downstream validation.
- Trip-card presentation is not synthesized from prose; bookings remain the canonical relationship source.

## Recommended next stage

RC23 could introduce a source-adapter layer for PDF/DOCX extraction that outputs the same V1 text/section contract. It should not change importer, validation, planning, or projection ownership.
