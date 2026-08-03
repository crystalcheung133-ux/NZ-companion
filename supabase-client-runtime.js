/* supabase-client-runtime.js — Stage 10A Root Cause Fix
   Single shared Supabase client built on the OFFICIAL @supabase/supabase-js SDK.
   Replaces supabase-auth-runtime.js (removed), which hand-rolled raw POST requests
   to /auth/v1/signup and /auth/v1/token — an unofficial reimplementation of GoTrue's
   auth protocol that produced 422 Unprocessable Content and never yielded a session.

   Contract:
     createClient()  → one client, reused by Expenses and Moments
       ↓
     auth.getSession()   → returns existing session if still valid
       ↓ (none)
     auth.signInAnonymously()
       ↓
     session persisted by the SDK itself (localStorage), reused on next call

   Expenses and Moments both call SUPABASE.getSession() before every request.
   Neither module talks to GoTrue directly — the SDK owns that entirely. */
(function (root) {
  'use strict';

  const config = root.SYNC_CONFIG || {};
  const LOG = '[Supabase]';
  const state = { client: null, sessionPromise: null, lastError: null };

  function configured() {
    return !!(
      config.enabled &&
      config.url &&
      config.anonKey &&
      typeof config.hasCredentials === 'function' &&
      config.hasCredentials()
    );
  }

  function getClient() {
    if (state.client) return state.client;

    if (!configured()) {
      throw new Error('Supabase sync is not configured (missing url/anonKey)');
    }
    if (typeof root.supabase?.createClient !== 'function') {
      // The official SDK (loaded via CDN <script> before this file) did not load.
      const err = new Error(
        'Supabase JS SDK not found on window.supabase — check the CDN <script> tag and network access'
      );
      console.error(LOG, err.message);
      throw err;
    }

    state.client = root.supabase.createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'travel_engine_supabase_auth_v1'
      }
    });
    console.log(LOG, 'Client created for', config.url);
    return state.client;
  }

  async function getSession() {
    // De-duplicate concurrent callers (Expenses + Moments may both ask at once).
    if (state.sessionPromise) return state.sessionPromise;

    state.sessionPromise = (async () => {
      const client = getClient();
      try {
        const { data, error } = await client.auth.getSession();
        if (error) throw error;

        if (data?.session) {
          console.log(LOG, 'Session restored');
          state.lastError = null;
          return data.session;
        }

        console.log(LOG, 'No existing session — requesting anonymous sign-in');
        const { data: signInData, error: signInError } = await client.auth.signInAnonymously();

        if (signInError) {
          console.error(LOG, 'Anonymous sign-in failed:', signInError.message, signInError);
          throw signInError;
        }
        if (!signInData?.session) {
          const err = new Error('Anonymous sign-in returned no session');
          console.error(LOG, err.message);
          throw err;
        }

        console.log(LOG, 'Anonymous session created', signInData.session.user?.id || '');
        state.lastError = null;
        return signInData.session;
      } catch (error) {
        state.lastError = error;
        throw error;
      } finally {
        state.sessionPromise = null;
      }
    })();

    return state.sessionPromise;
  }

  root.SUPABASE = Object.freeze({
    getClient,
    getSession,
    isConfigured: configured,
    getLastError: () => state.lastError
  });

  // Back-compat alias only — no separate login logic, same object.
  root.SUPABASE_AUTH = root.SUPABASE;
})(globalThis);
