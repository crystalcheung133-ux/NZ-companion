# Theme Preview Studio v1 — Regression / CI Report

## Automated validation

- Existing full CI suite: PASS after release manifest/checksum regeneration.
- JavaScript syntax: PASS for all project JavaScript files, including the new preview runtime and asset registry.
- HTML structure: PASS for all HTML files.
- Entity linkage: PASS; places, bookings, itinerary, parties and family breakdown unchanged.
- Guide address integrity: PASS.
- Manifest/checksum integrity: PASS after regeneration.

## Browser verification

The actual project was served locally and all target routes returned valid project HTML. Automated headless Chromium screenshot capture was attempted in this container but the browser process did not complete reliably, so visual interaction verification should be repeated after opening the Full Deploy locally or on Vercel. No concept-art or generated UI image was used.

Route/load checks completed for:

- Homepage
- Timeline / Day
- Guide
- Trip / Booking surface
- Expenses
- Moments
- Trip Essentials / Days
- Studio host page

## Safety checks

- Reset removes only `travelEngine.themePreview.v1` and reapplies Frozen NZ values.
- JSON export/import uses schema `travelEngine.themePreview.v1`; no trip data is included.
- No new external image URL or external font dependency was added.
- Preview asset registry resolves local project paths only.
- No production theme save/publish action exists.
- No expense, booking, moment, party, export, Supabase or canonical storage code was modified.
- Title, logo and radius controls are clamped to safe bounds.
- Studio controls remain scrollable and include mobile safe-area bottom padding.
