# RC10D — Day Operational Content Refactor

## Purpose

Day is now an operational briefing rather than a travel description.

Information remains on Day only when it affects the current day's timing, preparation, navigation, booking, safety or decisions. Descriptive recommendations, attraction summaries and review-style wording remain in Guide.

## Changes

- Reviewed and rewrote all 59 Day activity cards.
- Removed promotional, atmospheric and review-style sentences from Day.
- Removed empty filler such as “enjoy”, “relax”, “famous”, “easy family meal” and scenic descriptions.
- Retained advance warnings that prevent disruption, including:
  - Rental-car shuttle instructions.
  - Check-in/check-out deadlines.
  - Booking and pre-booking requirements.
  - Weather dependence and clothing preparation.
  - Suggested duration where it controls the route.
  - Safe stopping and signed-parking reminders.
  - Airport and return-car buffers.
- Activities with no genuine same-day operational note now use an empty details list; the existing renderer hides the notes area rather than generating filler.
- Updated itinerary schema examples so new trips follow the same standard.

## Content ownership

- **Day:** what must be known today to keep the itinerary running.
- **Guide:** reasons to visit, reviews, highlights, food suggestions and destination context.
- **Trip Info:** booking references, room type, price, addresses, contacts and confirmation details.

## Scope

Data/content only. No layout, styling, navigation, booking structure or sync behaviour was changed.
