# NZ Companion — Real-Device Acceptance Plan
Target: complete before production freeze.

## Devices
Use at least:
- Lee family phone
- Fowlers family phone
- Yau family phone
Prefer a mix of iPhone Safari/PWA and Android Chrome/PWA if available.

## Do NOT test Reset against the real production trip data
Reset must be tested only on a staging/test trip_id or isolated Supabase environment.

## Core pass
On each device:
1. Fresh-open Companion and select the correct family.
2. Close browser/app completely; reopen and confirm family remains selected.
3. Browse Home → Day Timeline → Guide → Trip bookings → Expenses → Moments.
4. Add one test expense, edit it, reload, confirm persistence.
5. Add one Moment with a real camera photo.
6. Close app before sync completes, reopen, confirm no lost/duplicated Moment.
7. Turn on airplane mode:
   - open cached pages;
   - add a Moment/photo;
   - add an expense if UI permits.
8. Restore network:
   - confirm pending Moment/photo syncs once;
   - confirm no duplicate expense;
   - confirm no stale banner remains.
9. Booking: open, edit allowed field/status on staging data, reload, verify.
10. Test large text / screen zoom and portrait orientation for clipped labels.

## Separate destructive test on staging
1. Seed at least 2 expenses + 2 photos from Device A.
2. Put Device B offline with old data.
3. Run Reset from the staging admin device.
4. Bring Device B online.
5. Confirm old rows/photos do not resurrect.
6. Confirm generation advances and both devices converge to clean state.

## Acceptance rule
A core flow is not accepted because "it worked once".
It passes only if:
- reload preserves expected state;
- offline→online does not duplicate;
- another family device sees the expected synchronized result.
