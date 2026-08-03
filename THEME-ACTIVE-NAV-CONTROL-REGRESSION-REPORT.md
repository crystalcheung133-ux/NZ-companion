# Active Navigation Fine Tune Control — Regression Report

## Files touched

Verified with `diff -rq` against the previous stage's baseline —
exactly:

- `theme-preview-runtime.js` (the actual feature: two `FINE_TUNE_PROPS`/
  `FINE_TUNE_LABELS` entries, one line adding the two rows to
  `fineTuneBody()`)
- `sw.js` (cache name bump only)
- 10 root `.html` files (cache-busting `?v=` query string bump only — no
  markup change)
- `VERSION.txt`, `SHA256SUMS.txt`, `PRODUCTION-FILE-MANIFEST.txt`

**`theme-preview.css` was not touched at all.** The CSS wiring for
`.app-nav .is-active` already existed and was already correct from the
Visual Identity Polish stage; this feature only needed to expose the
existing `navActive`/`navActiveInk` state fields through the Fine Tune
UI. No official Theme palette value changed, no layout changed, no
unrelated control was added.

## CI suite

- **JS syntax gate** — PASS, 43/43 root `.js` files parse cleanly.
- **HTML structure** — PASS, 10/10 root HTML pages, balanced `<div>`s.
- **Entity linkage** — PASS, unaffected.
- **Guide address integrity** — PASS, unaffected.
- **Release integrity (checksums + manifest)** — PASS after regeneration.

## Manual browser verification

Run in headless Chromium, driving the real Fine Tune UI (`fill()` +
`change` event dispatch on the actual hex inputs) and reading
`getComputedStyle()` on the real rendered nav — matching the brief's
validation list:

1. **Custom background on the active item.** Selected Japan, opened Fine
   Tune, set Active Navigation Colour to `#00FF00` (lime) and Active
   Navigation Text/Icon Colour to `#000000` (black). The Home page's
   active "Trip" nav item immediately showed `background-color:
   rgb(0,255,0)` and its label `color: rgb(0,0,0)` — no reload.
2. **Follows the active item across pages.** With the override still
   set, navigated to `itinerary.html` (Days), `moments.html` (Moments),
   and `expenses.html` (Expenses) — each page's own active item (Days,
   Moments, Expenses respectively) rendered the same lime background,
   confirmed by reading the override back out of `localStorage` on a
   fresh page load, not carried in memory. (`guide.html` is a redirect
   stub to `index.html#open-guide` in this build — Guide opens as a modal
   over Home, so the bottom nav's highlighted item there is the same
   "Trip" item as Home; this is existing app routing behaviour, not
   something introduced or altered by this change.)
3. **Inactive items unchanged.** On every page checked above, every
   non-active bottom-nav item's background remained fully transparent
   (`rgba(0,0,0,0)`), matching its pre-override value.
4. **Primary buttons unaffected.** `#homeTodayButton` ("Let's go")
   `background-image` was read before and after setting the nav override
   — unchanged (still Japan's own button gradient), confirming
   `--theme-preview-primary-button-bg` and `--tp-nav-active` are fully
   independent variables.
5. **Restore isolation.** With both Active Navigation Colour and Active
   Navigation Text/Icon Colour overridden, clicking Restore This Setting
   on Active Navigation Colour alone reverted only the background (back
   to Japan's `#C98B8B`) while the text-colour override (black) remained
   — confirmed the two new fields restore independently of each other
   and of every other Fine Tune field, exactly like the existing fields.
6. **Restore Selected Theme.** After re-applying the background override,
   clicking Restore Selected Theme reverted both the background *and*
   the text colour together, back to Japan's own `navActive`/
   `navActiveInk` defaults (`#C98B8B` / `#2B1416`).
7. **Reset to Frozen NZ.** After re-applying an override, clicking Reset
   to Frozen NZ set `data-theme-preset="nz"` and the active nav item's
   `background-color` resolved to `rgba(0,0,0,0)` — measured identical,
   byte-for-byte, against the same measurement taken on the untouched
   pre-feature build. Frozen NZ's active-navigation appearance is
   unchanged.

## Result

This was a pure UI-exposure fix: the theme-level colour roles, the CSS
rule, and the entire override/restore/reset pipeline for
`navActive`/`navActiveInk` already existed and were already correct from
an earlier stage. Enabling user control required only registering the
two property names with the existing generic Fine Tune mechanism. No
regressions identified in inactive nav items, primary/secondary buttons,
page background, cards, active tabs, or the Frozen NZ baseline.
