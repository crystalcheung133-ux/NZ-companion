-- NZ Companion — Analytics System v1
-- Run once in the existing Supabase project SQL Editor.
-- Analytics is isolated from operational Trip/Expenses/Moments tables.

create table if not exists public.trip_analytics_events (
  event_id text primary key,
  trip_id text not null,
  traveller_id text not null,
  session_id text not null,
  actor_type text not null check (actor_type in ('traveller','admin')),
  event_type text not null,
  page_type text not null,
  entity_type text null,
  entity_id text null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now()
);

create index if not exists trip_analytics_events_trip_time_idx
  on public.trip_analytics_events (trip_id, occurred_at);
create index if not exists trip_analytics_events_trip_event_idx
  on public.trip_analytics_events (trip_id, event_type);
create index if not exists trip_analytics_events_trip_traveller_idx
  on public.trip_analytics_events (trip_id, traveller_id, occurred_at);

alter table public.trip_analytics_events enable row level security;

-- Existing Companion uses Supabase anonymous auth. Anonymous users receive
-- the authenticated role after signInAnonymously(); they may append analytics
-- but cannot read/update/delete analytics from the browser.
drop policy if exists "analytics_insert_authenticated" on public.trip_analytics_events;
create policy "analytics_insert_authenticated"
  on public.trip_analytics_events
  for insert
  to authenticated
  with check (
    trip_id = 'nz-family-2026'
    and actor_type in ('traveller','admin')
    and jsonb_typeof(metadata) = 'object'
  );

revoke all on public.trip_analytics_events from anon;
revoke select, update, delete on public.trip_analytics_events from authenticated;
grant insert on public.trip_analytics_events to authenticated;

-- Post-trip examples (run in Supabase SQL Editor):
-- Traveller-only page usage:
-- select page_type, count(*) from public.trip_analytics_events
-- where trip_id='nz-family-2026' and actor_type='traveller' and event_type='page_view'
-- group by page_type order by count(*) desc;
--
-- Most opened Guide cards:
-- select entity_id, metadata->>'category' as category, count(*)
-- from public.trip_analytics_events
-- where trip_id='nz-family-2026' and actor_type='traveller' and event_type='guide_open'
-- group by entity_id, metadata->>'category' order by count(*) desc;
