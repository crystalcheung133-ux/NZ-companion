# NZ Guide Card Audit — LUXE2

## Scope

Audited the active Guide list and Trip Info activity-booking Guide route after the Luxe Tours booking update.

## Fixed

- Trip Info → Activities → Luxe Tours → Guide now opens the Luxe Tours place card directly (`place.html?id=milford`) instead of the Guide front page.
- Luxe Tours navigation now points to the supplied hotel pickup location at Lakefront Lodge rather than implying that the family should self-drive to the Milford Sound terminal.
- Commodore Airport Hotel, Peppers Bluewater Resort and The Greedy Cow legacy “confirm live details” audit labels were replaced with verified status after checking current official sources.

## Removed from the Guide list

These records remain available to timeline/navigation logic where required, but no longer appear as standalone Guide cards and no Guide buttons are rendered for them:

- `queenstown-central` — generic city-centre area card with no distinct destination.
- `te-anau` — generic town card duplicating specific Te Anau stays, dining and activities.
- `white-water-rafting` — operator and river product are not selected, so a reliable meeting point or booking guide cannot yet be provided.

## Retained

- Christchurch CBD Discovery Walk, Lake Tekapo Village and Glenorchy / Paradise Scenic Drive are intentional route/area guides with actionable routes or stop information.
- Te Anau Glowworm Caves and Doubtful Sound remain explicit weather-disruption alternatives with identifiable operators/meeting locations.
- Luxe Tours remains the confirmed Day 9 primary activity.

## Verification result

- No active Guide category contains an excluded generic card.
- Address integrity test passes.
- Luxe booking `placeId`, Day 9 timeline link and Guide place ID resolve correctly.
