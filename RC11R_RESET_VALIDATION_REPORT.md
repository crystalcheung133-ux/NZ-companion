# NZ Companion — RC11R Reset Validation Report

## Static validation — PASS

- JavaScript syntax: `admin.js` PASS
- JavaScript syntax: `expense-sync-runtime.js` PASS
- JavaScript syntax: `moment-sync-runtime.js` PASS
- One active Admin Reset button and one active Reset handler retained
- Reset pauses Expense and Moment sync before deletion
- Queued sync timers cannot restart while reset is running
- In-flight sync is awaited before cloud deletion
- Expense cloud rows are hard-deleted by trip ID
- Moment cloud rows are hard-deleted by trip ID
- Supabase Storage photos are listed and deleted by trip folder
- Pending Moment photo IndexedDB database is deleted
- Expense/Moment tombstones and sync metadata are cleared
- Cloud snapshot/reload metadata and legacy Moment keys are cleared
- Reload occurs only after successful cloud and local reset
- Failure path preserves local data and reports the error
- Service Worker cache version advanced to RC11R

## Required deployment order

1. Run the updated `SUPABASE_STAGE_10AB_SYNC_SETUP.sql` in Supabase SQL Editor.
2. Deploy the RC11R Full Deploy ZIP.
3. Open the deployed app online and allow the new Service Worker to activate.
4. Perform the device validation matrix below.

## Runtime validation matrix

The code paths are prepared for the following tests, but physical-device/browser execution cannot be performed inside this build environment.

| Platform | Required test | Expected result |
|---|---|---|
| Website desktop | Add expenses, moments and photo; Reset; reload twice | Remains empty |
| Android Chrome | Same test | Remains empty |
| Android installed PWA | Same test; close/reopen PWA | Remains empty |
| iPhone Safari | Same test | Remains empty |
| iPhone installed PWA | Same test; close/reopen PWA | Remains empty |
| Cross-device | Reset on Admin device, then open another device | Cloud-backed trip remains empty |
| Offline attempt | Press Reset while offline | Reset blocked; existing data retained |

## Acceptance criteria

PASS only when all five browser/PWA environments remain empty after reload/reopen and a second device also pulls an empty trip.
