# CCMV Travel Engine File Map — Stage 7K-1 App Runtime Bootstrap

This is the maintained architecture map for the reusable Travel Engine master. Edit the active source listed below; do not recreate deleted page copies or add a later override when a canonical source already exists.

## Active source map

| Area | Canonical source | Render / runtime path |
|---|---|---|
| Trip, places, itinerary, guide order, friends and bookings | `data.js` | Read by shared pages and `script.js` |
| Home shell and splash markup | `index.html` | Styled by `styles.css`; common behavior from `script.js` |
| All trip days | `data.js` → `ITINERARY_DATA` | `day.html?day=N`; page-specific bootstrap is inline in `day.html` |
| All place guides | `data.js` → `PLACES` | `place.html?id=...`; page-specific bootstrap is inline in `place.html` |
| Guide categories and Shopping Directory | `data.js` category/order structures | `guide.html` + canonical guide functions in `script.js` |
| Trip cards | `data.js` → `TRIP_DATA` / `TRIP_ORDER` | `trip.html` + `script.js` modal renderer |
| Moments | Storage key ownership in `storage-config.js`; access through `storage.js`; canonical Moments module in `script.js` | `moments.html` and shared modal markup |
| Expenses | Storage key ownership in `storage-config.js`; access through `storage.js`; storage access plus canonical Expenses page runtime in `expenses.js` | `expenses.html`; shared shell behavior remains in `script.js` |
| Visual system | `styles.css` | Single production stylesheet; no `styles.clean.css` |
| App bootstrap and readiness | `app-runtime.js` | Shared dependency validation, startup state, error capture and app-ready lifecycle |
| PWA registration and lifecycle | `pwa.js` | Shared Service Worker registration plus non-invasive ready/update-ready events |
| PWA cache and offline strategy | `sw.js` | Network-first navigation; stale-while-revalidate static assets |

## Core files

| File | Purpose | Change when |
|---|---|---|
| `data.js` | Canonical trip data and stable IDs | Itinerary, place, booking, guide or trip content changes |
| `styles.css` | All production visual styling and responsive rules | UI-only changes; edit the canonical rule rather than appending another override |
| `navigation-config.js` | Canonical page filenames, navigation query names, hashes, fallbacks and permitted return pages | Navigation ownership changes only; keep route behavior unchanged |
| `script.js` | Shared UI rendering, navigation modals, common state helpers and Moments runtime | Shared behavior or interaction changes |
| `expenses.js` | Canonical Expenses form, calculator, split, history, settlement, edit/delete and export runtime | Expenses behavior changes |
| `storage-config.js` | Canonical browser-storage key names and versions | Storage key ownership changes only; preserve deployed key values unless a migration is designed |
| `storage.js` | Safe local/session storage access (`get`, `set`, `remove`, JSON read/write and key enumeration) | Browser-storage access behavior changes |
| `money-config.js` | Canonical home currency, FX provider, endpoint and cache policy | Money/FX configuration changes only |
| `money.js` | Currency resolution, FX cache access, freshness checks, rate fetching, amount normalisation and conversion | Money service behavior changes |
| `index.html` | Home page and splash markup | Home/splash structure changes |
| `day.html` | Shared Day shell and inline Day renderer bootstrap | Day rendering structure or action-button behavior changes |
| `place.html` | Shared Place shell and inline Place renderer bootstrap | Place rendering structure changes |
| `guide.html` | Guide shell and Shopping Directory container | Guide page structure changes |
| `trip.html` | Trip overview shell | Trip page structure changes |
| `itinerary.html` | Itinerary overview shell | Overview structure changes |
| `moments.html` | Moments page and modal markup | Moments page structure changes |
| `expenses.html` | Expenses page and modal markup | Expenses page structure changes |
| `memory.html` | Memory / saved-notes layer | Memory structure changes |
| `offline.html` | Offline fallback | Offline message/layout changes |
| `app-runtime.js` | Shared app bootstrap, dependency validation, readiness state and startup error capture | App startup contract or lifecycle behavior changes |
| `pwa.js` | Shared Service Worker registration and passive lifecycle events | Registration/update-detection behavior changes |
| `sw.js` | Cache version, precache list and fetch strategy | Every deploy that changes cached app files |
| `manifest.json` | PWA metadata | App name, icons or install metadata changes |

## Assets

| File | Active use |
|---|---|
| `ccmv-logo-calibrated.png` | Splash/loading logo |
| `logo-monogram-transparent.png` | Internal-page header logo |
| `icon-192.png`, `icon-512.png` | PWA icons |

