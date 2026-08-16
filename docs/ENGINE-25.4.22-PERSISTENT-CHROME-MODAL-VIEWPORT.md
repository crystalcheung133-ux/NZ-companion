# Travel Engine 25.4.22 — Persistent Chrome Modal Viewport

Engine contract:

When Studio mode keeps persistent chrome visible on ordinary pages:
1. Studio status bar remains fixed.
2. Traveller header/user selector remains fixed and interactive below it.
3. Every overlay modal must begin below both chrome rows.
4. Modal sheet max-height is constrained to the remaining viewport.
5. The rule applies generically to Guide, Moments, Unexpected, Tools/Expense, Mama/Studio and Trip/Booking overlays.

This is an Engine presentation/layout contract, not an Expense or VN-only patch.
