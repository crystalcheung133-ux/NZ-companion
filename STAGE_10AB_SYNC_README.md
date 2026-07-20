# Stage 10A+B — Expenses + Moments Sync

1. Supabase → Authentication → Providers → enable Anonymous Sign-Ins.
2. Supabase → SQL Editor → run `SUPABASE_STAGE_10AB_SYNC_SETUP.sql` once.
3. Deploy the full ZIP.
4. Test on two devices: add/edit/delete an expense and a moment, then press Sync now or reopen the page.

Expenses and Moments are local-first. Offline changes remain on the device and retry when online. Deletes use tombstones so removed records do not reappear. Moment photos are compressed, queued in IndexedDB while offline, then uploaded to the `trip-moments` bucket when online.
