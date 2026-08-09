# NZ Companion — Pre-Trip Supabase Security Review
Date: 9 Aug 2026
Status: READ-ONLY AUDIT COMPLETE · REMEDIATION NOT YET APPLIED

## Executive finding
The public anon key itself is not the security problem. The current application signs devices in anonymously, which gives them an authenticated session. Several NZ RLS policies then authorize any authenticated user for the known trip_id rather than checking actual trip membership.

The most serious issue is `reset_trip(p_trip_id text)`: it is a SECURITY DEFINER RPC and is executable by both `anon` and `authenticated`. The function does not itself check admin membership or a server-side admin credential before deleting trip expenses and moments and bumping generation.

Therefore the Studio PIN is currently a UI gate, not a sufficient database security boundary.

## Evidence from live Supabase project
- `supabase-client-runtime.js` uses `auth.signInAnonymously()`.
- `trip_memberships` currently has 0 rows.
- NZ `trip_expenses` and `trip_moments` policies mainly check:
  - `trip_id = 'nz-family-2026'`
  - `auth.uid() IS NOT NULL`
  rather than membership / role.
- NZ Storage policies similarly allow authenticated users for the NZ trip folder.
- `reset_trip` is SECURITY DEFINER, executable by `anon` and `authenticated`, and has no admin authorization check inside the function.
- Supabase Security Advisor flags public/signed-in execution of SECURITY DEFINER functions and anonymous-access policies.

## Severity
### Critical before trip
1. Protect `reset_trip` server-side.
2. Decide the real authorization model for NZ anonymous devices.

### High
3. Restrict destructive DELETE on expenses / moments to an actual admin authorization rule.
4. Tighten Storage update/delete policies.

### Medium
5. Review public EXECUTE on helper SECURITY DEFINER functions.
6. Fix mutable search_path warning on `stamp_trip_generation`.
7. Enable leaked-password protection if password-based accounts are introduced.

## Recommended model
For the existing lightweight Companion, the lowest-disruption design is:
- Keep anonymous sign-in for normal family devices.
- Create server-side trip membership / device registration rather than treating any authenticated anonymous user as a trip member.
- Require an explicit server-verified admin credential for destructive RPCs such as Reset.
- Keep the 6-digit Studio PIN only as a convenience UI lock; never trust it alone for database authorization.

## Important
No database policy or RPC was changed during this audit. This is deliberate: changing RLS / Reset authorization needs a coordinated client + database migration and a staging test first.
