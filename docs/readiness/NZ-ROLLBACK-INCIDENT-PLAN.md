# NZ Companion — Trip Rollback / Incident Plan
Prepared: 9 Aug 2026

## Current known production deployment
Vercel project: `nz-companion`
Current production deployment observed during review:
- deployment id: `dpl_6hmrEa9ZKhxC1YmPjB9Q6iargc7N`
- commit message: `25.3.1`
- Git commit: `f6ebc433ea1b31d1ca6e38c77f943a4fe834ce9b`
- state: READY
- marked by Vercel as a rollback candidate at review time.

## Rule during the trip
Do not deploy a new build during the trip unless it fixes a trip-blocking issue.

## If a new Vercel deployment breaks UI
1. Do not Reset Supabase.
2. Roll Vercel back to the last known-good production deployment.
3. Reopen the Companion in browser first before asking family members to reinstall the PWA.
4. If service worker cache still shows the broken build, close/reopen and refresh; only clear site data as a last resort because local unsynced data may exist.

## If Supabase is unavailable
1. Keep using the Companion offline/local mode.
2. Do not repeatedly Reset or reinstall.
3. Leave pending Moments/expenses on-device until connectivity returns.
4. Once online, let sync complete before making structural/admin changes.

## If sync data looks wrong
1. Stop further admin edits.
2. Screenshot the visible state.
3. Record which device/family and approximate time.
4. Do not Reset production as a diagnostic step.
5. Compare server generation and local generation before any cleanup.

## Frozen baseline rule
Before departure, promote one exact Vercel deployment + Git commit + Full Deploy ZIP to `TRIP-FROZEN`.
That exact trio is the rollback baseline. Do not rely on a version nickname alone.
