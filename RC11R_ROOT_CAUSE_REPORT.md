# NZ Companion — RC11R Root Cause Report

## Root cause

The active Admin Reset flow in `admin.js` only removed selected `localStorage` keys and reloaded the page. It did not interact with either cloud sync runtime.

After reload, `expense-sync-runtime.js` and `moment-sync-runtime.js` initialized normally, pulled all rows for `trip_id = nz-family-2026` from Supabase, selected the remote records as the only surviving copies, and wrote them back into local storage. This was the exact restore point.

A second persistence path existed for Moments photos: pending photo blobs remained in IndexedDB database `travel_engine_moment_photos_v1`, while uploaded files remained in Supabase Storage bucket `trip-moments`. These were outside the original Reset scope.

The deployed Stage 10A+B SQL also granted only select/insert/update. It contained no DELETE grants or RLS policies for `trip_expenses`, `trip_moments`, or matching Storage objects, so a complete cloud reset was not authorised.

## Active repair

The existing Reset handler was replaced directly; no second Reset flow was added.

1. Verify Lee Admin Mode and no pending Studio edits.
2. Require an online connection.
3. Pause both active sync runtimes and cancel queued sync timers.
4. Wait for any in-flight sync to finish.
5. Delete all Supabase expense rows for the trip.
6. List and delete all trip photo objects from `trip-moments/nz-family-2026/`.
7. Delete all Supabase moment rows for the trip.
8. Delete the pending-photo IndexedDB database.
9. Clear local records, tombstones, sync metadata, cached cloud snapshots and legacy Moment keys.
10. Reload only after every destructive cloud/local step succeeds.

If any cloud step fails, local data is deliberately not cleared and the app shows the failure. This prevents a partial reset followed by cloud restoration.

## Database requirement

`SUPABASE_STAGE_10AB_SYNC_SETUP.sql` now includes DELETE grants and trip-scoped DELETE policies. This SQL must be applied to the connected Supabase project before testing Reset Data.

## Files changed

- `admin.js`
- `expense-sync-runtime.js`
- `moment-sync-runtime.js`
- `SUPABASE_STAGE_10AB_SYNC_SETUP.sql`
- `sw.js`
- `VERSION.txt`
