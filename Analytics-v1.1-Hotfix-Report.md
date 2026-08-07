# NZ Companion — Analytics System v1.1 Hotfix Report

Date: 2026-08-07
Baseline: NZ Companion RC25.2.5 + Analytics System v1

## Production issue found

Analytics System v1 queued events correctly but attempted to sync them with Supabase `.upsert()` while the analytics SQL intentionally granted the authenticated browser role INSERT only and revoked SELECT/UPDATE/DELETE. That write-method / database-permission contract was inconsistent and could leave the analytics table empty while the Companion continued to work normally.

The original mocked analytics CI verified queue/retry behaviour but did not exercise the real Supabase privilege contract, so it did not catch this mismatch.

## Fix

- Replaced analytics bulk `.upsert()` with INSERT-only sync.
- Kept the existing privacy/security SQL unchanged: browser analytics still has INSERT only; no SELECT/UPDATE/DELETE grant is required.
- Added duplicate recovery: if a retry encounters primary-key duplicate event IDs (`23505`), rows are retried individually and duplicates are treated as already delivered, preventing a queue from becoming permanently stuck.
- Bumped analytics script cache token and service-worker cache version to `analytics-v1-1` so deployed clients fetch the hotfix rather than retaining the first analytics runtime.
- Added a dedicated CI permission-contract test that fails if analytics uses `.upsert()` while the SQL remains INSERT-only.

## Regression result

16/16 automated gates PASS, including existing production regressions, Analytics v1.1 queue/reconnect/write-failure behaviour, and the new Supabase permission contract.

## Supabase action required

None. Do not change or loosen the Analytics System v1 SQL/RLS already installed. The v1.1 runtime is deliberately aligned to the existing INSERT-only policy.

## Production smoke test

After deploying v1.1, hard refresh/reopen the Companion, choose a traveller, open Home/Day/Guide, wait a few seconds, then refresh `public.trip_analytics_events` in Supabase. New rows should appear. Existing locally queued v1 events should also flush once the v1.1 runtime loads and a valid Supabase session is available.
