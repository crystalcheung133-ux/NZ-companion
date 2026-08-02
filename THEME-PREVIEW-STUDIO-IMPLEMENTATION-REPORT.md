# Theme Preview Studio v2.1 — Floating Inspector Fix

## Baseline

Travel Engine NZ Frozen Companion with the existing CI suite, continuing from Theme Preview Studio v2.

## Corrected workflow

The Theme Preview area inside Trip Studio is now a compact launcher card only. It no longer renders the complete theme-control list inside Studio.

The launcher provides two explicit actions:

- **Open Inspector** — enables the floating inspector, closes Trip Studio, and opens the live controls over the real Companion page.
- **Close Inspector** — removes the floating inspector from the Companion without resetting the selected preview theme.

The floating inspector itself provides:

- collapse to a small `🎨` button;
- reopen from the `🎨` button;
- close with an explicit `×` button;
- desktop dragging;
- mobile-safe placement above the bottom navigation;
- left-side default placement to avoid the Vercel Toolbar on preview deployments.

## Reliability fixes

- Inspector visibility now follows its own preview-only UI state instead of the transient `admin-mode` body class.
- UI state is stored separately in `travelEngine.themePreview.ui.v2.1`.
- The launcher is mounted when the dynamically generated Trip Studio DOM becomes available.
- A DOM observer handles Studio shells created after page load.
- Asset query strings and the service-worker cache identifier were bumped to `theme-preview-v2-1` to prevent the previous long-form Studio UI from remaining in cache.

## Storage safety

Theme settings remain isolated in `travelEngine.themePreview.v1`. Inspector open/collapse/position state is isolated in `travelEngine.themePreview.ui.v2.1`. No trip, expense, booking, moment, Supabase, production theme, or canonical storage is modified.

## Files changed in v2.1

- `theme-preview-runtime.js`
- `theme-preview.css`
- `sw.js`
- `index.html`
- `day.html`
- `guide.html`
- `trip.html`
- `expenses.html`
- `moments.html`
- `itinerary.html`
- `place.html`
- `memory.html`
- `offline.html`
- `VERSION.txt`
- `THEME-PREVIEW-STUDIO-IMPLEMENTATION-REPORT.md`
- `THEME-PREVIEW-STUDIO-REGRESSION-CI-REPORT.md`
- `PRODUCTION-FILE-MANIFEST.txt`
- `SHA256SUMS.txt`
