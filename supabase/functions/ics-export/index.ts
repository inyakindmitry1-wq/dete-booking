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
      return new Response('Missing parameters', { status: 400 });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: booking } = await supabaseAdmin
      .from('bookings')
      .select('*, tenant:tenants(name, city, address), service:services(name), resource:resources(name)')
      .eq('id', bookingId)
      .eq('access_token_hash', tokenHash)
      .single();

    if (!booking) {
      return new Response('Booking not found', { status: 404 });
    }

    const dtStart = new Date(booking.start_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dtEnd = new Date(booking.end_time).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Auto Booking PWA//Detaling Studio//RU',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${booking.id}@autobooking`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${booking.service_name_snapshot} - ${booking.tenant?.name}`,
      `DESCRIPTION:Пост: ${booking.resource?.name}\\nСтоимость: ${booking.price_snapshot} руб.`,
      `LOCATION:${booking.tenant?.city}, ${booking.tenant?.address}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    return new Response(icsContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="booking-${booking.id.slice(0, 8)}.ics"`,
      },
    });
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
});
