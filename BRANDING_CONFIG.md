# Trip Branding Configuration — Build 0.2

Trip identity now lives in `TRIP_BRAND` at the top of `data.js`.

Reusable fields:
- `appName`, `shortName`, `navLabel`, `browserTitleSuffix`
- `familyLabel`, `heroLine1`, `heroEmphasis`, `tagline`
- `splashSlogan`, `splashDestination`
- `logo.splash`, `logo.header`, `logo.watermark`, `logo.icon192`, `logo.icon512`
- `storageNamespace`

The New Zealand validation dataset uses a neutral NZ destination mark rather than the CCMV four-friend monogram. UI structure, spacing, animation and navigation are unchanged.

PWA manifest metadata is still a build-time file and must be generated or updated from the same trip brand values when producing another deploy package.
