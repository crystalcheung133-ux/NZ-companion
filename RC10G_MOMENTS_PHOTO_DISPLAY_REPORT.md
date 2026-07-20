# RC10G — Moments Photo Display Consistency

## Root cause
The shared Moment image rule used `object-fit: cover` together with a `max-height`, so wider desktop cards cropped the uploaded image while mobile happened to show a squarer composition.

## Changes
- Replaced cropped Moment display with intrinsic image sizing.
- Moment photos now use `width: 100%`, `height: auto`, and `object-fit: contain`.
- Removed the desktop height cap that forced cropping.
- Kept the existing rounded corners and shadow.
- Added a neutral backing surface for unusually narrow or transparent images.
- Updated the service-worker cache key so installed PWAs receive the CSS change.

## Scope
Display only. No upload, sync, Supabase, Storage, or Moment data logic was changed.

## Validation
Check square, portrait, and landscape photos on desktop browser and installed mobile PWA. The same full composition should be visible on both.
