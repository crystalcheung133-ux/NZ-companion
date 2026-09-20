-- Travel Engine 25.7.1 · Booking Authority single-writer sync
create table if not exists public.trip_bookings (
  id text primary key,
  trip_id text not null,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.trip_bookings enable row level security;
grant select, insert, update on table public.trip_bookings to authenticated;
drop policy if exists "bookings authenticated read" on public.trip_bookings;
drop policy if exists "bookings authenticated insert" on public.trip_bookings;
drop policy if exists "bookings authenticated update" on public.trip_bookings;
create policy "bookings authenticated read" on public.trip_bookings for select to authenticated using (true);
create policy "bookings authenticated insert" on public.trip_bookings for insert to authenticated with check (true);
create policy "bookings authenticated update" on public.trip_bookings for update to authenticated using (true) with check (true);
