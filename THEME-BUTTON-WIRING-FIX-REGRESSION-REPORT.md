# Fine Tune — Primary Button Override Wiring Fix — Regression Report

## Files touched

Verified with `diff -rq` against the unmodified baseline — exactly:

- `theme-preview-runtime.js`
- `theme-preview.css`
- `sw.js` (cache name bump only, so devices pick up the two files above)
- 10 root `.html` files (cache-busting `?v=` query string on the existing
  `theme-preview.css` / `theme-preview-runtime.js` /
  `theme-preview-assets/registry.js` tags only — no markup change)
- `VERSION.txt`, `SHA256SUMS.txt`, `PRODUCTION-FILE-MANIFEST.txt`

No official Theme palette value in `theme-preview-runtime.js` was
changed — the 8 preset objects (`adventure` … `family`) are untouched.
`theme-config.js`, `data.js`, `storage.js`, `storage-config.js`,
`sync-runtime.js`, `supabase-client-runtime.js`, `export-runtime.js`, and
every page's markup are byte-identical to baseline.

## CI suite

- **JS syntax gate** — PASS, 43/43 root `.js` files parse cleanly.
- **HTML structure** — PASS, 10/10 root HTML pages, balanced `<div>`s.
- **Entity linkage** (places/bookings/itinerary/parties) — PASS,
  unaffected (`data.js` not touched).
- **Guide address integrity** — PASS, unaffected.
- **Release integrity (checksums + manifest)** — PASS after regeneration
  (see updated `SHA256SUMS.txt` / `PRODUCTION-FILE-MANIFEST.txt`, which
  now also list the two new report files for this stage).

## Manual browser verification (this task's actual bar — not localStorage/badges)

Every check below was run against the real rendered DOM in a headless
Chromium session, driving the actual Floating Inspector UI (colour input
`fill()` + `change` event dispatch — not calling internal functions
directly), and reading `getComputedStyle()` on the real production
buttons. Matches the brief's 10-step validation list:

1. **Selected Japan Theme** via the theme card UI.
2. **Changed Primary Button Colour to `#FF00FF`** via the Fine Tune hex
   field, dispatching the same `change` event a real user's keystroke/blur
   would.
3. **Homepage "Let's go" (`#homeTodayButton`)** — `background-image`
   confirmed to update from Japan's navy gradient to the magenta gradient
   immediately, no reload. *(This is the exact case that was broken
   before the fix — reproduced the bug first, confirmed `--tp-cta` was
   updating while the button stayed navy, then confirmed the fix.)*
4. **Moments and Expenses `.primary-action`** ("✨ Just this moment",
   "💸 What did we spend?") — both confirmed to render the same magenta
   gradient after navigating to `moments.html` / `expenses.html` fresh
   (override read back from `localStorage`, not just carried in memory).
   Booking's Save actions share the `.btn` class with "Let's go" and are
   covered by the same rule.
5. **Changed Primary Button Text Colour to `#000000`, then `#FFFFFF`** —
   `getComputedStyle(...).color` on the Home button confirmed `rgb(0,0,0)`
   then `rgb(255,255,255)` immediately after each change.
6. Label text and inline icon glyphs (e.g. the ✨/💸 emoji, which sit
   inline in the button's own text node) inherit `color` directly: no
   separate icon element exists for these buttons today, and the new
   defensive `* / ::before / ::after { color:inherit }` rule is in place
   for any that get added later.
7. **Secondary button** (`.pill`/`.mini-btn`/`.friend-pill`) background
   colour confirmed unchanged by the Primary Button Colour override
   (`color-mix(... var(--tp-secondary) ...)`, an unrelated variable) —
   still Japan's own secondary tint, not magenta.
8. **Restore This Setting** on Primary Button Colour, with a second
   override (Page Background) also active: confirmed the button reverted
   to Japan's navy default while the page background stayed the
   overridden colour — restore is scoped to the one field.
9. **Restore Selected Theme**: confirmed both the button and the page
   background reverted to Japan's own defaults together.
10. **Reset to Frozen NZ**: confirmed `data-theme-preset` becomes `nz`
    and the Home button's computed `background-color` is `rgb(8,127,156)`
    (`#087F9C`) — a byte-for-byte match against the same measurement
    taken on the untouched original baseline build.

Additional checks beyond the brief's list, run for extra confidence:

- **Un-fine-tuned default rendering is unchanged.** Compared
  `getComputedStyle(...).backgroundImage` for `#homeTodayButton` under the
  Adventure theme (no Fine Tune edits) between this fix and the untouched
  original baseline — identical gradient in both. No official Theme's
  default button appearance changed as a side effect of this fix.
- **Per-Theme override isolation.** Fine-tuned Japan's Primary Button
  Colour, switched to Adventure (rendered its own unrelated default, not
  magenta), switched back to Japan (the button-colour override had been
  restored to default in a prior step but the still-active Page
  Background override was intact) — confirmed overrides remain scoped per
  Theme exactly as the existing Fine Tune design already guaranteed; this
  fix didn't touch that isolation logic.
- **Specificity check performed empirically, not just by inspection**:
  the Moments-page and Expenses-page hardcoded pink/green `!important`
  rules on `.primary-action` in `styles.css` were confirmed to lose to the
  guarded Fine Tune rule once a Theme is selected (both pages rendered the
  fine-tuned colour, not their hardcoded page tint).

## Result

Root cause was a variable-naming/wiring gap, not a live-update or
specificity defect: `.home-day-button`/`.btn` were reading `--tp-primary`
while Fine Tune only ever wrote `--tp-cta`. Fixed by introducing the two
dedicated properties the brief specified and computing them with an
override-aware fallback, so un-fine-tuned Themes render unchanged and
fine-tuned Themes apply consistently across every real primary CTA
surface. No regressions identified in Frozen NZ, official Theme defaults,
secondary/destructive buttons, bottom navigation, tabs, or business logic.
