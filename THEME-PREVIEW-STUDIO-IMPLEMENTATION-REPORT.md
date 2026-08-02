# Theme Preview Studio v1 — Implementation Report

## Baseline audit

Baseline: `NZ Companion with CI test(1).zip`.

The safest integration point was the dynamic Trip Studio shell created by `admin.js`. A new `tripStudioThemePreview` group is inserted beside the existing management/export/data-control groups without changing the family selector, Studio modal hierarchy, page layout, navigation, or production data modules.

The visual preview layer is isolated in `theme-preview.css` and `theme-preview-runtime.js`. It uses CSS custom properties and state classes on the document root. Standard colour, opacity, font, decorative visibility, logo, canvas, radius and title-scale changes apply immediately without reload.

## Implementation

- Added compact mobile-friendly Theme Preview controls inside Trip Studio.
- Added Current NZ, Neutral / Reset, Custom Preview and Japan Warm Editorial preview presets.
- Added live page background, primary, secondary, accent, card colour and opacity controls.
- Added local canvas registry, enable toggle, opacity, cover/contain and top/center controls.
- Added hero asset and logo asset controls using local registry assets only.
- Added safe system/local font-stack presets; no font files were added.
- Added safe title scale (0.88–1.08), hero radius (20–40 px), logo size (36–84 px), watermark and decorative pseudo-element toggles.
- Added page links to inspect the real Homepage, Timeline, Guide, Trip/Booking, Expenses, Moments and Days/Essentials pages.
- Added preview-only JSON export/import using schema `travelEngine.themePreview.v1`.
- Added reset to the Frozen NZ preview values.
- Added service-worker cache entries/version bump for the new runtime assets only.

## Storage safety

Theme settings are stored only at:

`travelEngine.themePreview.v1`

The runtime does not import or call trip, expense, booking, moments, Supabase, canonical storage, publication or export data APIs. Theme JSON contains only the preview schema and theme settings.

## Added files

- `theme-preview.css`
- `theme-preview-runtime.js`
- `theme-preview-assets/registry.js`
- `theme-preview-assets/japan-warm-editorial-canvas.svg`
- `THEME-PREVIEW-STUDIO-IMPLEMENTATION-REPORT.md`
- `THEME-PREVIEW-STUDIO-REGRESSION-CI-REPORT.md`

## Modified files

- `admin.js`
- `day.html`
- `expenses.html`
- `index.html`
- `itinerary.html`
- `memory.html`
- `moments.html`
- `offline.html`
- `place.html`
- `trip.html`
- `sw.js`
- `VERSION.txt`
- `SHA256SUMS.txt`
- `PRODUCTION-FILE-MANIFEST.txt`
