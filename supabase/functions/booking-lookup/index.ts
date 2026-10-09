import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const bookingId = url.searchParams.get('id');
    const tokenHash = url.searchParams.get('token_hash');

    if (!bookingId || !tokenHash) {
      return new Response(JSON.stringify({ error: 'Missing booking ID or token hash' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*, customer:customers(name, phone, car_model, car_plate), service:services(name, price, duration_minutes), resource:resources(name)')
      .eq('id', bookingId)
      .eq('access_token_hash', tokenHash)
      .maybeSingle();

    if (error || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(booking), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
