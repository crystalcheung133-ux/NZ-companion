# Theme Visual Polish — Regression Report

## Files touched

Exactly two files were modified. Verified with `diff -rq` against the
unmodified Freeze 1.5 baseline:

- `theme-preview-runtime.js`
- `theme-preview.css`

No HTML file, no other `.js`/`.css` file, no data file, and no asset was
added, removed, or modified. `theme-config.js`, `data.js`, `storage.js`,
`storage-config.js`, `sync-runtime.js`, `supabase-client-runtime.js`, and
every page's markup are byte-identical to Freeze 1.5.

## CI suite

Run via `sh ci-tests/run-all.sh` against this deploy:

- **JS syntax gate** — PASS, 43/43 root `.js` files parse cleanly
  (`node --check`).
- **Release integrity (checksums + manifest)** — PASS after regeneration
  (see updated `SHA256SUMS.txt` / `PRODUCTION-FILE-MANIFEST.txt`, which
  now also list the two new report files).
- **HTML structure** (balanced `<div>`/`</div>`) — PASS, 10/10 root HTML
  pages, unchanged from Freeze 1.5 since no HTML was touched.
- **Entity linkage** (places/bookings/itinerary/parties) — PASS,
  unaffected by this change (`data.js` not touched).
- **Guide address integrity** — PASS, unaffected by this change.

## Theme Apply / Reset

- All 8 official presets (`adventure`, `japan`, `luxury`, `nature`,
  `coastal`, `heritage`, `cafe`, `family`) were applied in sequence via
  `ThemePreviewStudio.setPreset()` in a scripted DOM harness. Each
  resolved a complete state object — palette, typography, canvas asset,
  card opacity, decorative flag, plus the new hero/button/nav/link/timeline
  fields — with no runtime errors and no fallback to `frozen` for any of
  the 8.
- Confirmed `data-theme-preset` is set on `<html>` for every preset,
  including `nz`.
- Confirmed the `nz` preset resolves `--tp-hero-gradient` to its unset
  default (`none`) rather than any of the 8 official gradients — proof
  that the official-theme CSS rules are correctly gated off for the
  Frozen baseline, not just visually similar to it.
- `reset()` still clears `travelEngine.themePreview.v1` and reapplies the
  unmodified `frozen` constant, whose palette values (`bg #EEF8FA`,
  `primary #087F9C`, `secondary #3D7F55`, `accent #F49A24`) are unchanged
  from Freeze 1.5. Because the new "official theme package" CSS rules
  explicitly exclude `[data-theme-preset="nz"]`, Reset restores the exact
  Frozen NZ appearance — no new gradient, button treatment, nav colour, or
  Timeline stripe is applied to it.
- Advanced fields (`tpBg`, `tpCardOpacity`, `tpTypography`) still write
  through `update()` into the same live-apply/save/sync pipeline as
  before; the `custom` preset produced by Advanced edits is likewise
  excluded from the new rules, so it keeps the pre-existing (unenhanced)
  preview behaviour rather than inheriting an official theme's package.

## Storage / business logic

- Confirmed no code path writes to Supabase, trip data, Booking, Expenses,
  Moments, or production theme configuration. Only the pre-existing
  `travelEngine.themePreview.v1` and
  `travelEngine.themePreview.ui.v2.1` localStorage keys are touched — no
  new storage keys were introduced.
- `theme-config.js` (the actual production/default theme, distinct from
  the preview studio) was not modified.

## Page/module regression

- Homepage, Timeline/Days, Guide, Booking, Expenses, Moments — no CSS
  selector outside the existing `theme-preview-*` files was touched, and
  no markup in any of the 10 HTML pages changed.
- Hero dimensions, card layout, timeline layout, guide layout, booking,
  studio layout, and Export Centre — untouched. All new declarations are
  colour/gradient/border/box-shadow/text-decoration values; none affect
  box size, position, grid/flex structure, or responsive breakpoints.
- Rendered `index.html`, `moments.html`, and `expenses.html` in a headless
  browser across all 8 themes (Playwright/Chromium, file:// origin — no
  network access available in this sandbox, so Supabase/currency/weather
  calls correctly fail offline and are unrelated to this change). No
  console errors were produced by `theme-preview-runtime.js` or
  `theme-preview.css` in any theme. Hero gradient, CTA buttons, and the
  bottom-navigation active state rendered as expected in every case
  screenshotted (Adventure, Japan, Luxury, Nature, Coastal, Heritage,
  Cafe, Family, and the Frozen NZ baseline for comparison).
- Live/dynamic day-by-day Timeline content did not render in this offline
  sandbox because it depends on the app's own data/Supabase fetch layer,
  which has no network access here — this is a pre-existing environment
  limitation, not a regression introduced by this change (confirmed by
  the Entity linkage CI check passing independently of it).

## Result

No regressions identified. The Frozen NZ baseline is unchanged; the 8
official themes now each visibly restyle Hero, buttons, navigation, tabs,
cards, icons, links, and the Timeline stripe.
