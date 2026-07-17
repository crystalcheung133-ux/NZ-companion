# Engine Validation — New Zealand Build 0.1

## Scope
22–25 September 2026: international arrival, rental-car pickup, four accommodation types, multi-stop self-drive, weather-sensitive alpine walk, dining recommendations and three-family meet-up.

## Reused unchanged
- Shared Home, Day, Place, Moments and Expenses shells
- Stable place/day/booking IDs
- Timeline item renderer
- Guide and Trip modal system
- Local Moments and Expenses storage
- PWA/offline architecture

## Engine limitations observed
1. Guide, Trip and navigation contain static HTML snapshots in addition to data-driven modals.
2. Traveller count changing from 4 to 11 on 25 Sep is not a date-effective schema field.
3. Drive distance, estimated duration, fuel and road-condition metadata are display text rather than structured fields.
4. Weather dependency is expressed in notes only.

## Result
Deployable without UI redesign. Core timeline/place/booking model is reusable, but the engine is not fully data-only yet.

## Validation #006 — Trip Branding

**Result: PASS WITH BUILD-TIME CAVEAT**

- Header, splash and home identity can now be bound from `TRIP_BRAND`.
- Traveller-group-specific CCMV logo is no longer used by the NZ dataset.
- Logo assets are selected by dataset configuration without UI redesign.
- `manifest.json` remains build-time metadata and cannot be changed by browser JavaScript after installation.

## Validation Build 0.3 — Trip Identity
- PASS: New trip logo can replace the Vietnam/CCMV identity without redesigning the UI.
- PASS: A high-energy NZ palette can be applied through shared CSS variables and identity assets.
- PASS: Moments and Expenses can use family-level identities (Lee Family / Fowlers / Yau).
- BACKLOG: Rental car information is usable in Trip and Days, but a generic Transport Guide card remains a Version 1.1 item.


## Build 0.3A
- Circular adventure badge now renders without a splash tile.
- Home and Moments use a stronger alpine blue / forest green / orange identity.
- User labels simplified to Lee, Fowlers and Yau.
- Confirmed flight numbers, terminals, duration, aircraft, references and return seats loaded.

## Validation 0.4A — Road-trip experience
- Added static daily drive briefing cards for 22–25 September.
- Added distance, wheel time, road type, planned stops, route notes and one-tap Google Maps routes.
- Added Crown Range backup route via Cromwell.
- No GPS tracking, background location, arrival detection or real-time alerts.
- The Companion remains a pre-drive and between-stop guide; Google Maps remains the navigation tool.

## Validation Stage 6A-5 — Admin Draft Integrity

**Result: PASS — device regression required before freeze**

- PASS: Edit, Add, Duplicate, Delete and Move share one pending draft model.
- PASS: Cross-page navigation does not automatically save or discard.
- PASS: Save is the only itinerary commit point.
- PASS: Discard restores the last committed/original itinerary state.
- PASS: Cross-day move records both source and destination day arrays in one draft.
- PASS: New and duplicated activities use independent IDs.
- PASS: Moments and Expenses storage remain outside the Admin itinerary transaction.
- NOTE: Final iPhone/PWA regression remains a manual deployment check.

## Validation v1.0 — Frozen Admin Core

**Result: PASS — FROZEN BASELINE**

- PASS: Admin Edit, Move, Add, Duplicate and Delete completed device regression.
- PASS: Pending edits persist across pages without automatic commit.
- PASS: Save Changes is the only itinerary commit point.
- PASS: Discard restores the complete last committed itinerary state.
- PASS: Moments and Expenses remain outside the Admin itinerary transaction.
- PASS: PWA build marker and service-worker cache moved to `nz1.0-frozen`.
- FREEZE: This package is the rollback baseline for all Stage 7 development.
- RULE: Future development must branch from this package and use a new version/cache identifier; never silently alter this frozen archive.
