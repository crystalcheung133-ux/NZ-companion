# How To Update a Trip — Stage 4F-T Frozen Master

Use this guide to turn the Travel Engine master into an updated Companion without recreating HTML pages.

## Default rule: data-only update

For normal trip-content changes, edit `data.js`, bump the cache name in `sw.js`, deploy, and regression-test. Do not create individual Day or Place files.

## Where to update

| Change | Active source | Important notes |
|---|---|---|
| Day timing, titles, descriptions and activity order | `data.js` → `ITINERARY_DATA` | Keep stable activity `id` values whenever possible |
| Multiple guides on one Day activity | Activity data in `ITINERARY_DATA` | Use the documented `guideIds` array; use `showShoppingDirectory` only when the Shopping List button is required |
| Restaurant, shop, spa, attraction or hotel details | `data.js` → `PLACES` | Feeds Place pages, Guide and Day links |
| Guide category membership/order | `data.js` category and guide-order structures | Every place ID must exist in `PLACES` |
| Trip cards such as Stay, Flights and Essentials | `data.js` → `TRIP_DATA` / `TRIP_ORDER` | Do not reproduce Trip content in `script.js` |
| Booking status and references | Booking structures in `data.js` | Keep stable booking IDs |
| Friend labels | `data.js` → `FRIENDS` | Test Choose Friend, Moments and Expenses |
| Pure visual change | `styles.css` | Edit the active rule; do not append a compensating override without tracing the cascade |
| Shared Day rendering/action structure | `day.html` | Required only when data fields alone cannot express the change |
| Shared Place rendering structure | `place.html` | Required only for renderer changes, not place-content edits |
| Behavior, modal or state change | `script.js` | Confirm the canonical function/module before editing |
| Home or splash markup | `index.html` | Styling remains in `styles.css` |
| Cached app files | `sw.js` | Bump `CACHE_NAME` on every deploy patch |

## Stable ID rules

Use lowercase hyphenated IDs and treat them as persistent keys.

Examples:

- Place: `omakase-tiger`
- Activity: `d1-dinner-omakase-tiger`
- Booking: `booking-omakase-tiger`

Changing display text is normally safe. Changing an ID can break Day anchors, Guide links, Moments associations, bookings or stored data.

## Normal update workflow

1. Start from the latest deploy-PASS baseline.
2. Identify the active source before editing.
3. Change the smallest necessary file set.
4. Update the visible Build marker in `script.js`.
5. Bump `CACHE_NAME` in `sw.js`.
6. Deliver a changed-files ZIP unless creating a major master checkpoint.
7. Deploy and verify the visible Build marker before judging the UI.
8. If the live site appears unchanged, stop and check GitHub/Vercel deployment, `/sw.js`, service-worker cache and Active Source before creating another patch.

## Data-update regression

At minimum test:

- `day.html?day=1` through `day.html?day=5`
- Guide → Day anchor for one early and one late activity
- `place.html?id=fusion`, one restaurant, one spa and one shop
- Guide categories and Shopping Directory
- Trip cards
- Moments add/edit/delete
- Expenses shared/personal add, edit, delete, totals and settlement
- PWA close/reopen after the new service worker activates

## Architecture boundary

Ordinary new-trip generation should require replacement of trip data and assets, not changes to HTML structure. Renderer changes are engine changes and must follow `ENGINE_CHANGE_PROTOCOL.md`.
