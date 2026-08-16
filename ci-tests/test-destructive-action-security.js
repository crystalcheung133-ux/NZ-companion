const fs=require('fs'),assert=require('assert');
const reset=fs.readFileSync('reset-runtime.js','utf8');
const sql=fs.readFileSync('supabase/migration/20260809_reset_rpc_server_pin.sql','utf8');
assert(reset.includes('p_admin_pin:credential'));
assert(sql.includes('drop function if exists public.reset_trip(text)'));
assert(sql.includes("crypt(p_admin_pin,v_cfg.pin_hash)<>v_cfg.pin_hash"));
assert(sql.includes('revoke all on function public.reset_trip(text,text) from public,anon'));
assert(sql.includes('grant execute on function public.reset_trip(text,text) to authenticated'));
console.log('DESTRUCTIVE ACTION SECURITY CONTRACT: PASS');
