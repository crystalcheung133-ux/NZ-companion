# Active Navigation Fine Tune Control — Implementation Report

Baseline: Latest Theme Studio with Fine Tune controls
(`theme-studio-button-wiring-fix-1`).
Scope: focused enhancement. No Theme Studio redesign, no layout change,
no unrelated controls added.

## What the active bottom-navigation item was actually driven by

The highlighted bottom-nav item (`.app-nav .is-active`) has, since the
Visual Identity Polish stage, already been an "official theme package"
element with its own dedicated colour role — distinct from Primary Button
Colour and Accent Colour:

```
.app-nav .is-active            { background: var(--tp-nav-active) }
.app-nav .is-active span/small { color: var(--tp-nav-active-ink) }
```

`--tp-nav-active`/`--tp-nav-active-ink` were already populated at
runtime from each Theme's own `navActive`/`navActiveInk` fields — every
official Theme (Adventure, Japan, Luxury, Nature, Coastal, Heritage,
Cafe, Family) already defines both, each chosen to coordinate with that
Theme's Hero/CTA/accent palette (e.g. Adventure's `navActive` is its
warm gold accent; Luxury's is its own champagne-gold primary; Coastal's
is its coral accent).

**What was missing was purely a Fine Tune wiring gap, not a colour or
CSS gap:** `navActive`/`navActiveInk` were never included in
`FINE_TUNE_PROPS`/`FINE_TUNE_LABELS`, so the Fine Tune panel had no row
for them and `setOverride()` could never be called with those property
names. The user had no path to override a value that was otherwise fully
wired end-to-end.

## The fix

Two additions to `theme-preview-runtime.js`, using the exact same
generic override/restore machinery every other Fine Tune field already
uses — no new functions, no new CSS:

```js
const FINE_TUNE_PROPS=['cta','ctaInk','navActive','navActiveInk','heroGradient','bg','card','accent'];
const FINE_TUNE_LABELS={…,navActive:'Active Navigation Colour',navActiveInk:'Active Navigation Text / Icon Colour',…};
```

and one line adding the two new rows to the Fine Tune panel body,
grouped with Primary Button Colour/Text since both are the same kind of
single-component override:

```js
`${colourRow('cta')}${colourRow('ctaInk')}${colourRow('navActive')}${colourRow('navActiveInk')}${heroRow()}…`
```

Because `colourRow()`, `setOverride()`, `restoreSetting()`,
`restoreSelectedTheme()`, and `apply()`'s CSS-variable computation are
all already generic over any property name present on the state object,
enabling these two fields required no other code path to change. This
also means:

- **Live update** was already correct — `setOverride()` re-runs `apply()`
  synchronously, so `--tp-nav-active`/`-ink` (and therefore the rendered
  active nav item) update immediately on every keystroke/colour-picker
  change, no refresh.
- **Restore This Setting** works per-field automatically (already
  generic).
- **Restore Selected Theme** clears both alongside any other override for
  that Theme, restoring `navActive`/`navActiveInk` to the Theme's own
  defaults, automatically.
- **Reset to Frozen NZ** was already correct: the CSS rule for
  `.app-nav .is-active` is scoped to
  `[data-theme-preset]:not([data-theme-preset="nz"]):not([data-theme-preset="custom"])`,
  exactly like the rest of the official-theme package, so switching to
  `nz` was already guaranteed to fall through to Frozen NZ's own
  production nav styling untouched.

## Scope discipline

Nothing outside `theme-preview-runtime.js` was changed for this feature
— `theme-preview.css` needed no edits at all, since the CSS side was
already correctly built and scoped in the Visual Identity Polish stage.
The two new overrides only ever affect `--tp-nav-active`/
`--tp-nav-active-ink`, which only `.app-nav .is-active` and its
`span`/`small` children read. Confirmed unaffected by this change:

- Inactive bottom-nav items (no rule references these variables for the
  non-active state).
- Primary CTA buttons (`.btn`, `.home-day-button`, `.primary-action`) —
  driven by `--theme-preview-primary-button-bg`/`-text` and `--tp-cta`/
  `-ink`, entirely separate variables.
- Secondary buttons, page background, cards — all driven by their own
  existing variables, none of which this change touches.
- Active *tabs* (Moments day tabs, Expense type/category/split buttons)
  were deliberately left driven by `--tp-primary` as before — they are
  state indicators within a page, not the bottom-navigation component
  this control targets, and the brief's scope list didn't ask for them.

See the Regression Report for the full browser-verified validation
matrix.
