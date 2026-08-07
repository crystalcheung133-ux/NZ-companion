# NZ Companion RC25.2.5 — Analytics System v1 QA / Regression Report

Date: 7 Aug 2026
Baseline: `NZ-Companion-RC25.2.5-Day3-Breakfast-Options-Full-Deploy(1).zip`
Working method: separate extracted copy; uploaded ZIP was not modified.

## Result

**Production regression suite: PASS — 15/15 gates.**

- JS syntax: PASS (43/43 JS files)
- Release checksums / manifest: PASS (64 checksum entries; 63 production runtime files)
- HTML structure: PASS (10/10)
- Entity linkage: PASS
- Guide address integrity: PASS
- Timeline integrity: PASS
- UX contract: PASS
- RC24.7 focused contract: PASS
- RC24.7.2 regression contract: PASS
- RC25.1 contract: PASS
- RC25.1.6 consistency contract: PASS
- RC25.2.2 guide/route contract: PASS
- Runtime production integrity: PASS
- RC25.2.3 admin safe-area contract: PASS
- Analytics System v1 contract: PASS

## Analytics-specific verification

The added `ci-tests/test-analytics-v1.js` verifies:

1. Analytics ON + Supabase available (mocked official client contract) → queued events batch-write successfully: PASS.
2. Offline → event remains locally queued and no operational behaviour depends on sync: PASS.
3. Reconnect → queued events flush: PASS.
4. Analytics write failure → event remains queued; failure is caught and isolated: PASS.
5. Existing traveller identity → `fowlers` family selector correctly becomes `traveller_id`: PASS.
6. Studio/Admin separation → `isAdminMode()` produces `actor_type='admin'`: PASS.
7. Rapid identical event duplicate → suppressed by short duplicate guard; cloud retry also uses `event_id` conflict-safe upsert: PASS.
8. Existing Guide/route/button contracts: PASS through existing regression gates.
9. Mobile modal safe-area / bottom-navigation regression contract: PASS through existing RC25.2.3 and UX gates.
10. No new JS syntax/runtime-integrity failures: PASS.

## Browser interaction status

A real Chromium run was attempted with the available `/usr/bin/chromium` browser through Python Playwright. The execution environment blocked both local HTTP (`http://127.0.0.1:4173`) and `file://` navigation with `net::ERR_BLOCKED_BY_ADMINISTRATOR` before the app could load. Therefore browser interaction testing could not be truthfully completed in this sandbox.

This is recorded as **environment blocked**, not as a browser PASS. The existing repository browser test scripts were not counted as passing because they could not execute here.

Recommended final deployment gate on a normal developer machine: run the existing local browser suite plus one short manual check of Guide → Options → Navigate, Trip/Booking, Expenses modal, Moments, offline/reconnect, and Studio mode with Supabase analytics table installed.

## Regression scope

No layout redesign, Timeline content change, Guide content change, booking data change, expense schema change, Moment content/storage change, Studio workflow refactor, participant/PIN redesign, or operational Supabase table migration was performed.

Analytics writes are asynchronous, bounded, failure-isolated and directed only to `trip_analytics_events`. Operational actions never await analytics success.
