# Theme Studio Freeze Report — Stage 1.5

## Scope

UI simplification and production polish of the existing Theme Preview Studio.
Not a redesign, not an AI theme generator, not a marketplace, not a Builder
change. The underlying preview-only runtime (`travelEngine.themePreview.v1`
storage, live CSS-variable application, Reset) is unchanged in mechanism —
only its interface and preset catalogue were simplified.

## Audit of the prior implementation (Theme Preview Studio v2.1)

- The Trip Studio launcher card (Open Inspector / Close Inspector) was
  already compact — no changes needed there.
- The Floating Inspector rendered a full developer-oriented control panel:
  5 colour pickers, 6 sliders, 6 checkboxes, 4 selects, a page-shortcut grid,
  and Export/Import JSON — all inside a 360px floating window.
- Only 2 selectable presets existed (`nz` frozen baseline, and a Japan
  preview preset), so "choosing a theme" in practice meant manually tuning
  raw colour/opacity/typography values.

## What changed

**Official Theme catalogue.** Replaced the 2-preset set with 8 complete,
named themes, each a one-click, fully predefined visual package (palette,
typography, canvas texture, card treatment, decorative styling):
Adventure, Japan, Luxury, Nature, Coastal, Heritage, Cafe, Family. Each ships
with its own generated abstract SVG canvas texture in
`theme-preview-assets/` (no photographic assets required).

**UI simplification.** The Floating Inspector now shows, top to bottom:
- Theme — 8 compact two-column theme cards (swatch, name, tagline, Apply)
- Advanced ▼ — collapsed `<details>` containing only Background Colour,
  Card Opacity, and Typography
- Reset Theme

Removed from the default/visible UI: primary/secondary/accent colour
pickers, the decorative toggle, hero radius override, canvas opacity
slider, watermark controls, logo sizing controls, the extra typography
selectors beyond the one kept, the page-shortcut grid, and Export/Import
JSON. `exportJson`/`importJson` remain in the runtime module (unused by any
control) so the underlying capability isn't lost, per "keep the underlying
runtime if required."

**Behaviour preserved exactly as specified:**
- One click applies the complete theme (colour, typography, canvas, cards,
  buttons, decorative styling) — no manual colour configuration required.
- Live preview: CSS custom properties only, no rebuild/refresh.
- Reset Theme restores the exact Frozen NZ appearance (unchanged `reset()`).
- Storage stays isolated in `travelEngine.themePreview.v1`
  (settings) and `travelEngine.themePreview.ui.v2.1` (inspector open/
  collapsed/position) — no trip, booking, expense, moment, Supabase, or
  production theme storage touched.
- No change to Homepage layout, Timeline, Guide, Booking, Expenses,
  Moments, Navigation, hero dimensions, or responsive breakpoints — every
  edit is confined to `theme-preview-runtime.js`, `theme-preview.css`,
  `theme-preview-assets/`, and cache-busting query strings.

## Files changed

- `theme-preview-runtime.js` — preset catalogue (8 themes), simplified
  control markup/wiring, theme-card sync helper
- `theme-preview.css` — compact theme-card grid + collapsed Advanced
  styling (the existing `.theme-preview-active` render-engine rules are
  untouched)
- `theme-preview-assets/registry.js` — catalogue entries for the new canvases
- `theme-preview-assets/adventure-fresh-outdoor-canvas.svg` (new)
- `theme-preview-assets/luxury-boutique-elegant-canvas.svg` (new)
- `theme-preview-assets/nature-forest-organic-canvas.svg` (new)
- `theme-preview-assets/coastal-bright-ocean-canvas.svg` (new)
- `theme-preview-assets/heritage-classic-historic-canvas.svg` (new)
- `theme-preview-assets/cafe-minimal-cozy-canvas.svg` (new)
- `theme-preview-assets/family-friendly-bright-canvas.svg` (new)
- `sw.js` — cache identifier bumped to `theme-studio-freeze-1`, new SVGs
  added to the precache list
- All 10 HTML pages — cache-busting query string bumped from
  `theme-preview-v2-1` to `theme-studio-freeze-1` on the 3 existing
  `theme-preview.css` / `theme-preview-runtime.js` / `registry.js` links
  (no new script/style tags added or removed)
- `VERSION.txt`, `SHA256SUMS.txt`, `PRODUCTION-FILE-MANIFEST.txt` — updated

## Not touched

Builder, Importer, Journey Planning, Complete Trip, Booking Engine, Expense
Engine, Party Model, Storage Architecture, Export Centre, canonical
ownership modules, Supabase, and all other business logic — confirmed by
the regression sweep in the accompanying Regression Report.
