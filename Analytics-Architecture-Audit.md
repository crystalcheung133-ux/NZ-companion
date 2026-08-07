# NZ Companion RC25.2.5 — Source Architecture Audit

## Identity / PIN
- Traveller identity is the existing family selector stored under `nz_friend`: `lee`, `fowlers`, `yau`.
- Party config maps these to Lee/MEL, Fowlers/SYD and Yau/NTL.
- Trip Studio is PIN protected (`TRIP_CONFIG.admin.pin`) and its unlock is session-scoped. Studio access is intentionally independent of the currently selected family.
- `isAdminMode()` is therefore the correct signal for separating admin/development analytics from traveller analytics.

## Supabase
- One shared official `@supabase/supabase-js` v2 client is owned by `supabase-client-runtime.js`.
- It restores or creates an anonymous Supabase Auth session and is reused by sync modules.
- Existing cloud domains are Publications, Expenses, Moments and Generation. Analytics v1 adds a separate `trip_analytics_events` table only.

## Offline / local storage
- `storage-config.js` owns stable browser storage keys; `storage.js` wraps safe local/session storage access.
- Expenses use local records + tombstones + sync metadata; Moments use local records plus IndexedDB for pending photos.
- Analytics follows this architecture with a bounded localStorage event queue and sessionStorage session id.

## Pages / navigation
- Root pages include Home (`index.html`), Days (`itinerary.html` and `day.html`), Guide/Place, Trip, Expenses, Moments/Memory.
- Shared bottom navigation exposes Trip, Guide, Days, Moments and Expenses.
- `navigation.js` owns canonical page building/go/return routing and standalone-PWA cold entry handling.

## Guide behaviour
- `guide-runtime.js` centrally owns Guide category opens, Guide card opens, alternatives/options, Guide→Booking and Guide→Day links.
- Guide navigation context is session-persisted so Place details can return to the originating Guide/Day state.

## Booking / Expenses / Moments
- `trip-runtime.js` owns Trip Essentials / booking cards and individual accommodation/activity details.
- `expenses.js` owns the canonical expense modal and CRUD behaviour; `expense-sync-runtime.js` owns cloud sync.
- `moments.js` owns Moment UX; `moment-sync-runtime.js` owns rows, photos, offline retry and cloud sync.

## Studio/Admin
- `admin.js` owns PIN unlock, Admin Mode, Studio shell and `isAdminMode()`.
- Analytics uses this runtime signal and labels those events `actor_type='admin'` so traveller reports can exclude them.

## Service worker/cache
- `sw.js` precaches runtime/page assets, uses network-first for CSS/JS, navigation validation/fallback for HTML, and cache-first for media.
- Analytics runtime is added to the precache list. No service-worker fetch path depends on analytics writes.
