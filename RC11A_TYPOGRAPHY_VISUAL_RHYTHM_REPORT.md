# RC11A — Typography + Visual Rhythm Polish

## Scope
Visual polish only. No data model, Supabase, sync, booking, expenses or Moments logic changed.

## Changes
- Added shared typography and control tokens at the root.
- Normalised heading scale, title line-height and letter spacing.
- Reduced oversized mobile headings while preserving the editorial serif identity.
- Normalised body, lead, label and supporting-text line-height.
- Standardised button height, padding, internal gap and text alignment.
- Added consistent keyboard focus treatment.
- Normalised first/last-child spacing inside common cards.
- Added a comprehensive reduced-motion fallback.
- Bumped the Service Worker cache key so PWA clients receive the new stylesheet.

## Explicitly unchanged
- Layout structure
- Navigation behaviour
- Admin behaviour
- Moments upload/sync/display logic
- Expenses calculations/sync
- Trip data and itinerary content
