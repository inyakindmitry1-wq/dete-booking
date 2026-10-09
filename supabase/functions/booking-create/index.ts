import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const body = await req.json();
    const {
      tenant_slug,
      service_id,
      start_time,
      customer_name,
      customer_phone,
      car_model,
      car_plate,
      customer_notes,
      idempotency_key,
      access_token_hash,
    } = body;

    if (!tenant_slug || !service_id || !start_time || !customer_name || !customer_phone) {
      return new Response(
        JSON.stringify({ error: 'Missing required booking fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabaseAdmin.rpc('create_booking_atomic', {
      p_tenant_slug: tenant_slug,
      p_service_id: service_id,
      p_start_time: start_time,
      p_customer_name: customer_name,
      p_customer_phone: customer_phone,
      p_car_model: car_model || null,
      p_car_plate: car_plate || null,
      p_customer_notes: customer_notes || null,
      p_idempotency_key: idempotency_key || null,
      p_access_token_hash: access_token_hash || null,
    });

    if (error) {
      console.error('Database RPC error:', error);
      const status = error.message.includes('CONFLICT') || error.code === '23P01' ? 409 : 400;
      return new Response(JSON.stringify({ error: error.message }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
