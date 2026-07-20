# Stage 10A — Supabase Expenses Sync

## One-time Supabase setup

1. Open Supabase SQL Editor.
2. Run `SUPABASE_STAGE_10A_EXPENSES_SETUP.sql`.
3. Open **Authentication → Providers**.
4. Enable **Anonymous Sign-Ins**.

## Behaviour

- Each expense is stored as its own `trip_expenses` row.
- Add, edit and delete are local-first and continue working offline.
- When online, the app signs the browser in anonymously and synchronises every 30 seconds, when the page becomes visible, and after each change.
- Deletes use `deleted_at` tombstones, preventing deleted expenses from returning on another device.
- Existing local expenses receive stable UUIDs automatically and are uploaded on first successful sync.

## Test

1. Open Expenses on MEL and add a small test expense.
2. Wait for **Synced across families**.
3. Open or refresh Expenses on SYD/NTL and press **Sync now**.
4. Edit the same expense on one device and verify the change appears on the other.
5. Delete it and verify it disappears on the other device.