Logo assets must not be redrawn during engine maintenance. Resize, crop, placement and CSS treatment are allowed only when requested.

## Intentionally retained compatibility paths

- Moments retains legacy key compatibility reads through `storage.js` so existing saved entries remain visible.
- Two local functions named `currentUser()` exist in separate Moments and Expenses scopes; they do not override each other.
- Day and Place page-specific render bootstraps remain inline in `day.html` and `place.html`. This is the current documented architecture, not a stale duplicate path.
- Existing visual `!important` declarations are not automatically dead. Remove one only after proving the active cascade and completing a visual pilot.

## Removed legacy files and paths

Do not restore:

- `day1.html` through `day5.html`
- individual place HTML pages such as `fusion.html`, `lune.html`, etc.
- `styles.clean.css`
- `splash-logo.png`

Active routes are only:

- `day.html?day=N`
- `place.html?id=PLACE_ID`

## Frozen master checkpoint

**CCMV Travel Engine Master — Stage 4F Cleanup Complete / Stage 4F-T Frozen Baseline**

This package contains 23 maintained files: 20 runtime/asset files and 3 core maintenance documents. It contains no stage reports, audit reports, cleanup reports, backup files or temporary files.

- `navigation.js` — thin navigation access layer for URL building, query/hash parsing, safe return validation and page transitions.

## Stage 7G-3 — Navigation Runtime Cleanup

- `navigation.js` now owns active current-location, decoded-hash and same-origin-referrer reads.
- Dynamic Day and Place URL construction routes through `NAVIGATION.build()` / `NAVIGATION.goPage()`.
- Guide place buttons no longer assign `location.href` directly.
- Static declarative `<a href>` links remain unchanged by design.
- Browser history, modal close behavior and Admin pending protection are unchanged.
- `formatter.js` — canonical locale-aware date, time, number, currency, distance and file-size formatting access layer.

## Stage 7I-1 — Money Service Extraction

- `money.js` is the canonical Money Service for trip/home currency resolution, FX cache keys, cached rate access, cache freshness checks, provider requests, amount normalisation and bidirectional conversion.
- `money-config.js` now contains configuration only. The pre-7I `getFxCacheKey()` global remains available as a compatibility alias from `money.js`.
- The Home currency UI in `script.js` only applies service results and updates the DOM; it no longer owns FX cache, provider URL, parsing or conversion logic.
- Existing behavior is preserved: cached rates render immediately, then the app requests the latest daily reference rate; offline fallback continues to use the last saved rate.

### Money runtime
- `money-config.js` owns home currency, FX provider, endpoint, cache duration and supported currency settings.
- `money.js` is the single Money Service for amount normalisation, arithmetic helpers, FX cache access, rate fetching and conversion.
- Expenses retain their family split and settlement rules in `expenses.js`, but amount parsing, totals, equal shares, custom remainders and tolerance checks call `MONEY`.
- `formatter.js` remains the sole owner of user-visible numeric formatting.

## Stage 7J-1 — PWA Runtime Foundation

- `pwa.js` is the canonical browser-side PWA runtime for Service Worker capability detection, versioned registration and passive lifecycle events.
- Nine online app pages load `pwa.js`; duplicated inline registration blocks were removed.
- The runtime dispatches `travelengine:pwa-ready` after successful registration and `travelengine:update-ready` when an installed update is waiting. It does not reload the page, skip waiting or change the browser history.
- `sw.js` remains the sole owner of install, activate, cache and fetch strategy. The offline fallback page intentionally remains registration-free.

## Stage 7J-2 — PWA Runtime Adoption & Update Flow

- `pwa.js` is the single runtime owner for Service Worker registration state, browser online/offline state, passive update-ready state and PWA lifecycle events.
- Runtime state is available through `PWA.getState()`, `PWA.isOnline()` and `PWA.hasUpdate()`.
- `PWA.checkForUpdate()` requests a registration update without forcing activation or reload.
- `PWA.clearUpdateReady()` only clears the app-side acknowledgement state; it does not call `skipWaiting` or alter the Service Worker lifecycle.
- The document root reflects non-visual state through `data-pwa-supported`, `data-pwa-ready`, `data-connection` and `data-update-ready` attributes for future UI adoption.
- Lifecycle events are `travelengine:pwa-ready`, `travelengine:update-ready`, `travelengine:pwa-state-change` and `travelengine:connection-change`.
- `sw.js` remains the only owner of install, activate, cache and fetch strategy. Stage 7J-2 adds no update prompt and performs no automatic reload.

