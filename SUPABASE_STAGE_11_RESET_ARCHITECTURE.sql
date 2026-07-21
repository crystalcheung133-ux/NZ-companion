-- NZ Companion — Stage 11: Reset Architecture Root Repair (RC11R4)
-- Run this AFTER SUPABASE_STAGE_10AB_SYNC_SETUP.sql. It does not touch
-- trip_publications or planner_reviews, and it is safe to re-run.
--
-- What this adds:
--   1. trip_generation — one row per trip, holding the current "generation"
--      counter. Reset increments it. This is the single fact that lets any
--      client tell "the trip was reset" apart from "I just have offline edits".
--   2. reset_trip(trip_id) — a SECURITY DEFINER RPC that bumps the
--      generation and deletes all expenses + moments for that trip in one
--      database transaction. Nothing about a reset is a multi-step client
--      operation anymore; the destructive part is one atomic call.
--   3. A generation column + trigger on trip_expenses / trip_moments that
--      rejects any row whose stamped generation isn't the trip's CURRENT
--      generation. This is the server-side backstop: even if a client bug
--      resurrects stale local rows and tries to push them, the database
--      itself refuses the write. Validation is not only a frontend check.

create extension if not exists pgcrypto;

-- 1. Generation counter -------------------------------------------------

create table if not exists public.trip_generation (
  trip_id text primary key,
  generation integer not null default 1,
  reset_at timestamptz,
  reset_by uuid
);

insert into public.trip_generation (trip_id, generation)
values ('nz-family-2026', 1)
on conflict (trip_id) do nothing;

alter table public.trip_generation enable row level security;
grant select on public.trip_generation to authenticated;
revoke all on public.trip_generation from anon;

drop policy if exists "NZ trip members read generation" on public.trip_generation;
create policy "NZ trip members read generation" on public.trip_generation
  for select to authenticated using (trip_id = 'nz-family-2026');

-- No insert/update/delete policy is granted to `authenticated` on purpose.
-- The generation counter is only ever written inside reset_trip() below,
-- which runs as SECURITY DEFINER (table owner), never directly from a client.

-- 2. Generation column + server-side rejection of stale writes ----------

alter table public.trip_expenses add column if not exists generation integer;
alter table public.trip_moments add column if not exists generation integer;

create or replace function public.stamp_trip_generation()
returns trigger
language plpgsql
as $$
declare
  current_gen integer;
begin
  select generation into current_gen
  from public.trip_generation
  where trip_id = new.trip_id;

  if current_gen is null then
    -- No generation row yet for this trip_id (shouldn't happen for
    -- nz-family-2026 after the seed insert above, but fail safe rather
    -- than silently accepting an unstamped write for an unknown trip).
    raise exception 'No trip_generation row for trip_id %; cannot validate write', new.trip_id;
  end if;

  if new.generation is null then
    raise exception 'Rejected: row for trip % submitted with no generation stamp' , new.trip_id
      using errcode = '23514';
  end if;

  if new.generation <> current_gen then
    raise exception 'Rejected: row generation % does not match current trip generation % (trip has been reset since this record was created)', new.generation, current_gen
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trip_expenses_stamp_generation on public.trip_expenses;
create trigger trip_expenses_stamp_generation
  before insert or update on public.trip_expenses
  for each row execute function public.stamp_trip_generation();

drop trigger if exists trip_moments_stamp_generation on public.trip_moments;
create trigger trip_moments_stamp_generation
  before insert or update on public.trip_moments
  for each row execute function public.stamp_trip_generation();

-- Existing rows created before this migration have no generation stamp.
-- Backfill them to the trip's current generation so the trigger's UPDATE
-- path doesn't reject the very next edit to an old row.
update public.trip_expenses e
set generation = g.generation
from public.trip_generation g
where e.trip_id = g.trip_id and e.generation is null;

update public.trip_moments m
set generation = g.generation
from public.trip_generation g
where m.trip_id = g.trip_id and m.generation is null;

-- 3. Atomic reset RPC -----------------------------------------------------

create or replace function public.reset_trip(p_trip_id text)
returns table(new_generation integer, deleted_expenses integer, deleted_moments integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_gen integer;
  v_deleted_expenses integer;
  v_deleted_moments integer;
begin
  if p_trip_id is null or length(trim(p_trip_id)) = 0 then
    raise exception 'trip_id is required';
  end if;

  -- Lock the generation row for the duration of this transaction so two
  -- concurrent reset attempts (or a reset racing an in-flight sync) can't
  -- interleave. Everything below happens under this lock, in one
  -- transaction: either the whole reset lands, or none of it does.
  perform 1 from public.trip_generation where trip_id = p_trip_id for update;

  insert into public.trip_generation (trip_id, generation, reset_at, reset_by)
  values (p_trip_id, 1, now(), auth.uid())
  on conflict (trip_id) do update
    set generation = public.trip_generation.generation + 1,
        reset_at = now(),
        reset_by = auth.uid()
  returning generation into v_new_gen;

  delete from public.trip_expenses where trip_id = p_trip_id;
  get diagnostics v_deleted_expenses = row_count;

  delete from public.trip_moments where trip_id = p_trip_id;
  get diagnostics v_deleted_moments = row_count;

  -- Note: trip_moments/trip_expenses rows are the only server-side "sync
  -- metadata" this schema has (each device's own cloudSyncMeta / tombstone
  -- caches live client-side under localStorage and are cleared by the
  -- client after this RPC returns — see reset-runtime.js).

  return query select v_new_gen, v_deleted_expenses, v_deleted_moments;
end;
$$;

revoke all on function public.reset_trip(text) from public;
grant execute on function public.reset_trip(text) to authenticated;

-- Storage (trip-moments bucket) photo deletion is intentionally NOT done
-- inside this RPC. Deleting rows from storage.objects does not reliably
-- purge the underlying object bytes; the supported way to delete Storage
-- objects is the Storage API (client().storage.from(bucket).remove(paths)),
-- which reset-runtime.js calls as its own verified step, sequenced AFTER
-- this RPC has already bumped the generation (see RC11R4 Root Cause Report).
