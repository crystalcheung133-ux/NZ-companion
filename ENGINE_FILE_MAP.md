# CCMV Travel Engine File Map — Canonical Runtime Map

This document describes the current active architecture after the Stage 7M freeze and Stage 8A-x launch-behaviour update. It is a source-of-truth file map, not a stage changelog.

## Development rule

- Modify the canonical active source listed below.
- Do not restore deleted page copies or duplicate domain logic.
- Do not append a later override when an active implementation already exists.
- Preserve deployed storage keys and record shapes unless an explicit migration is designed.

## Runtime ownership

| Domain | Canonical source | Responsibility |
|---|---|---|
| Application bootstrap | `app-runtime.js` | Dependency validation, readiness state, startup diagnostics and app lifecycle events |
| Shared UI/runtime helpers | `core-runtime.js` | Date helpers, DOM helpers, mini menus, family identity and shared modal behaviour |
| Trip | `trip-runtime.js` | Trip modal, checklist, dashboard readiness and booking read helpers |
| Expenses | `expenses.js` | Expense entry, calculator, split logic, history, settlement, edit/delete and export |
| Moments persistence | `moments.js` | Moments records, planned-activity context, timeline rendering, photos and edit/delete |
| Moments compatibility UI | `moments-compat.js` | Retained freeform capture, mood controls, author compatibility and copy polish |
| Guide and places | `guide-runtime.js` | Guide categories, Shopping Directory, Place rendering, route context and Copy Address |
| Admin mode | `admin.js` | Lee-only Admin state, pending draft, Save, Discard and guarded family switching |
| Currency UI | `currency-runtime.js` | Dashboard exchange-rate lifecycle and converter UI |
| Compatibility entry | `script.js` | Startup compatibility entry only; no domain implementation |
| PWA browser runtime | `pwa.js` | Service Worker registration, passive update state and connection lifecycle events |
| Service Worker | `sw.js` | Cache version, precache, offline fallback and fetch strategies |

## Configuration and services

| File | Responsibility |
|---|---|
| `trip-config.js` | Trip identity/configuration and dynamically generated web-app manifest |
| `data.js` | Canonical itinerary, places, guide order, bookings and stable trip-content IDs |
| `theme-config.js` | Theme tokens and browser theme metadata |
| `asset-config.js` | Active branding and icon filenames |
| `locale-config.js` | Locale and display-language configuration |
| `formatter.js` | User-visible date, time, number, currency, distance and file-size formatting |
| `navigation-config.js` | Canonical page names, query/hash names, fallbacks and allowed return routes |
| `navigation.js` | URL construction, query/hash parsing, safe return validation and navigation helpers |
| `storage-config.js` | Canonical persisted key names, versions and read-only domain grouping |
| `storage.js` | Safe local/session storage access and JSON helpers |
| `money-config.js` | Home currency, FX provider, endpoint and cache policy |
| `money.js` | Amount normalisation, arithmetic helpers, FX cache/fetch and conversion |

## Page shells

| Page | Purpose |
|---|---|
| `index.html` | Home and existing branded splash; Stage 8A-x controls only when it is shown |
| `day.html?day=N` | Shared Day page and timeline editor |
| `place.html?id=PLACE_ID` | Shared Place page |
| `guide.html` | Guide and Shopping Directory shell |
| `trip.html` | Trip overview |
| `itinerary.html` | Itinerary overview |
| `moments.html` | Moments page and capture markup |
| `expenses.html` | Expenses page and form markup |
| `memory.html` | Saved memory layer |
| `offline.html` | Reduced-dependency offline fallback; no feature runtime or interactive family modal |

## Visual and branding assets

| File | Active use |
|---|---|
| `styles.css` | Single production stylesheet and responsive rules |
| `nz-adventure-logo.png` | Splash/primary trip logo via `asset-config.js` |
| `nz-adventure-mark.png` | Header/secondary brand mark via `asset-config.js` |
| `icon-192.png`, `icon-512.png` | Install/PWA icons via `asset-config.js` |

Brand assets must not be redrawn during engine maintenance unless explicitly requested.

## PWA and offline contract

- `sw.js` precaches canonical paths without query strings.
- Runtime requests may include version query strings; cache lookups use `ignoreSearch: true` so these requests resolve to the canonical precached response.
- Navigation is network-first with cached-page/offline fallback.
- Static assets use stale-while-revalidate.
- `offline.html` intentionally loads only the reduced base dependency profile and does not register `pwa.js`.

## Required online runtime order

1. Configuration and service dependencies in `<head>`
2. `data.js`
3. `core-runtime.js`
4. `expenses.js`
5. `moments.js`
6. `trip-runtime.js`
7. `moments-compat.js`
8. `script.js`
9. `guide-runtime.js`
10. `admin.js`
11. `currency-runtime.js`
12. `pwa.js`

Page-specific inline bootstrap may run after its required canonical modules.

## Storage compatibility

- Storage key strings and persisted record shapes remain unchanged.
- `STORAGE.domain(name)` is a read-only grouping over existing keys, not a migration.
- Legacy Moments compatibility reads remain only where required to preserve existing user data.

## Removed paths — do not restore

- Individual Day pages such as `day1.html`, `day2.html`, etc.
- Individual Place pages such as restaurant/hotel-specific HTML files.
- `styles.clean.css`
- `splash-logo.png`
- Static `manifest.json` (manifest data is generated by `trip-config.js`)
- Historical logo names `ccmv-logo-calibrated.png` and `logo-monogram-transparent.png`

## Architecture freeze

Stage 7M module ownership remains frozen. New features must be added to their owning module or to a deliberately created new module with documented load order. Historical stage notes belong in dedicated audit/freeze documents, not in this canonical file map.


## Stage 8A Complete Mode

- `complete-runtime.js` owns the persisted Complete Trip lifecycle and read-only enforcement.
- `storage-config.js` owns the versioned `travel_engine_trip_completion_v1` key.
- Complete Mode preserves all browsing and disables Admin, Checklist, Expenses, and Moments mutation paths.
- Memory Book, Trip Review, and Export remain out of scope for Stage 8B.
