# Guide Tabs & Cleanup Report

## Baseline
NZ-Companion-Stage3.2H-PORT1-FRONT-CLEANUP1-LUXE-RESTORED

## Implemented
- Replaced the combined `SIGHTS & ACTIVITIES` Guide menu entry with two entries:
  - `🍃 SIGHTS`
  - `🎟️ ACTIVITIES`
- Preserved Dining and Stay categories unchanged.
- Reclassified participatory attractions:
  - Puzzling World → Activities
  - Wānaka Lavender Farm → Activities
- Removed the following from Guide categories and Guide browse order:
  - Queenstown Central (generic city card)
  - Te Anau (generic town card)
  - White Water Rafting (operator and meeting point not selected)

## Data Safety
The three removed Guide records remain in `PLACES` because Timeline and route items still reference them. They remain in `TRIP_CONFIG.guide.excludedPlaceIds`, so Timeline does not expose invalid Guide buttons.

## Not Changed
- Guide Card content
- Luxe Tours booking and Guide
- Day Timeline and itinerary
- Place addresses and navigation
- Dining and Stay categories
- Front Page cleanup
- Expenses, Studio, storage, sync and Supabase
