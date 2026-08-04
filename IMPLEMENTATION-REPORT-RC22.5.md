# NZ Companion RC22.5 Implementation Report

## Guide
- Removed the Astro Cafe guide entity and all navigation references.
- Dining guide cards are grouped by Day, matching the Sights day-group pattern.
- Stay guide lists confirmed accommodation only.
- Stay entries open the canonical Trip Accommodation detail card, avoiding duplicated hotel detail pages.
- Accommodation detail cards now include an "About this stay" section sourced from Guide content, while booking/payment fields remain owned by Trip Accommodation.
- Ultimate Alpine Experience guide content now explains the helicopter + ski-plane flight and alpine snow landing without price or check-in time.

## Timeline
- Day 3 label changed to "Helicopter + Ski Plane Glacier Flight".
- Removed traveller confirmation and price content from the timeline.
- Kept operational weather, clothing and safety reminders.

## Trip
- Rental Car now shows total AUD 524.66, deposit paid AUD 11.61 and AUD 513.05 due at pickup.

## Verification
- JavaScript syntax: PASS
- Release checksums and production manifest: PASS
- HTML structure: PASS
- Entity linkage: PASS
- Guide address integrity: PASS
