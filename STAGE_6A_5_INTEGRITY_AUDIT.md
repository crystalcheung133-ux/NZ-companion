# Stage 6A-5 — Admin Draft Integrity Audit

Baseline: `nz0.6rc11k-admin4c`

## Scope

Audit the combined Admin Mode workflow without adding new UI or changing runtime behaviour:

- Edit activity
- Add activity
- Duplicate activity
- Delete activity
- Move activity within a day
- Move activity across days
- Navigate between Day, Trip, Guide, Moments and Expenses while a draft is pending
- Discard the complete draft
- Save the complete draft

## Static integrity checks

### Draft persistence — PASS

All pending operations write through the shared Admin draft key:

`travel_engine_admin_draft_v1`

Normal in-app navigation does not call Save, Discard or a leave-page prompt. The draft is restored from localStorage on the next page.

### Single commit point — PASS

Only `saveAdminChanges()` dispatches `travelengine:adminsave`. Day overrides are written by the Day-page save listener after that explicit event.

### Single discard point — PASS

`discardAdminChanges()` clears the shared draft and dispatches `travelengine:admindiscard`. The Day renderer then reloads the last committed override or original itinerary data.

### Cross-day move — PASS

A move removes the source activity and writes pending arrays for both source and destination days. Both day keys remain inside the same shared draft until Save or Discard.

### Add and duplicate IDs — PASS

New and duplicated activities receive generated IDs rather than reusing the source activity ID. Duplicate begins as an editor session and Cancel creates no pending record.

### Delete recovery — PASS

Delete removes the item only from the pending working array. Before Save, Discard reloads the committed override/original data and restores the item.

### Order integrity — PASS

Add, duplicate and move use explicit insertion indexes. The supported positions remain `Before <activity>` and `End of day`; empty days use first position.

### Overlay / save-bar interaction — PASS

Editor, Move and Delete overlays set `admin-overlay-open`, temporarily hiding the global Save / Discard bar. Closing the overlay restores the bar while keeping the draft dirty.

### Existing Moments and Expenses data — PASS

Admin itinerary draft keys are separate from Moments and Expenses localStorage keys. Admin Save / Discard does not rewrite either module.

## Manual regression checklist

The following device-level sequence remains the final deployment check because mobile Safari layout, keyboard and PWA cache behaviour cannot be fully proven through static source inspection:

1. Edit one activity on Day 1.
2. Add one activity on Day 2.
3. Duplicate one activity on Day 3.
4. Delete one activity on Day 4.
5. Move one activity from Day 1 to Day 3.
6. Visit Trip, Guide, Moments and Expenses.
7. Return to each affected Day and confirm every pending change is still visible.
8. Press Discard and confirm all five changes disappear.
9. Repeat a smaller mixed set and press Save Changes.
10. Reload the PWA and confirm the saved state remains.

## Result

**PASS — Admin Core integrity is structurally ready for device regression.**

No runtime file was changed in Stage 6A-5. The deploy package remains functionally identical to Stage 6A-4C.
