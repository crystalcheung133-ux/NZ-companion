-- Travel Engine 25.7.1 · Trip Documents v1
create table if not exists public.trip_documents (
  id text primary key,
  trip_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.trip_documents enable row level security;
drop policy if exists "documents authenticated read" on public.trip_documents;
drop policy if exists "documents authenticated insert" on public.trip_documents;
drop policy if exists "documents authenticated update" on public.trip_documents;
drop policy if exists "documents authenticated delete" on public.trip_documents;
create policy "documents authenticated read" on public.trip_documents for select to authenticated using (true);
create policy "documents authenticated insert" on public.trip_documents for insert to authenticated with check (true);
create policy "documents authenticated update" on public.trip_documents for update to authenticated using (true) with check (true);
create policy "documents authenticated delete" on public.trip_documents for delete to authenticated using (true);
insert into storage.buckets (id,name,public) values ('trip-documents','trip-documents',true) on conflict (id) do update set public=true;
drop policy if exists "documents storage read" on storage.objects;
drop policy if exists "documents storage insert" on storage.objects;
drop policy if exists "documents storage update" on storage.objects;
drop policy if exists "documents storage delete" on storage.objects;
create policy "documents storage read" on storage.objects for select to authenticated using (bucket_id='trip-documents');
create policy "documents storage insert" on storage.objects for insert to authenticated with check (bucket_id='trip-documents');
create policy "documents storage update" on storage.objects for update to authenticated using (bucket_id='trip-documents') with check (bucket_id='trip-documents');
create policy "documents storage delete" on storage.objects for delete to authenticated using (bucket_id='trip-documents');
