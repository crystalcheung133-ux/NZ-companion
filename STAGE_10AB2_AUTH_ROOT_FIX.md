# Stage 10A+B.2 — Anonymous Auth Root Fix

- Adds one shared Supabase anonymous-auth runtime for Expenses and Moments.
- Uses the exact anonymous sign-in request body used by supabase-js: `data` plus `gotrue_meta_security`.
- Sends both `apikey` and browser-safe publishable-key Authorization headers.
- Persists and refreshes one session instead of creating competing auth requests.
- Exposes real Supabase error messages when authentication fails.
- No SQL changes are required.
