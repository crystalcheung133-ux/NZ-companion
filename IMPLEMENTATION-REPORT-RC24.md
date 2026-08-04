# RC24 — UX Freeze

## Trip / Guide separation
- Accommodation Trip cards are now compact operational check-in cards.
- Removed About this stay, facilities/nearby duplication, hotel/operator phone,
  email and official website from Trip.
- Guide remains the knowledge layer and retains official place information.
- Accommodation actions are reduced to Guide, Navigate, Copy Address and Studio Edit.

## Studio
- Removed the recurring Studio selector arrow.
- PIN opens Trip Studio directly.
- × closes the workspace while keeping the Studio session active.
- Leave Studio Mode exits the privileged session.

## Permissions
- Expenses and Moments are editable/deletable by their owner party or Trip Studio.
- Other parties see view-only entries.
- Every delete now requires confirmation.
- New Expenses store `createdBy`; legacy entries fall back to `paidBy`.

## Governance
- Added Travel Engine UX Rules v1.0.
- Added a UX contract CI test.
