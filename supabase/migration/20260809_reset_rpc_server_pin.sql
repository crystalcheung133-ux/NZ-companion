-- Travel Engine 25.4.18-Lite
-- Private-trip appropriate hardening: protect destructive Reset server-side.

drop function if exists public.reset_trip(text);

create or replace function public.reset_trip(p_trip_id text, p_admin_pin text)
returns table(new_generation integer, deleted_expenses integer, deleted_moments integer)
language plpgsql security definer set search_path=public,extensions,pg_temp
as $$
declare v_cfg public.trip_publish_config%rowtype; v_new integer; v_e integer; v_m integer;
begin
  if auth.uid() is null then raise exception 'Authenticated session required' using errcode='42501'; end if;
  select * into v_cfg from public.trip_publish_config where trip_id=p_trip_id and enabled=true;
  if not found or p_admin_pin is null or crypt(p_admin_pin,v_cfg.pin_hash)<>v_cfg.pin_hash then
    raise exception 'Invalid Trip Studio credential' using errcode='42501';
  end if;
  perform 1 from public.trip_generation where trip_id=p_trip_id for update;
  insert into public.trip_generation(trip_id,generation,reset_at,reset_by)
  values(p_trip_id,1,now(),auth.uid())
  on conflict(trip_id) do update set generation=public.trip_generation.generation+1,reset_at=now(),reset_by=auth.uid()
  returning generation into v_new;
  delete from public.trip_expenses where trip_id=p_trip_id; get diagnostics v_e=row_count;
  delete from public.trip_moments where trip_id=p_trip_id; get diagnostics v_m=row_count;
  return query select v_new,v_e,v_m;
end $$;

revoke all on function public.reset_trip(text,text) from public,anon;
grant execute on function public.reset_trip(text,text) to authenticated;
