# RC25 Regression Report

## Blocker fixed

**Guide → Booking appeared unresponsive.** Both modals used the same z-index and the Guide modal followed the Trip modal in the DOM, so the newly opened Booking modal was hidden underneath the Guide.

RC25 introduces an explicit stacked-modal state:

- Guide remains at z-index 5000.
- Booking rises to z-index 5100 while opened from Guide.
- Closing Booking removes the stacked state and reveals the original Guide.

## Regression protections

- Direct Guide-card context is preserved.
- No page navigation is introduced.
- Closing Booking does not close Guide.
- Existing Timeline → Guide and alternatives flows are unchanged.
- Existing accommodation, timeline and entity contracts remain green.

## Package cleanup

Legacy implementation/regression reports were removed from the deploy ZIP. Current RC25 reports and the canonical UX rules remain.
