-- NZ Companion — Stage 10A Expenses Sync
-- Run once in Supabase SQL Editor.
-- Then enable: Authentication > Providers > Anonymous Sign-Ins.

create extension if not exists pgcrypto;

create table if not exists public.trip_expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null,
  payload jsonb not null default '{}'::jsonb,
  actor_family text,
  actor_user_id uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists trip_expenses_trip_updated_idx
  on public.trip_expenses (trip_id, updated_at);

alter table public.trip_expenses enable row level security;

grant select, insert, update on public.trip_expenses to authenticated;
revoke all on public.trip_expenses from anon;

drop policy if exists "NZ trip members read expenses" on public.trip_expenses;
create policy "NZ trip members read expenses"
on public.trip_expenses for select
to authenticated
using (trip_id = 'nz-family-2026');

drop policy if exists "NZ trip members add expenses" on public.trip_expenses;
create policy "NZ trip members add expenses"
on public.trip_expenses for insert
to authenticated
with check (trip_id = 'nz-family-2026' and auth.uid() is not null);

drop policy if exists "NZ trip members update expenses" on public.trip_expenses;
create policy "NZ trip members update expenses"
on public.trip_expenses for update
to authenticated
using (trip_id = 'nz-family-2026')
with check (trip_id = 'nz-family-2026' and auth.uid() is not null);

comment on table public.trip_expenses is
'Local-first shared family expenses. deleted_at is a sync tombstone; do not hard-delete rows during the trip.';
