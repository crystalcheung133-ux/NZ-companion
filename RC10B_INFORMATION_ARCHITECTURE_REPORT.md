# RC10B — Day · Guide · Trip Info Refactor

## Completed

- Day accommodation activities now use one concise line: `Check in for X night(s).`
- Guide → Stay remains in place and now focuses on the stay experience rather than booking references, room details or confirmation status.
- Trip → Accommodation now renders five detailed accommodation cards from `BOOKINGS_DATA`, keeping booking information in one canonical source.
- Each accommodation card shows stay dates, number of nights, room type, check-in, check-out, booking reference, price, address and check-in instructions.
- Navigate, Copy Address and Call actions remain available where the source data contains them.
- Accommodation price is visible to every Companion user. Prices not yet present in the source are honestly shown as `Not added yet`; no amounts were invented.
- Service-worker cache and displayed build version were advanced to RC10B.

## Information architecture

- **Day:** what the group needs to do today.
- **Guide:** why a place is worth visiting, eating at or staying in.
- **Trip Info:** confirmed booking and operational details.

## Files modified

- `data.js`
- `trip-runtime.js`
- `styles.css`
- `trip-config.js`
- `sw.js`
- `VERSION.txt`

## Verification

- JavaScript syntax checked with Node.
- Accommodation renderer generated five cards.
- All five cards include a visible Price field.
- All five hotel check-in activities use the concise night-count description.
- Existing Trip Info and Guide linkage remains driven by each Day item’s `bookingId` and `placeId`.
