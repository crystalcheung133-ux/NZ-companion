# RC10F — Mobile Moments Photo Upload Repair

## Confirmed state before this repair

- Moment text sync worked in both directions.
- Website photo upload could be read on mobile.
- A photo captured on mobile produced a synced Moment row with `photoPending: true`, while the photo itself remained only in the mobile IndexedDB queue.
- The previous runtime swallowed both the immediate upload exception and every retry exception, so the interface could only say “waiting to sync” without exposing the actual Storage failure.

## Changes

1. Moment photo compression now always outputs JPEG for stable mobile/PWA compatibility.
2. Storage uploads log path, MIME type, byte size, authenticated user ID, status and full error details.
3. Immediate failures remain queued but store `photoSyncError` instead of silently failing.
4. Pending-photo retries now log every attempt and failure.
5. Successful retry clears `photoPending` and `photoSyncError`, writes `photoUrl`, updates the Moment timestamp, then the normal sync flow pushes that updated Moment row.
6. Cache/version tokens were changed so installed PWAs receive the repaired runtimes.

## Validation

1. Deploy RC10F.
2. On mobile, open the installed PWA and accept/reload the update.
3. Create a Moment with a photo.
4. Confirm mobile Console contains `Moment photo upload started` followed by `Moment photo uploaded`.
5. Open Moments on desktop and confirm the photo appears.
6. Toggle mobile offline, create a photo Moment, reconnect, then confirm `Retrying pending moment photos` and successful upload.
