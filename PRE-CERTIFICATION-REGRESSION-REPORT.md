# Pre-Certification Fix Batch Report

Baseline: `Stage3.2H-PORT1-FRONT-INTERACTION1.2`

## Production data corrections

- Day 4 Wānaka breakfast now uses **Scroggin Coffee and Eatery** as the primary choice.
- **Big Fig Wānaka** is the Day 4 breakfast alternative.
- The former Greedy Cow / Federal Diner breakfast pair is restored to the Day 3 breakfast alternatives group.
- Added a full Scroggin Guide Card with verified address, phone, email, website, opening-hours note, venue character and seasonal recommended picks.
- Unified the Queenstown shared stay display name as **Queenstown Airbnb · Tonic Lodge**.

## Portability and ownership fixes

- Expense party selects, split checkboxes and family selector cards are now generated from `TRIP_CONFIG.participants` on every trip, including the current NZ trip.
- Removed the static Lee / Fowlers / Yau selector markup from the eight shared HTML shells.
- Studio PIN and admin identity remain owned by `trip-config.js`; runtime fallbacks for `260922` and `lee` were removed from the admin, Complete Trip and Export paths.
- Runtime now fails closed when admin configuration is absent instead of silently assuming NZ identity or PIN.

## Release hygiene

- Historical Markdown reports were removed from the deploy root.
- Added a persistent executable regression harness under `tests/`.
- Rebuilt the production manifest and SHA-256 checksums from the final shipped bytes.
