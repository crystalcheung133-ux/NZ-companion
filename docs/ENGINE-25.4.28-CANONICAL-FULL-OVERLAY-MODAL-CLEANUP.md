# Travel Engine 25.4.28 — Canonical Full-Overlay Modal Cleanup

This release intentionally restarts from the uploaded RC29.3 / Engine 25.4.23 baseline.

## Root causes removed
- Removed legacy high-specificity `#expenseModal` / `#momentsModal` layout rules that conflicted with later canonical class-based modal contracts.
- Expense modal now resets both the modal/sheet scroll position and `expenseSheetFocusScroll` on open and close.
- Studio re-entry no longer relies on a single early animation frame; it re-targets the Studio entry after layout settles.

## Canonical modal behaviour
- Popup card opens at the top.
- Popup overlay covers the bottom navigation; bottom navigation is unavailable until the popup closes.
- In Studio mode, persistent top Studio status + traveller selector remain visible; popup begins below them and extends to the screen bottom.
- The modal shell scrolls normally and the form's Save/primary action remains at the real bottom.
- The same contract applies to Expense, Moments, Unexpected, Guide, Trip/Booking and non-Studio mama modal.

This is an Engine cleanup and contract consolidation, not a VN-only patch.
