# NZ Companion — Analytics System v1.2 Cleanup Report

Date: 2026-08-07
Baseline: Analytics System v1.1 Full Deploy

## Scope
Schema-normalisation only. No traveller UI, trip content, booking, expenses logic, moments logic, Studio/Admin behaviour, or operational Supabase tables were changed.

## Change
- Removed dedicated `expenses_open` event. Expenses page entry is represented by `page_view` with `page_type=Expenses`.
- Removed dedicated `moments_open` event. Moments page entry is represented by `page_view` with `page_type=Moments`.
- Kept action-level analytics unchanged, including Guide, Day, Navigate, Booking, Options/Alternatives and expense-entry actions.
- Bumped service-worker cache key from analytics-v1-1 to analytics-v1-2.
- No Supabase SQL/schema change required.

## Analysis rule
Use `page_view` for page-entry metrics; use specific event types only for product actions. This prevents double-counting page visits and simplifies post-trip analysis.
