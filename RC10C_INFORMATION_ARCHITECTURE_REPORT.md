# RC10C Information Architecture Report

## Scope

1. Day activity editor and Day card now share the same activity-owned text.
2. Booking metadata is no longer appended invisibly to Day cards; it remains in Trip Info.
3. Booking-linked Day activities now expose a contextual **Trip Info** button.
4. Accommodation opens as a compact hotel list, then drills into one individual booking.
5. Flights and Rental Car remain direct cards because their item counts are small.

## Root cause

RC10A.1 appended `BOOKINGS_DATA` fields to the rendered Day card after the editable `item.details` fields. The editor only changed `item.details`, so the visible card contained extra non-editable content. RC10C removes that merge from the Day renderer and restores clear data ownership.

## Files modified

- `day.html`
- `trip-runtime.js`
- `styles.css`
- `sw.js`
- `VERSION.txt`

## Verification

- Day card text equals the Time / Title / Details / Next leg fields in Edit Activity.
- Rental booking number and office contacts remain available under Trip Info → Rental Car.
- Accommodation opens a five-property selector instead of one long booking page.
- Selecting a property opens its room, dates, check-in/out, reference, price, address and instructions.
- Back returns to the accommodation selector.
- Flights and Rental Car still open directly.
