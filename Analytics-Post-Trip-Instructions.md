# NZ Companion — Post-Trip Analytics Instructions

1. Run `ANALYTICS-SCHEMA.sql` in the existing NZ Supabase project before traveller use. Do not replace or modify the operational Expenses, Moments, Publication or Generation tables.
2. During the trip, no action is required. Events are queued locally when offline and retried after reconnect. Analytics failure never blocks the Companion.
3. After the trip, use Supabase SQL Editor and always start traveller analysis with:

```sql
where trip_id = 'nz-family-2026' and actor_type = 'traveller'
```

Useful queries:

```sql
-- Pages used most
select page_type, count(*) as opens
from public.trip_analytics_events
where trip_id='nz-family-2026' and actor_type='traveller' and event_type='page_view'
group by page_type order by opens desc;

-- Days opened most
select entity_id as day, count(*) as opens
from public.trip_analytics_events
where trip_id='nz-family-2026' and actor_type='traveller'
  and entity_type='day' and event_type in ('page_view','day_open')
group by entity_id order by opens desc;

-- Guide cards/categories
select entity_id as guide_id, metadata->>'category' as category, count(*) as opens
from public.trip_analytics_events
where trip_id='nz-family-2026' and actor_type='traveller' and event_type='guide_open'
group by entity_id, metadata->>'category' order by opens desc;

-- Feature actions
select event_type, count(*) as uses
from public.trip_analytics_events
where trip_id='nz-family-2026' and actor_type='traveller'
  and event_type in ('navigate_use','options_open','booking_centre_open','expense_entry_open')
group by event_type order by uses desc;

-- Traveller differences
select traveller_id, event_type, count(*) as uses
from public.trip_analytics_events
where trip_id='nz-family-2026' and actor_type='traveller'
group by traveller_id,event_type order by traveller_id,uses desc;

-- Before vs during vs after trip (NZ trip dates 22 Sep–1 Oct 2026)
select case
  when occurred_at < timestamptz '2026-09-22 00:00:00 Pacific/Auckland' then 'before trip'
  when occurred_at < timestamptz '2026-10-02 00:00:00 Pacific/Auckland' then 'during trip'
  else 'after trip' end as period,
  count(*) as events
from public.trip_analytics_events
where trip_id='nz-family-2026' and actor_type='traveller'
group by period;
```

For CSV export, run a filtered query in Supabase Table Editor / SQL Editor and export the result. Admin/Studio records are retained only for diagnostics and must not be mixed into traveller metrics.

## Analytics v1.2 interpretation note
Expenses and Moments entry is counted from `event_type='page_view'` with `page_type='Expenses'` or `page_type='Moments'`. Do not look for separate `expenses_open` or `moments_open` events. Action-level events remain separate.
