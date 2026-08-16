import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type' };
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

function constantTimeEqual(left: string, right: string) {
  const encoder = new TextEncoder(), a = encoder.encode(left), b = encoder.encode(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index++) difference |= (a[index % (a.length || 1)] || 0) ^ (b[index % (b.length || 1)] || 0);
  return difference === 0;
}
async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2,'0')).join('');
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return respond({ ok: false, code: 'invalid_payload' }, 405);
  try {
    const body = await request.json();
    const tripId = String(body.tripId || '');
    const partyId = String(body.partyId || '');
    const suppliedToken = String(body.tripAccessToken || '');
    if (!tripId || !partyId || !suppliedToken) return respond({ ok: false, code: 'invalid_payload' }, 400);

    const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const { data: access, error: accessError } = await client.from('trip_booking_access').select('trip_id,booking_mode,admin_party_id,access_token_hash,enabled').eq('trip_id', tripId).maybeSingle();
    if (accessError) return respond({ ok: false, code: 'internal_error' }, 500);

    let mode = 'admin';
    let adminPartyId = '';
    if (access && access.enabled) {
      const suppliedHash = await sha256(suppliedToken);
      if (!constantTimeEqual(suppliedHash, String(access.access_token_hash || ''))) return respond({ ok: false, code: 'invalid_trip_token' }, 403);
      mode = access.booking_mode === 'collaborative' ? 'collaborative' : 'admin';
      adminPartyId = String(access.admin_party_id || '');
    } else {
      // Backward-compatible fallback for the pre-25.2.8 VN deployment.
      const expectedTrip = Deno.env.get('CCMV_VN_TRIP_ID') || 'ccmv-vietnam-2026';
      const expectedToken = Deno.env.get('CCMV_VN_TRIP_ACCESS_TOKEN') || '';
      if (tripId !== expectedTrip || !expectedToken || !constantTimeEqual(suppliedToken, expectedToken)) return respond({ ok: false, code: 'invalid_trip_token' }, 403);
      mode = 'admin';
      adminPartyId = 'party-crystal';
    }

    const { data: party } = await client.from('parties').select('party_id').eq('trip_id', tripId).eq('party_id', partyId).eq('is_active', true).maybeSingle();
    if (!party) return respond({ ok: false, code: 'invalid_party' }, 403);

    if (body.action === 'read') {
      let query = client.from('bookings').select('*').eq('trip_id', tripId).order('day_number', { ascending: true }).order('booking_time', { ascending: true });
      if (body.bookingId) query = query.eq('booking_id', String(body.bookingId));
      const { data: rows, error } = await query;
      if (error) return respond({ ok: false, code: 'internal_error' }, 500);
      return respond({ ok: true, mode, rows: rows || [] });
    }

    if (!body.mutation?.mutationId || body.mutation?.domain !== 'booking' || body.mutation?.tripId !== tripId) return respond({ ok: false, code: 'invalid_payload' }, 400);
    if (mode === 'admin' && partyId !== adminPartyId) return respond({ ok: false, code: 'booking_admin_required' }, 403);
    if (['update', 'delete'].includes(body.mutation.operation) && !Number.isInteger(body.mutation.baseVersion)) return respond({ ok: false, code: 'invalid_payload' }, 400);

    const { data, error } = await client.rpc('ccmv_booking_sync_mutate', { p_trip_id: tripId, p_party_id: partyId, p_mutation: body.mutation });
    if (error) return respond({ ok: false, code: 'internal_error' }, 500);
    if (!data?.ok) return respond(data, data?.code === 'version_conflict' ? 409 : 400);

    const bookingId = String(body.mutation.recordId || '');
    if (bookingId && body.mutation.operation !== 'delete') {
      const payload = { ...(body.mutation.payload || {}), id: bookingId, bookingId };
      const { error: payloadError } = await client.from('bookings').update({ payload }).eq('trip_id', tripId).eq('booking_id', bookingId);
      if (payloadError) return respond({ ok: false, code: 'internal_error' }, 500);
    }
    if (bookingId) {
      const { data: canonical, error: canonicalError } = await client.from('bookings').select('*').eq('trip_id', tripId).eq('booking_id', bookingId).maybeSingle();
      if (canonicalError) return respond({ ok: false, code: 'internal_error' }, 500);
      return respond({ ...data, record: canonical });
    }
    return respond(data);
  } catch {
    return respond({ ok: false, code: 'invalid_payload' }, 400);
  }
});
