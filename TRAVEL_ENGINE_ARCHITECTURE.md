# Travel Engine v1.0 — RC14A

The runtime modules are trip-agnostic. Trip-specific identity is owned by configuration/data files:

- `trip-config.js`: trip identity, dates, participants, home labels, guide exclusions, export labels
- `theme-config.js`: visual theme
- `asset-config.js`: logos, icons and cover assets
- `locale-config.js`: locale, timezone and trip currency
- `money-config.js`: home currency and FX settings
- `data.js`: itinerary, guide, trip cards and booking content

To create another Companion, replace those trip-owned files/assets without changing runtime modules. RC14A intentionally preserves all NZ UI and behaviour.