## Stage 7K-1 — App Runtime Bootstrap

- `app-runtime.js` is the canonical shared bootstrap for app version exposure, page detection, dependency validation, app-ready state and non-fatal startup error capture.
- All ten HTML pages load the runtime first in `<head>` so later script failures can be observed without changing existing page initialization order.
- Existing `DOMContentLoaded` handlers remain intact. `travelengine:app-ready` is deferred until those handlers have completed their synchronous startup work.
- Runtime state is available through `APP_RUNTIME.getState()` and `APP_RUNTIME.whenReady()`. Manual validation is available through `APP_RUNTIME.validateDependencies()`.
- The document root reflects non-visual state through `data-app-runtime`, `data-app-ready`, `data-app-valid`, `data-app-page` and `data-app-version`.
- Lifecycle events are `travelengine:app-bootstrap`, `travelengine:app-ready` and `travelengine:app-error`. Missing dependencies or captured errors are reported as state; the runtime does not redirect, reload or replace existing page behavior.
- The offline page uses the reduced base dependency profile and remains Service Worker registration-free.

## Stage 7K-2A page boundary

- `expenses.js` owns the existing canonical Expenses workflow and compatibility globals used by HTML onclick handlers.
- `script.js` no longer owns Expenses form, calculator, split, settlement, history, edit/delete or export implementation.
- `expenses.js` loads before `script.js`; its DOM-ready startup runs only after the shared helpers and trip data have loaded.
- Storage keys, stored expense schema, Money service calls, formatter output and UI markup are unchanged.

## Stage 7K-2D — Moments Page Boundary

- `moments.js` is the canonical owner of Moments capture, planned-activity context, photo prototype processing, Moments edit/delete/render handlers, and the existing latest-expense mini-card compatibility renderer.
- `script.js` retains shared shell helpers and page-neutral UI utilities; it no longer contains the canonical Moments implementation.
- Existing global handler names, localStorage keys, Moments schemas, photo prototype behaviour, and Expenses mini-card output remain unchanged.
- Online pages load `data.js`, `expenses.js`, `moments.js`, then `script.js`; `offline.html` does not load feature modules.


## Stage 7K-2D — Admin Runtime Boundary

- `admin.js` is the canonical owner of Admin Mode state, Lee-only access, pending draft persistence, Save/Discard actions, Admin lifecycle events, and the `setFriend()` guard wrapper.
- `admin.js` must load after `script.js` because it intentionally wraps the shared `setFriend()` API.
- `script.js` no longer contains the canonical Admin Mode implementation.
- Storage keys and Admin behaviour are unchanged.


## Stage 7K-2D — Guide & Place Module Boundary

- `guide-runtime.js` is the canonical owner of Guide category/modal flow, Day-to-Guide navigation context, Shopping Directory hash view, Place detail/group rendering, and guide address copy behavior.
- `script.js` retains shared DOM/menu helpers, friend selection, Trip modal, checklist/dashboard, booking helpers, and Home currency runtime.
- Load order is `script.js` → `guide-runtime.js` → `admin.js`; the Guide module intentionally consumes shared helpers created by `script.js`.
- Existing global handler names and HTML onclick contracts are unchanged.

## Stage 7M architecture freeze (2026-07-18)

Runtime ownership is frozen as follows:

- `app-runtime.js`: application bootstrap, readiness and startup diagnostics.
- `core-runtime.js`: shared date, DOM, menu and family identity helpers.
- `trip-runtime.js`: checklist, trip modal, dashboard and booking read helpers.
- `expenses.js`: canonical Expenses domain runtime.
- `moments.js`: canonical Moments persistence and timeline runtime.
- `moments-compat.js`: retained Moments/freeform UI compatibility and copy polish.
- `guide-runtime.js`: Guide and Place navigation/rendering.
- `admin.js`: Admin mode, pending draft, Save and Discard ownership.
- `currency-runtime.js`: dashboard exchange-rate UI lifecycle.
- `script.js`: compatibility entry only; it contains no domain implementation.
- `storage-config.js`: immutable storage key values plus read-only domain grouping.
- `storage.js`: safe local/session access plus non-breaking `STORAGE.domain(name)` access.

Storage key strings and persisted record shapes remain unchanged. New domain groupings are aliases over the existing canonical keys, not migrations.
