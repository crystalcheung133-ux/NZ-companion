# Version 1.1 Backlog — Do Not Implement Yet

1. Render Guide, Trip and navigation exclusively from data.js.
2. Add generic rental vehicle fields: supplier, model-or-similar, transmission, seats, pickup, drop-off and status.
3. Add structured route fields: origin, destination, distance, estimated duration, route option and road-condition note.
4. Add weather-sensitive metadata to activities and routes.
5. Support traveller groups that change by trip segment or date.
6. Add reusable accommodation type.
7. Namespace localStorage by trip ID rather than destination name.

## Branding build automation

Generate `manifest.json`, PWA icons and service-worker asset lists from `TRIP_BRAND` during packaging so a future destination requires only one source-of-truth edit. Do not implement until Version 1.1.

- Optional generic Drive Briefing schema after post-trip validation. Do not add GPS or automatic arrival detection unless real-world use proves it necessary.
