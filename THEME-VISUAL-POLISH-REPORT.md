# Theme Visual Polish Report

Baseline: Theme Studio Freeze 1.5 (latest production)
Scope: production polish only — no Theme Engine redesign, no Builder
change, no page-structure or layout change.

## Audit of the prior implementation

Before this change, `theme-preview-runtime.js` exposed only six CSS
variables per theme (`--tp-bg`, `--tp-primary`, `--tp-secondary`,
`--tp-accent`, `--tp-card`, plus canvas settings), and `theme-preview.css`
consumed them in very few places:

- Page background and card background/opacity.
- `.btn` / `.home-day-button` background (flat colour, no gradient).
- `.pill` / `.mini-btn` border colour only.
- Headings and body/kicker colour tied to `--tp-primary`.

Everything else was untouched by the selected theme:

- The Hero card had no per-theme gradient — same flat pastel treatment
  regardless of which theme was active.
- Secondary buttons, CTA buttons (`.primary-action`), the bottom
  navigation's active state, and active tabs (Moments day tabs, Expense
  type/category/split buttons) were all hardcoded to the NZ teal/terracotta
  palette in `styles.css`, independent of the theme system entirely.
- The Timeline's rotating highlight stripe (`--sky` / `--olive` /
  `--terracotta`) never picked up theme colour.
- Hyperlinks, quick-info icons, and category tags had no theme accent.
- Body/paragraph text stayed a fixed brownish tone regardless of theme.

This matches the brief's diagnosis: changing a theme only changed the page
background in any way a user would actually notice.

## What changed

Two files were modified — `theme-preview-runtime.js` and
`theme-preview.css`. No HTML, layout, business-logic, storage, or
Supabase code was touched.

### 1. Each official theme is now a complete visual package

Every one of the 8 official themes (Adventure, Japan, Luxury, Nature,
Coastal, Heritage, Cafe, Family) now carries, in addition to its existing
palette/typography/canvas settings:

- `ink` / `muted` — readable text colours tuned to that theme's own card
  colour (not simply reused from `primary`), so text stays legible.
- `border` — a theme-tinted card border.
- `heroGradient` — a signature multi-stop CSS gradient (see below).
- `heroInk` / `heroScrim` — a text colour and a translucent overlay chosen
  per theme so hero text stays readable across the gradient.
- `primaryInk`, `cta` / `ctaInk`, `link`, `navActive` / `navActiveInk` —
  contrast-safe text colours paired with each new accent role.
- `timeline` — a 3-colour set for the Timeline's rotating highlight.

### 2. Hero — signature multi-stop gradients

Each theme's Hero (`.page-hero`, `.module-hero`, `.home-brand-card`) now
renders its own multi-stop gradient plus a subtle scrim for text contrast,
replacing the flat/shared background:

| Theme     | Hero gradient direction                              |
|-----------|-------------------------------------------------------|
| Adventure | deep teal → forest green → warm gold                  |
| Japan     | dusty sakura → warm ivory → soft linen                 |
| Luxury    | charcoal → deep umber → champagne → muted gold          |
| Nature    | deep forest → moss → sage                              |
| Coastal   | ocean blue → aqua → soft white                         |
| Heritage  | terracotta → sandstone → ivory                          |
| Cafe      | coffee brown → cream → latte                             |
| Family    | sky blue → sunshine → fresh green                        |

### 3. Buttons — three visibly distinct treatments per theme

- **Primary** (`.btn`, `.home-day-button`) — gradient from the theme's
  primary colour to a darkened tone, with a contrast-safe text colour.
- **Secondary** (`.pill`, `.mini-btn`, `.friend-pill`, Timeline action
  buttons) — tinted background + border from the theme's secondary colour.
- **CTA** (`.primary-action`, e.g. "+ Add a Moment", "What did we spend?")
  — gradient from the theme's dedicated CTA colour, distinct from both
  primary and secondary.

### 4. Navigation and tabs

- Bottom navigation active state (`.app-nav .is-active`) now shows the
  theme's `navActive` colour as a filled pill, with a matching icon/label
  colour, instead of the previous colourless "chrome removed" state.
- Active tabs in Moments (day tabs) and Expenses (type / category /
  split-mode buttons) — previously hardcoded to NZ teal — now use the
  theme's primary colour.

### 5. Cards, icons, links, Timeline

- Content cards (quick-info, expense, moments entries) get a themed inset
  top accent stripe and a theme-tinted border, without changing box
  dimensions.
- Quick-info icons and category tags pick up the theme's accent colour.
- In-content hyperlinks (guide/trip/moments sheets, prose content) use the
  theme's dedicated link colour with a themed underline.
- The Timeline's rotating highlight stripe now cycles through each
  theme's own 3-colour set instead of the fixed sky/olive/terracotta trio.
- Paragraph and secondary text use each theme's own `muted` tone instead
  of the previous fixed colour, for full-page thematic consistency.

## Design safeguard: Frozen NZ is untouched

Every new/rewired CSS rule is scoped to
`html.theme-preview-active[data-theme-preset]:not([data-theme-preset="nz"]):not([data-theme-preset="custom"])`.
`theme-preview-runtime.js` now writes `data-theme-preset` onto `<html>` on
every apply, so:

- Selecting any of the 8 official themes triggers the new rules.
- The `nz` (Frozen baseline) and `custom` (Advanced-panel-only) presets
  never match the guard, so none of the new rules fire for them — the
  production/reset appearance is pixel-identical to before this change.
- Verified in isolation: applying the `nz` preset resolves
  `--tp-hero-gradient` to `none` (its pre-existing/unset value), confirming
  the guard is effective, not just visually similar.

## Verification performed

- All 8 presets applied cleanly via `ThemePreviewStudio.setPreset()` in a
  scripted DOM check — no runtime errors, every new CSS variable resolved
  to a defined value for every theme.
- `node --check theme-preview-runtime.js` — syntax clean.
- Loaded `index.html`, `moments.html`, `expenses.html` in a headless
  browser (Playwright/Chromium) with each of the 8 themes applied — Hero
  gradient, CTA buttons, and bottom-nav active state all rendered as
  expected with no console errors attributable to this change.
- See `THEME-VISUAL-POLISH-REGRESSION-REPORT.md` for the full CI run and
  scope-safety checks.
