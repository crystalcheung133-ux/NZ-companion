# RC25.0.1 Implementation Report

## Fix
- Corrected Guide → Booking lookup from the nonexistent `BOOKING_AUTHORITY.byId()` method to the canonical `BOOKING_AUTHORITY.get()` method.
- Preserved the existing stacked modal flow: Guide remains underneath, Booking opens above it, and closing Booking reveals the original Guide card.
- Bumped the service-worker cache key and release version.
- Added a UX contract assertion to prevent this API mismatch from returning.

## Root cause
The Guide Booking button rendered correctly, but its click handler returned immediately because `BOOKING_AUTHORITY.byId` does not exist. The authority exposes `get(id)`.
