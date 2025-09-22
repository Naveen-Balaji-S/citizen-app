// supabase/functions/get-nearby-reports/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

serve(async (req) => {
  try {
    const { latitude, longitude } = await req.json();

    if (!latitude || !longitude) {
      return new Response('Missing latitude or longitude', { status: 400 });
    }

    // Use the standard Supabase environment variables provided by the platform.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    // Use a custom SQL function for geospatial query
    // We'll create this function next.
    const { data: reports, error } = await supabaseClient.rpc('get_nearby_reports', {
      lat: latitude,
      lon: longitude,
    });

    if (error) {
      console.error('Error in Supabase RPC call:', error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ reports }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching nearby reports:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
