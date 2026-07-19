# Stage 9A-2 — Supabase Read Sync

This build can read the newest published snapshot from `public.trip_publications`, cache it locally, and hydrate the Companion's static trip datasets before page render. It remains read-only.

## Browser configuration

Open `sync-config.js` and fill the single `project` object:

```js
const project = {
  enabled: true,
  url: 'https://YOUR_PROJECT.supabase.co',
  publishableKey: 'sb_publishable_YOUR_KEY'
};
```

A deployment may alternatively define `window.TRAVEL_ENGINE_SUPABASE` before `sync-config.js` loads. The legacy anon JWT is accepted as `anonKey`. Never use a secret/service-role key.

Without valid values, the app stays in `Local only` mode and every existing local feature continues to work.

## Accepted publication payload

The row must match:

- `trip_id = nz-family-2026`
- `schema_version = 1`
- highest numeric `version`

`payload` may contain the data directly or under `payload.data`. Supported datasets are:

- `places`
- `categories`
- `guideOrder`
- `dayLinks`
- `friends`
- `bookingsData` (or `bookings`)
- `tripData`
- `tripOrder`
- `itineraryData` (or `itinerary`)

Uppercase canonical names such as `PLACES` and `ITINERARY_DATA` are also accepted.

## Runtime behaviour

1. A validated cached snapshot is applied before the page renderers run.
2. On launch, the app checks Supabase for the newest publication.
3. A newer version is cached and causes one controlled reload so the new snapshot can hydrate before rendering.
4. Offline or failed reads fall back to the validated cache, then the bundled static data.
5. The Trip modal displays the current data source/status.

## Scope guard

This stage does **not** upload or synchronize:

- Admin drafts or pending changes
- Expenses
- Moments
- family identity selection

The SQL/RLS setup remains the one in `SUPABASE_STAGE_9A_SETUP.sql`.


## Connected build

RC5.2 is configured for the existing Supabase project and automatically checks `trip_publications` on launch. If the table has no matching publication, the bundled trip remains active.


## RC5.3 safe publication workflow
Trip Studio can now prepare the next immutable publication as a SQL file. The browser does not write with the public key. Save Admin changes, choose **Prepare Cloud Publication**, then run the downloaded SQL in Supabase SQL Editor.
