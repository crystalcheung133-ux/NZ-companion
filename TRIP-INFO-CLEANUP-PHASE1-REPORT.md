# Trip Info Cleanup Phase 1

Baseline: NZ-Companion-Stage3.2H-PORT1-GUIDE-TABS1-Full-Deploy.zip

## Scope
Cleanup only. No visible UI, wording, booking content, permissions, Guide, Timeline, Expense, Studio, sync or storage behaviour was changed.

## Safe cleanup completed

1. Consolidated duplicated booking access into shared helpers:
   - `getBookingById()`
   - `getBookingsByType()`
2. Accommodation and Activity lists now use the same typed booking source instead of maintaining separate lookup implementations.
3. Removed booking-ID presentation rules from runtime:
   - Archway display status now comes from `BOOKINGS_DATA.displayStatus`.
   - Queenstown Airbnb and Lakefront Lodge reference labels now come from `BOOKINGS_DATA.referenceLabel`.
4. Removed the empty historical CSS selector `.trip-modal.show~#tripMenu.show {}`.
5. Updated asset cache versions and service-worker cache name.

## Intentionally not changed

- Trip Info menu structure and category order
- Flights and Rental Car card markup
- Accommodation and Activities card appearance
- Luxe Tours details and family totals
- Checklist and Emergency content
- Place/Guide data duplicated for current Guide compatibility
- Booking Coordination editing or collaboration features

## Result
Trip Info retains the same rendered content while booking lookup and booking-specific presentation metadata now have clearer ownership.
