# CCMV Travel Engine File Map — Stage 4F-T Frozen Master

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
| Moments | localStorage data + canonical Moments module | `moments.html` and shared modal markup; runtime in `script.js` |
| Expenses | localStorage key `expenses` + single canonical Expenses module | `expenses.html`; runtime in `script.js` |
| Visual system | `styles.css` | Single production stylesheet; no `styles.clean.css` |
| PWA cache and offline strategy | `sw.js` | Network-first navigation; stale-while-revalidate static assets |

## Core files

| File | Purpose | Change when |
|---|---|---|
| `data.js` | Canonical trip data and stable IDs | Itinerary, place, booking, guide or trip content changes |
| `styles.css` | All production visual styling and responsive rules | UI-only changes; edit the canonical rule rather than appending another override |
| `script.js` | Shared navigation, modals, state helpers, Moments and the single Expenses module | Behavior or interaction changes |
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
| `sw.js` | Cache version, precache list and fetch strategy | Every deploy that changes cached app files |
| `manifest.json` | PWA metadata | App name, icons or install metadata changes |

## Assets

| File | Active use |
|---|---|
| `ccmv-logo-calibrated.png` | Splash/loading logo |
| `logo-watermark-monogram.png` | Home header and selected watermark treatments |
| `logo-monogram-transparent.png` | Internal-page header logo |
| `icon-192.png`, `icon-512.png` | PWA icons |

Logo assets must not be redrawn during engine maintenance. Resize, crop, placement and CSS treatment are allowed only when requested.

## Intentionally retained compatibility paths

- Moments retains legacy localStorage compatibility reads so existing saved entries remain visible.
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
