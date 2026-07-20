-- NZ Companion — Stage 10A+B: Expenses + Moments Sync
-- Safe scope: creates only trip_expenses, trip_moments and trip-moments storage bucket.
-- Does not alter trip_publications or planner_reviews.

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
create index if not exists trip_expenses_trip_updated_idx on public.trip_expenses (trip_id, updated_at);
alter table public.trip_expenses enable row level security;
grant select, insert, update, delete on public.trip_expenses to authenticated;
revoke all on public.trip_expenses from anon;
drop policy if exists "NZ trip members read expenses" on public.trip_expenses;
create policy "NZ trip members read expenses" on public.trip_expenses for select to authenticated using (trip_id='nz-family-2026');
drop policy if exists "NZ trip members add expenses" on public.trip_expenses;
create policy "NZ trip members add expenses" on public.trip_expenses for insert to authenticated with check (trip_id='nz-family-2026' and auth.uid() is not null);
drop policy if exists "NZ trip members update expenses" on public.trip_expenses;
create policy "NZ trip members update expenses" on public.trip_expenses for update to authenticated using (trip_id='nz-family-2026') with check (trip_id='nz-family-2026' and auth.uid() is not null);
drop policy if exists "NZ trip admin delete expenses" on public.trip_expenses;
create policy "NZ trip admin delete expenses" on public.trip_expenses for delete to authenticated using (trip_id='nz-family-2026' and auth.uid() is not null);

create table if not exists public.trip_moments (
  id uuid primary key default gen_random_uuid(),
  trip_id text not null,
  payload jsonb not null default '{}'::jsonb,
  actor_family text,
  actor_user_id uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists trip_moments_trip_updated_idx on public.trip_moments (trip_id, updated_at);
alter table public.trip_moments enable row level security;
grant select, insert, update, delete on public.trip_moments to authenticated;
revoke all on public.trip_moments from anon;
drop policy if exists "NZ trip members read moments" on public.trip_moments;
create policy "NZ trip members read moments" on public.trip_moments for select to authenticated using (trip_id='nz-family-2026');
drop policy if exists "NZ trip members add moments" on public.trip_moments;
create policy "NZ trip members add moments" on public.trip_moments for insert to authenticated with check (trip_id='nz-family-2026' and auth.uid() is not null);
drop policy if exists "NZ trip members update moments" on public.trip_moments;
create policy "NZ trip members update moments" on public.trip_moments for update to authenticated using (trip_id='nz-family-2026') with check (trip_id='nz-family-2026' and auth.uid() is not null);
drop policy if exists "NZ trip admin delete moments" on public.trip_moments;
create policy "NZ trip admin delete moments" on public.trip_moments for delete to authenticated using (trip_id='nz-family-2026' and auth.uid() is not null);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('trip-moments','trip-moments',true,1048576,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=1048576,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists "NZ trip members upload moment photos" on storage.objects;
create policy "NZ trip members upload moment photos" on storage.objects for insert to authenticated
with check (bucket_id='trip-moments' and (storage.foldername(name))[1]='nz-family-2026');
drop policy if exists "NZ trip members update moment photos" on storage.objects;
create policy "NZ trip members update moment photos" on storage.objects for update to authenticated
using (bucket_id='trip-moments' and (storage.foldername(name))[1]='nz-family-2026')
with check (bucket_id='trip-moments' and (storage.foldername(name))[1]='nz-family-2026');


drop policy if exists "NZ trip admin delete moment photos" on storage.objects;
create policy "NZ trip admin delete moment photos" on storage.objects for delete to authenticated
using (bucket_id='trip-moments' and (storage.foldername(name))[1]='nz-family-2026' and auth.uid() is not null);
