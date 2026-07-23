# Engine Integrity Test Report

## Overall result: PASS

## Automated tests

Command:

```text
node engine-integrity.test.js
```

Results:

| Suite | Passed |
|---|---:|
| E1 canonical entities | 5/5 |
| E2 relationships | 6/6 |
| E3 navigation | 6/6 |
| E4 bookings | 6/6 |
| E5 non-place classification | 5/5 |
| Integrated acceptance/reporting | 4/4 |
| **Total** | **32/32** |

Required negative cases covered:

- duplicate place and itinerary IDs;
- malformed and unresolved entity IDs;
- dangling timeline placeId;
- orphan and unreachable Guide relationships;
- non-place Guide/place actions;
- ambiguous timeline classification;
- missing and cross-bound rental navigation;
- ambiguous multi-depot labels;
- valid same-depot and one-way rentals;
- accommodation, rental, flight, and activity type failures;
- optional booking fields;
- descriptive venue text without auto-classification;
- structured failure report and blocking runtime entry point.

## Production acceptance

`validateTripData(TRAVEL_DATASETS, TRIP_CONFIG)`:

```text
status: PASS
blocking errors: 0
warnings: 0
places: 66
itinerary days: 10
itinerary items: 66
bookings: 7
Guide order entries: 66
non-place items: 11
navigation actions: 2
```

## Freeze and syntax validation

- `node freeze-validation.js`: PASS.
- `node --check` for all JavaScript files: PASS.
- One manifest authority: PASS.
- RC19 release identity and active asset generations: PASS.
- Service Worker production asset existence: PASS.
- Export and Complete Trip entry points: PASS.

## Browser smoke

Served the full project over local HTTP and tested in Chromium:

- Home and canonical day navigation: PASS.
- Itinerary, Trip, Expenses, Moments, and offline shell: PASS.
- Guide menu and Dining category content: PASS.
- Day 1–10: PASS.
- Engine module present on every data-loading page: PASS.
- Core-page browser console errors: 0.

## Protected runtimes

The following files are byte-for-byte unchanged from RC18.2:

`admin.js`, `expenses.js`, `expense-sync-runtime.js`, `moments.js`, `moment-sync-runtime.js`, `moments-compat.js`, `export-runtime.js`, `complete-runtime.js`, `sync-runtime.js`, `publication-runtime.js`, `reset-runtime.js`, and `styles.css`.
