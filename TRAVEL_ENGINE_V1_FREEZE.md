# CCMV Travel Engine v1.0 — Frozen Baseline

## Status

**FROZEN · DEVICE REGRESSION PASSED**

This package records the first stable reusable Travel Engine baseline after completion of the embedded Admin Core.

## Included core

- Reading Mode and embedded Admin Mode
- Edit activity
- Add activity
- Duplicate activity with independent ID
- Delete activity with confirmation
- Move activity within or across days
- One shared pending itinerary draft
- Cross-page draft persistence
- Explicit Save Changes commit
- Full Discard restoration
- Trip, Guide, Days, Moments and Expenses modules
- PWA and offline shell

## Transaction boundary

The Admin transaction controls itinerary data only. Moments and Expenses retain their existing independent storage and are not committed or rolled back by Admin Save / Discard.

## Frozen identifiers

- Product version: `1.0`
- Build/cache identifier: `nz1.0-frozen`
- Baseline: Stage 6A-5 plus completed device regression

## Known non-blocking item

A previously observed Front Page visual issue appeared only in Admin Mode and later cleared without a dedicated runtime change. It did not affect functionality and is not treated as a v1.0 blocker.

## Change rule

Do not edit this archive in place. Every Stage 7 change must:

1. copy this frozen baseline,
2. update the visible version/build marker,
3. assign a new service-worker cache name,
4. modify the active source directly rather than stacking overrides,
5. complete regression before becoming the next baseline.

## Next planned phase

Stage 7 — Generic Travel Engine, beginning with reusable Trip Metadata.
