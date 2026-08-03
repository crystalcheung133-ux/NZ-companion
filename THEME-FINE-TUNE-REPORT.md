# Theme Studio — Fine Tune Controls & Palette Refinement

Release: Stage1.5.2-THEME-STUDIO-FINE-TUNE
Baseline: Stage1.5.1-THEME-STUDIO-VISUAL-POLISH
Scope: theme-preview-runtime.js, theme-preview.css, sw.js (cache name only)

## 1. Official palette audit (WCAG contrast)

Computed relative-luminance contrast ratios for every theme's button-text-on-
button-background pair (the combination most likely to produce an "unrelated
dark button on a pale background" problem) and for hero-text-on-hero-gradient.
Body-text-on-page/card was already excellent everywhere (11.4:1–14.7:1) and
needed no changes.

Three pairs failed the WCAG AA 4.5:1 threshold for normal text and were fixed:

| Theme    | Pair                        | Before  | After  | Fix |
|----------|------------------------------|---------|--------|-----|
| Family   | Primary/CTA button text on button | 2.61:1 | 6.27:1 | Button text `#FFF8F5` → `#341008` (deep warm brown, keeps the bright coral button, text is now readable) |
| Nature   | CTA button text on button    | 3.64:1 | 4.64:1 | CTA text `#FFF8EE` → `#1F160C` |
| Coastal  | Primary button text on button | 4.23:1 | 7.12:1 | Primary `#1583B7` → `#125E82` (same hue, deepened); link colour and Timeline stripe updated to match so the theme stays internally consistent |

The other 5 themes (Adventure, Japan, Luxury, Heritage, Cafe) were already
coherent — background, hero, buttons and accent read as one intentional set —
so nothing was changed there. No theme was flattened toward "always pale" or
"always dark buttons"; each keeps its own distinct treatment.

Hero-text-vs-gradient-endpoint ratios are sometimes low (e.g. 1.4:1) where the
text sits near the *opposite* end of a multi-stop gradient from where it's
rendered — this is expected and mitigated by each theme's `heroScrim` overlay
already in place; it was not treated as a defect.

## 2. Fine Tune

Added a collapsed **Fine Tune** section under the Theme list in the Floating
Inspector, with exactly the 6 fields specified:

- Primary Button Colour → theme's `cta`
- Primary Button Text Colour → theme's `ctaInk`
- Hero Gradient Colours → theme's `heroGradient` (edited as two colour stops,
  start/end, stored/restored as one setting)
- Page Background → theme's `bg`
- Card Background → theme's `card`
- Accent Colour → theme's `accent`

**Design note on "Primary Button":** the CSS ships two visually distinct
button treatments — `.btn`/day-buttons (brand `primary` colour) and
`.primary-action` (the `cta`/`ctaInk` pair, used for Save/Add/Submit-style
actions across Booking, Expenses and Moments). Fine Tune's "Primary Button
Colour" targets `cta`/`ctaInk` specifically, since that's the pair the
codebase itself calls "primary action" and is what a family member clicking
through Booking/Expenses will actually experience as "the button". The
brand-coloured nav/day buttons intentionally keep following the theme's own
colour. Flag this to me if you pictured it the other way and I'll remap it.

Fine Tune is disabled (shows a short explanatory line instead of controls)
while Frozen NZ is selected, since Frozen NZ isn't part of the official
package system these 6 properties belong to.

### Behaviour
- Changing one Fine Tune field overrides only that property. Every other
  Theme-owned value (typography, canvas, decorative styling, the other 5
  Fine Tune fields, everything else) is read from the selected Theme's
  defaults, unchanged.
- Overrides are kept **per Theme**. Fine-tuning Japan's button colour, then
  switching to Adventure and back to Japan, restores Japan's own saved
  tweak — Adventure is untouched and vice versa.
- The selected Theme identity never changes to a generic "custom" state —
  it stays e.g. `japan` with overrides layered on top, so the theme card
  still shows "Applied" and the full official-package CSS keeps applying.

### Reset actions
- **Restore This Setting** — a small ↺ button next to each Fine Tune field,
  enabled only when that field is customised; reverts only that one value.
- **Restore Selected Theme** — button at the bottom of the Fine Tune panel;
  clears every override for the currently selected Theme only.
- **Reset to Frozen NZ** — the panel's bottom button (renamed from the old
  "Reset Theme"); switches back to the exact original Frozen NZ appearance.
  It does not clear other Themes' saved Fine Tune overrides — it's a
  navigation back to baseline, not a wipe. (Flag if you wanted a full wipe
  instead — easy to change.)

### Storage
Still lives in `travelEngine.themePreview.v1` (same namespace as before).
Internal shape is now versioned and explicit:

```json
{
  "schemaVersion": 2,
  "selectedTheme": "japan",
  "overrides": {
    "japan": { "cta": "#112233" },
    "adventure": { "heroGradient": "linear-gradient(135deg,#abc 0%,#def 100%)" }
  }
}
```

`themeDefaults` isn't stored — it's the existing `presets` object in
theme-preview-runtime.js, already the single source of truth. A pre-Fine-Tune
save (old flat shape, no `schemaVersion`) is detected and treated as a first
run rather than partially migrated, since this is a preview-only local
setting, not trip data. No Supabase, booking, expense, moment, or production
theme-config.js code was touched.

### What was removed
The old "Advanced" section (Background Colour / Card Opacity / Typography —
the only exposed knobs in the prior Freeze) is gone, replaced by Fine Tune.
Card Opacity and Typography are no longer user-editable — they were not on
the spec's list of 6 — and remain Theme-owned constants. The `range()` UI
helper that only Card Opacity used was deleted as dead code.

## 3. Testing

Ran the project's existing CI gates unchanged — all pass (43/43 JS files,
10/10 HTML files, full entity linkage, address integrity).

Also wrote a one-off jsdom integration test that builds the real Floating
Inspector DOM and drives it with actual click/input/change events (not just
unit-testing the internal functions). 22/22 checks passed, covering every
item in the brief's Validation section:

- Each Theme still applies as a complete package.
- Changing only button colour leaves background/hero/cards/typography alone.
- Changing only page background leaves buttons alone.
- Restore This Setting restores only that one setting.
- Restore Selected Theme clears all overrides for the current Theme only.
- Reset to Frozen NZ restores the exact original appearance.
- Fine Tune renders collapsed by default (native `<details>`, unopened).
- A Theme's Fine Tune overrides survive switching to another Theme and back.
- No trip/booking/expense/moment/Supabase code path was touched.

This test script isn't part of the shipped ci-tests/ suite (it needs jsdom,
which the existing suite doesn't depend on) — it was a build-time check only,
not left in the deploy.

## 4. Files changed

- `theme-preview-runtime.js` — 3 palette colour fixes; new
  selectedTheme/overrides state model; Fine Tune panel markup, rendering and
  event wiring; removed the old Advanced panel and its helpers.
- `theme-preview.css` — new styles for the Fine Tune rows, restore buttons,
  "Custom" badge, hero-gradient two-picker layout, and empty-state note.
  No existing selectors were changed — Homepage, Timeline, Guide, Booking,
  Expenses, Moments, navigation and Studio layout CSS is untouched.
- `sw.js` — cache name bump only (`...theme-studio-fine-tune-1`), so devices
  pick up the two files above.
