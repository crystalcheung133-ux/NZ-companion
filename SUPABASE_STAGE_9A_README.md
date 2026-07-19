# Stage 9A-1 — Supabase Sync Foundation

This build is **cloud-aware but local-first**. It does not upload, overwrite or migrate existing itinerary, Expenses or Moments data.

## Configure

1. Create a Supabase project.
2. Run `SUPABASE_STAGE_9A_SETUP.sql` in the SQL Editor.
3. Open `sync-config.js` and set:
   - `enabled: true`
   - `url: 'https://YOUR_PROJECT.supabase.co'`
   - `anonKey: 'YOUR_ANON_KEY'`
4. Deploy the complete package.

Until all three values are valid, `TRIP_SYNC` remains in `local-only` status and the Companion works exactly as before.

## Runtime contract

- `TRIP_SYNC.getState()` returns the current cloud state.
- `TRIP_SYNC.fetchLatestPublished()` reads the newest matching published snapshot.
- Successful responses are cached in `travel_engine_cloud_snapshot_v1`.
- Offline or failed requests fall back to that cache, then to the existing static/local app data.
- Stage 9A-1 does not automatically hydrate the UI from cloud data and does not publish data. Those are deliberately deferred to Stage 9A-2.

## Security

The SQL creates only an anonymous SELECT policy. There is no anonymous write policy. Never place a Supabase service-role key in this app.
