import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  token: z.string(),
});

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body = await req.json();
    const { token } = requestSchema.parse(body);

    // Get Turnstile secret key from environment
    const secretKey = Deno.env.get('TURNSTILE_SECRET_KEY');
    if (!secretKey) {
      console.error('TURNSTILE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Turnstile not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify token with Cloudflare Turnstile API
    const verifyResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
        }),
      }
    );

    const verifyData = await verifyResponse.json();

    console.log('Turnstile verification result:', verifyData.success ? 'success' : 'failed');

    return new Response(
      JSON.stringify({
        success: verifyData.success,
        challenge_ts: verifyData.challenge_ts,
        hostname: verifyData.hostname,
        'error-codes': verifyData['error-codes'] || [],
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in verify-turnstile:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Verification failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});