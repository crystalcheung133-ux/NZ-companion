# Fine Tune — Primary Button Override Wiring Fix Report

Baseline: Latest Theme Studio with Fine Tune controls
(`theme-studio-fine-tune-1`).
Scope: focused bug fix. No new controls, no Theme Studio redesign, no
official Theme palette values changed, no layout or business-logic change.

## Audit — every real primary-CTA-style button selector in the Engine

| Surface | Selector | Pre-fix colour source |
|---|---|---|
| Homepage "Let's go" | `#homeTodayButton.home-day-button` | `--tp-primary` (Theme's brand colour) |
| Booking "Save Moments/Unexpected/Expense" (Trip Studio sheets) | `.btn` | `--tp-primary` |
| Moments "✨ Just this moment" | `.btn.primary-action` | `--tp-cta` (Fine Tune's own field) |
| Expenses "💸 What did we spend?" | `.btn.primary-action` | `--tp-cta` |
| Export Centre "Save as PDF" | `.toolbar .primary` inside a **separate popup document** (`popup.document.write(...)`) | its own inline `<style>`, not reachable from the parent document at all |
| Studio "Complete Trip" (admin) | `.complete-trip-btn` | production `var(--ink)` — not part of the Theme Preview system at all |
| Secondary actions app-wide | `.pill`, `.mini-btn`, `.friend-pill` | `--tp-secondary` (unaffected, correctly) |
| Bottom navigation active state | `.app-nav .is-active` | `--tp-nav-active` (unaffected, correctly) |
| Active tabs (Moments/Expenses) | `.moment-day-tab.active`, `.expense-type-btn.active`, etc. | `--tp-primary` (unaffected, correctly — these are state indicators, not the primary-CTA component) |

**Root cause.** Fine Tune's "Primary Button Colour"/"Primary Button Text
Colour" fields only ever wrote to `state.cta`/`state.ctaInk` (exposed as
`--tp-cta`/`--tp-cta-ink`), which only `.primary-action` consumes. The
Homepage "Let's go" button and the shared `.btn` class (used for every
Save action in Booking/Expenses/Moments modals) read a completely
different, unrelated variable — `--tp-primary` — which Fine Tune never
touches. The control correctly updated state and showed "Custom", but
roughly half of the app's real primary buttons were listening to a
variable Fine Tune never wrote to.

**Excluded by design, not by oversight:**
- Export Centre's "Save as PDF" button is rendered inside a print popup
  opened via `window.open()` and built with `popup.document.write(...)`
  — a completely separate `document`. `theme-preview.css`/the runtime's
  `document.documentElement.style` calls cannot reach into it (different
  document, own inline stylesheet), and doing so would risk the printed
  PDF/A4 output, which is explicitly out of scope ("Export Centre" is on
  the project's do-not-modify list). Flagging this so it's a documented
  exclusion rather than a silent gap.
- `.complete-trip-btn` ("Complete Trip", admin-only) is styled from the
  app's own production `--ink` variable, not from the Theme Preview system
  at all — it was never wired to any Theme Preview variable before this
  fix, official or Fine Tune. Rewiring an admin/destructive-adjacent
  control into the Fine Tune Primary Button system was judged out of
  scope for a "primary CTA" bug fix and risks the brief's "do not change
  destructive buttons" instruction; flagging this in case it should be
  revisited as a separate, deliberate decision.

## The fix

Two dedicated runtime CSS custom properties, exactly as specified in the
brief:

```
--theme-preview-primary-button-bg
--theme-preview-primary-button-text
```

`theme-preview-runtime.js`'s `apply()` now computes them once, per the
selected Theme's Fine Tune override state:

```js
const ftOverrides = themeOverrides(selectedTheme),
  primaryButtonBg   = ('cta'    in ftOverrides) ? state.cta    : state.primary,
  primaryButtonText = ('ctaInk' in ftOverrides) ? state.ctaInk : state.primaryInk;
```

- If the user has **not** fine-tuned Primary Button Colour/Text for the
  selected Theme, these two properties resolve to that Theme's own
  `primary`/`primaryInk` — i.e. `.home-day-button`/`.btn` render exactly
  as they did before this fix. No official Theme's default appearance
  changed.
- The moment the user sets an override, both properties resolve to the
  overridden `cta`/`ctaInk` value — the same value `.primary-action`
  already reads via `--tp-cta`/`--tp-cta-ink`. From that point, every
  primary-CTA-style button in the app (Home, Booking, Expenses, Moments)
  shows the identical colour, live, with no page refresh.

`theme-preview.css`'s guarded `.btn`/`.home-day-button` rule (still scoped
to official Themes only — Frozen NZ and the legacy `custom` identity are
excluded exactly as before) now reads `--theme-preview-primary-button-bg`/
`-text` instead of `--tp-primary`/`--tp-primary-ink`. `.primary-action`'s
rule is untouched (it was already correctly wired to `--tp-cta`/
`--tp-cta-ink`, which update immediately on every Fine Tune edit — this
was verified directly, not assumed).

Both rules gained a defensive child/pseudo-element selector:

```
… .btn *, … .home-day-button *, … .btn::before, … .btn::after,
… .home-day-button::before, … .home-day-button::after
  { color:inherit!important; fill:currentColor!important }
… .primary-action *, … .primary-action::before, … .primary-action::after
  { color:inherit!important; fill:currentColor!important }
```

No such nested rule currently exists in `styles.css` for these three
classes (confirmed by a targeted search), so this doesn't change today's
rendering — it's a forward guard per the brief's explicit requirement,
so a future icon/badge added inside a primary button can't silently
resist the selected text colour.

## Specificity — why this beats production styles without `!important` abuse

The guarded selector
(`html.theme-preview-active[data-theme-preset]:not([data-theme-preset="nz"]):not([data-theme-preset="custom"]) .primary-action`)
carries specificity (0,0,5,1) — higher than every page-specific hardcoded
rule in `styles.css`, including the highest one found,
`body.moments-page .page-action-row .primary-action` at (0,0,3,1). This
was verified empirically (see Regression Report), not just calculated:
after fine-tuning, the Moments and Expenses `.primary-action` buttons
both render the overridden colour, correctly beating their page's own
pink/green hardcoded `!important` rules.

## Live update, restore behaviour

- Every `setOverride()` call already re-runs `apply()` synchronously —
  no page refresh is or was needed; the previous bug was never about
  live-update timing, only about which CSS variable name the two button
  families were listening to.
- **Restore This Setting** clears only the one property (`cta` or
  `ctaInk`) from that Theme's override object; `primaryButtonBg`/`Text`
  fall back to `state.primary`/`primaryInk` again, and `.home-day-button`
  /`.btn` revert while `.primary-action` also reverts (both were reading
  the same override).
- **Restore Selected Theme** clears the whole override object for the
  current Theme; unaffected.
- **Reset to Frozen NZ** switches `selectedTheme` to `nz`, which the
  guard excludes entirely — verified byte-identical to the untouched
  baseline (see Regression Report).
