# Travel Engine 25.4.23 — Bounded Overlay Viewport

The 25.4.22 top-chrome fix solved desktop/top overlap but exposed a mobile-only bottom overlap because the fixed app navigation remained inside the visual viewport.

25.4.23 defines the complete overlay viewport as:

`persistent top chrome` → `usable overlay viewport` → `visible mobile bottom navigation`

Rules:
- Desktop overlay behaviour is unchanged.
- On mobile, every Engine overlay subtracts both top persistent chrome and bottom-nav clearance.
- Bottom-nav clearance is measured from the actual rendered `.app-nav`, not hard-coded.
- Metrics refresh on resize/orientation change.
- Applies generically to Guide, Moments, Unexpected, Tools/Expense, Studio/admin and Trip/Booking overlays.

This is an Engine layout contract, not a VN or Expense patch.
