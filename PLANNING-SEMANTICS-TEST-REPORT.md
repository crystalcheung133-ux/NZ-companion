# Planning Semantics Test Report

## Overall result: PASS

## Automated suite

Run:

```text
node engine-integrity.test.js
```

| Suite | Result |
|---|---:|
| E1 canonical entities | 5/5 |
| E2 relationships | 6/6 |
| E3 navigation | 6/6 |
| E4 bookings | 6/6 |
| E5 non-place classification | 5/5 |
| RC20 Planning Semantics | 14/14 |
| Integrated acceptance/reporting | 4/4 |
| **Total** | **46/46** |

## Planning cases

Passed:

- valid canonical status;
- omitted status retains RC19 behavior;
- invalid status failure;
- duplicate primary failure;
- duplicate confirmed failure;
- required group missing primary failure;
- optional record retains Guide/booking/navigation relationships;
- unselected optional booking does not inherit active requirements;
- cancelled record remains editable/searchable but is production-ineligible;
- cancelled active record failure;
- cancelled booking is deferred from active-booking requirements;
- backup → confirmed promotion and full revalidation;
- alternative → primary replacement without duplicate primary;
- conflicting confirmed promotion rejected without mutation.

## RC19 regression dataset

```text
status: PASS
blocking errors: 0
warnings: 0
canonical planning statuses: 0
planning groups: 0
```

Zero planning records is the expected backward-compatible result. Existing NZ `status` fields were not silently converted.

## Release validation

- `node freeze-validation.js`: PASS.
- All JavaScript files passed `node --check`.
- Active release identity: RC20 / Planning Semantics Layer.
- Existing manifest and Service Worker strategies remain unchanged.
- All production asset references resolve.

## Protected behavior

Hash comparison against the RC19 baseline confirms no changes to:

- `data.js`
- `admin.js`
- Expenses and expense sync runtimes
- Moments, compatibility, and moment sync runtimes
- exports
- Complete Trip
- sync/publication/reset runtimes
- Guide and itinerary rendering runtimes
- Service Worker
- CSS
