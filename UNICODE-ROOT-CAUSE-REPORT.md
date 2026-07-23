# RC22.1 Unicode Mojibake Root Cause Report

## Outcome

The Unicode regression was present in source bytes before packaging. RC22.1 repairs the source directly, removes all UTF-8 BOMs, and introduces no runtime decoding or replacement layer.

## Exact root cause

BOMless UTF-8 source was read once through the Windows legacy code-page path and then written as UTF-8 with a BOM. The incorrect decode converted original UTF-8 bytes into legacy-code-page characters; the subsequent UTF-8 write made those incorrect characters permanent source literals.

The source-processing pattern was a Windows PowerShell text rewrite that used default input decoding for BOMless files and `Set-Content -Encoding utf8` for output. In Windows PowerShell 5.1, that combination uses the active ANSI-compatible input path when no BOM identifies UTF-8, then writes UTF-8 with `EF BB BF`.

This was a source rewrite failure, not a browser, service worker, HTTP-header, or ZIP encoding failure.

## Byte evidence

Examples of the observed one-pass transformation:

| Intended character | Correct UTF-8 bytes | Corrupted RC21/RC22 UTF-8 bytes |
|---|---|---|
| U+1F9F3 | `F0 9F A7 B3` | `C3 B0 C5 B8 C2 A7 C2 B3` |
| U+00B7 | `C2 B7` | `C3 82 C2 B7` |
| U+00D7 | `C3 97` | `C3 83 E2 80 94` |
| U+2019 | `E2 80 99` | `C3 A2 E2 82 AC E2 84 A2` |

Every one of the 13 affected RC22 files passed an exact proof before repair:

1. map the corrupted Unicode code points back to their legacy byte values;
2. decode those bytes once as strict UTF-8;
3. apply the original legacy decode model again;
4. confirm the result is byte-for-byte identical to the corrupted source text.

No file required a second inverse pass. Therefore the affected literals were decoded/encoded incorrectly once, not repeatedly.

## Baseline comparison

Strict byte/text scans produced:

| Baseline | Text files scanned | Mojibake-affected files | UTF-8 BOM files | Invalid UTF-8 | U+FFFD |
|---|---:|---:|---:|---:|---:|
| RC20 generation baseline | 63 | 0 | 0 | 0 | 0 |
| RC21 | 63 | 12 | 13 | 0 | 0 |
| RC22 | 67 | 13 | 14 | 0 | 0 |
| RC22.1 repaired source | 70 | 0 | 0 | 0 | 0 |

RC21 was already corrupted. The 12 RC21 files with corrupted literals were:

- `day.html`
- `expenses.html`
- `export-runtime.js`
- `guide-runtime.js`
- `index.html`
- `itinerary.html`
- `memory.html`
- `moments.html`
- `place.html`
- `script.js`
- `trip-runtime.js`
- `trip.html`

RC21 also added a BOM to `offline.html`, although that ASCII-only file contained no corrupted literal.

RC22 retained all RC21 corruption and added the same one-pass corruption plus a BOM to:

- `masterfile-importer.test.js`

The RC22 Full Deploy ZIP was compared entry-by-entry with the RC22 source tree: 71 of 71 files were byte-identical, with zero mismatches. Packaging did not transform the content; it shipped the already-corrupted source.

## RC22.1 repaired source files

Fourteen source files received encoding repair:

- `day.html`
- `expenses.html`
- `export-runtime.js`
- `guide-runtime.js`
- `index.html`
- `itinerary.html`
- `masterfile-importer.test.js`
- `memory.html`
- `moments.html`
- `offline.html` — BOM removal only
- `place.html`
- `script.js`
- `trip-runtime.js`
- `trip.html`

All are now strict UTF-8 without BOM.

## Scope protection

- Canonical New Zealand data objects were not edited.
- No wording, planning decision, booking fact, layout, CSS rule, or feature logic was changed.
- RC19 Engine Integrity, RC20 Planning Semantics, RC21 Generation Selection Adapter, and RC22 Master File Importer architecture remain unchanged.
- Guide, Trip, Days, Home, Navigation, Booking, Export, Admin, Expenses, Moments, Sync, Complete Trip, service-worker strategy, and manifest behavior remain unchanged.
- Release metadata and cache-busting references were advanced to RC22.1 so repaired source is fetched.

`TRAVEL_ENGINE_ARCHITECTURE.md` is byte-identical to RC22; no updated architecture deliverable is warranted.

## Prevention

`unicode-regression.test.js` now rejects:

- invalid UTF-8;
- any UTF-8 BOM;
- U+FFFD and C1 controls;
- required mojibake marker families represented internally by code points;
- broader UTF-8-as-Windows-1252 sequence patterns;
- loss of the expected intended Unicode characters.

Future source-processing must read and write with an explicit UTF-8-no-BOM encoding.
