# NZ RC25.7.39 Field Ownership Audit

Baseline: RC25.7.38 / Engine 25.7.1.

## Booking
Audit principle: keep structured fields only where runtime behavior needs structure; keep place/contact fields convenient in Booking; consolidate human-only operational prose into Notes.

Changes in this candidate:
- Removed Guests / room occupancy from Accommodation Studio editor. Existing data remains readable/displayable.
- Removed the Booking Time editor beside Related day. Existing booking time remains canonical data/display; Timeline owns itinerary event time editing.
- Removed Charge date from Studio and Payment detail presentation. Existing source value is retained for backward compatibility.
- Removed standalone Cancellation editor and detail section. Existing cancellation text is surfaced in Notes / important information and is migrated into Notes on the next Booking save.
- Removed Discount label editor. Discount amount remains structured; Cashback is now presented/edited as Discount / Cashback rather than requiring a separate label field.
- Parking, arrival/check-in instructions, booking-method note and FX note remain consolidated into Notes from RC25.7.38.
- Address, Phone and Website remain convenient Booking fields and continue to feed linked Guide place facts.

## Guide
NZ currently has no independent Guide Studio content editor. Guide is a presentation/resolve surface over deploy Guide data plus linked Booking place facts. Address/Phone/Website already resolve from the linked Booking first where applicable. Adding a second Guide editor before a canonical shared Place writer would recreate duplicate authority, so RC25.7.39 does not add one.

Future Guide Studio contract: Description + Useful info, with Address/Phone/Website editing writing the same canonical Place facts used by Booking.

## Timeline
Timeline Studio owns authored itinerary time/order/details/travel note. Booking's Related day remains the relationship key; the redundant Booking Time editor was removed. Derived next-stop/directions/context remain derived rather than duplicated as Booking/Guide fields.

## Trip
Trip identity/settings remain code-owned in this candidate. Moving them to editable settings requires a persisted Trip Settings authority and migration; it is intentionally not mixed into this Booking field-reduction release.
