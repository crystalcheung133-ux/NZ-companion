# Stage 10A — Root Cause Audit: Expenses & Moments Never Uploaded

## Why the 422 occurred

`supabase-auth-runtime.js` did not use the Supabase JS SDK at all. It manually
constructed a raw `fetch()` POST to `/auth/v1/signup` and `/auth/v1/token`,
reimplementing GoTrue's anonymous-auth protocol by hand:

```js
async function signInAnonymously(){
  return request('/auth/v1/signup',{ data:{}, gotrue_meta_security:{} });
}
```

This is exactly the pattern the audit was asked to find and remove: a
hand-rolled reimplementation of an internal auth endpoint, kept in sync with
the real SDK only by guesswork. GoTrue's `/auth/v1/signup` contract is not a
stable public API — the SDK adjusts the exact request shape, headers, and
key-format handling release to release. The custom runtime's request no
longer matched what this project's GoTrue instance expected, so every call
was rejected with `422 Unprocessable Content` before a session ever existed.
With no session, `expense-sync-runtime.js` and `moment-sync-runtime.js` had no
access token to attach to their own hand-rolled REST calls, so every
`INSERT` was blocked by RLS (`auth.uid() is not null`) before it left the
browser — which is why `trip_expenses` and `trip_moments` stayed empty even
though schema, RLS, and Anonymous Sign-Ins were all correctly configured.

**This was an architecture problem, not a payload problem.** No tweak to the
signup body would have fixed it durably.

## What was replaced

| Removed | Replaced by |
|---|---|
| `supabase-auth-runtime.js` (raw `fetch` to `/auth/v1/signup`, `/auth/v1/token`) | `supabase-client-runtime.js` — one shared client via the official `@supabase/supabase-js` SDK (loaded from CDN), using `auth.getSession()` → `auth.signInAnonymously()` |
| Hand-rolled REST calls in `expense-sync-runtime.js` (`fetch('/rest/v1/trip_expenses...')`) | `client.from('trip_expenses').select()/.upsert()` |
| Hand-rolled REST calls in `moment-sync-runtime.js` (`fetch('/rest/v1/trip_moments...')`) | `client.from('trip_moments').select()/.upsert()` |
| Manual `fetch` PUT to `/storage/v1/object/...` for moment photos | `client.storage.from('trip-moments').upload()` / `.getPublicUrl()` |

Expenses and Moments now share **one** client and **one** session, created
once in `supabase-client-runtime.js` and reused via `root.SUPABASE`. Nothing
else constructs a client or logs in independently.

`trip_publications` Read Sync (`sync-runtime.js`) was **not touched** — it
was already read-only and unauthenticated by design (public select), and
stays exactly as it was.

No SQL changes were needed or made — the existing RLS policies already
correctly require an authenticated `auth.uid()`; they simply never received
one before.

## Why the official SDK now works

- The SDK owns the exact GoTrue request/response contract, including
  whatever the current key format (`sb_publishable_...`) and endpoint
  behaviour require — it isn't guessed at and reimplemented by hand.
- `persistSession: true` + `autoRefreshToken: true` means the session is
  stored and refreshed by the SDK itself; `getSession()` reuses it instead
  of re-authenticating on every request.
- Once signed in, the SDK automatically attaches the correct `Authorization`
  bearer token to every `.from()` and `.storage` call — no manual header
  wiring, so there's no place left for a header mismatch to cause a silent
  RLS rejection.

## Logging added

Every stage now logs to the console, and nothing fails silently:
`Client created`, `Session restored`, `Anonymous session created`,
`Anonymous sign-in failed: <message>`, `Expenses/Moments pulled <n>`,
`Expense/Moment uploaded <id>`, `Supabase select/insert failed <message>`,
`RLS rejected <message>`, `Storage upload failed <message>`.

## Verification checklist

Run these in order after deploying the ZIP and re-registering the service
worker (hard refresh, or clear site data once — the cache name changed):

1. Open **Expenses** on Device A. Console should show, in order:
   `[Supabase] Client created for https://...`, then either
   `Session restored` or `No existing session — requesting anonymous
   sign-in` → `Anonymous session created <uuid>`.
2. Add a test expense. Console shows `Expenses pulled <n>` then
   `Expense uploaded <id>`.
3. Open Supabase Table Editor → `trip_expenses`. The row appears with a
   non-null `actor_user_id`.
4. Open **Expenses** on Device B (or hard-refresh). Console shows
   `Session restored` (or a fresh anonymous session) and `Expenses pulled
   <n>` including the new row. Confirm it renders in the UI.
5. Repeat steps 1–4 for **Moments**, including a photo attachment — confirm
   `Moment photo uploaded <path>` in console and the file appears in the
   `trip-moments` storage bucket.
6. Confirm `trip_publications` Read Sync still works unchanged (Trip/Guide
   pages still hydrate from the last published snapshot).
7. If anything fails, the console error (`Anonymous sign-in failed: ...`,
   `RLS rejected: ...`, `Supabase select failed: ...`) now names the exact
   cause instead of failing silently.

## Not touched, as instructed

- UI, CSS, navigation — unchanged.
- `trip_publications` Read Sync (`sync-runtime.js`) — unchanged.
- SQL schema / RLS policies — unchanged (they were already correct).
