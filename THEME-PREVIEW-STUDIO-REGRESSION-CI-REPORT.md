# Theme Preview Studio v2.1 — Regression / CI Report

## Scope

This release corrects the Theme Preview workflow only. It does not change Engine layout, trip content, navigation, expenses, booking, moments, party handling, exports, Supabase, or canonical storage.

## Functional checks

- Trip Studio contains a compact Theme Preview launcher rather than the full control list.
- Open Inspector enables the overlay and closes Trip Studio.
- Inspector remains available after Trip Studio closes.
- Collapse leaves a `🎨` launcher.
- Close removes the floating UI without changing trip data.
- Inspector defaults to the left side to avoid Vercel Toolbar overlap.
- Mobile rules keep the floating window above bottom navigation and internally scrollable.
- Theme JSON and theme-preview storage namespaces remain isolated from production data.
- Local assets and system/local font stacks only; no new external theme dependency.

## Automated validation

The release was checked with the existing repository CI suite, JavaScript syntax validation, HTML structure validation, production manifest validation, and checksum validation. Final command output is included in the delivery summary.

## Manual deployment checks required

After Vercel preview deployment, verify on desktop and mobile:

1. Hard-refresh once so the `theme-preview-v2-1` cache replaces v2.
2. Open Studio and confirm Theme Preview is one compact launcher card.
3. Press Open Inspector and confirm Studio closes.
4. Confirm the inspector appears on the left side, not under the Vercel Toolbar.
5. Change a colour while viewing the real Companion.
6. Collapse to `🎨`, reopen, and close with `×`.
