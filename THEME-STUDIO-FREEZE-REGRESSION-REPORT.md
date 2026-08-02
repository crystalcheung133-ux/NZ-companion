# Theme Studio Freeze — Regression Report

## CI suite

Run via `sh ci-tests/run-all.sh` against this deploy:

- JS syntax gate — PASS, all root `.js` files parse cleanly (`node --check`)
- Release integrity (checksums + manifest) — PASS after regeneration (see
  updated `SHA256SUMS.txt` / `PRODUCTION-FILE-MANIFEST.txt`)
- HTML structure (balanced `<div>`/`</div>`) — PASS, all 10 root HTML pages
- Entity linkage (places/bookings/itinerary/parties) — PASS, unaffected by
  this change (`data.js` not touched)
- Guide address integrity — PASS, unaffected by this change

## Theme Apply / Reset

- Verified each of the 8 preset objects (`adventure`, `japan`, `luxury`,
  `nature`, `coastal`, `heritage`, `cafe`, `family`) resolves to a complete
  state object via `setPreset()` — palette, typography, canvas asset,
  card opacity, and decorative flag are all defined for every theme (no
  fallback to `frozen` for any of the 8).
- `reset()` still clears `travelEngine.themePreview.v1` and reapplies the
  unmodified `frozen` constant — byte-identical to the pre-freeze frozen
  NZ values (bg `#EEF8FA`, primary `#087F9C`, secondary `#3D7F55`, accent
  `#F49A24`, canvas disabled, typography `original`).
- Advanced fields (`tpBg`, `tpCardOpacity`, `tpTypography`) still write
  through `update()` into the same live-apply/save/sync pipeline used
  previously by the full control set — no new state path was introduced.

## Storage

- Confirmed no code path writes to Supabase, trip data, Booking, Expenses,
  Moments, or production theme configuration. Only two localStorage keys
  are touched: `travelEngine.themePreview.v1` (theme settings) and
  `travelEngine.themePreview.ui.v2.1` (inspector open/collapsed/position) —
  both unchanged from the prior stage.

## Page/module regression

- Homepage, Timeline (`day.html`), Guide, Booking (`trip.html`), Expenses,
  Moments, Navigation, hero dimensions, and responsive breakpoints: no CSS
  selectors outside the `theme-preview-*` namespace were touched, and no
  markup in any of the 10 HTML pages changed except the cache-busting query
  string on the 3 existing theme-preview `<link>`/`<script>` tags.
- Trip Studio launcher card (`buildStudioLauncher`) — logic untouched;
  still mounts via the same `tripStudioThemePreview` host and
  `MutationObserver` used previously.
- Floating Inspector — visibility, collapse/expand, drag, and the FAB
  button all use the same `ui` state object and CSS classes as before;
  only the panel's inner content (`controls()`) and its stylesheet rules
  changed.

## Mobile / Desktop

- Theme card grid: 2 columns at ≥431px, 1 column at ≤430px (matches the
  breakpoint pattern already used by the inspector's other layouts).
- Advanced section is collapsed by default on every viewport.
- Inspector width, placement (left-side, above bottom navigation), and
  drag behaviour on desktop are unchanged from v2.1.

## Known non-blocking item carried over

`ci-tests/address-integrity-test.py` and the other CI scripts remain in
`ci-tests/`, outside the production deploy root, consistent with the
CERT-FINAL-FIX2 packaging decision — no change made here.

## Verdict

No regressions found. Safe to ship as the Stage 1.5 Theme Studio Freeze.
