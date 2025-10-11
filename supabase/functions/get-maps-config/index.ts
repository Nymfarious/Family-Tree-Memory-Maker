import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getEnvWithVariants, logAllEnvVars, normalizeSecretName } from "../_shared/env-utils.ts";

const FUNCTION_NAME = 'get-maps-config';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${FUNCTION_NAME}] Request received: ${req.method}`);

  if (req.method === 'OPTIONS') {
    console.log(`[${timestamp}] [${FUNCTION_NAME}] Handling CORS preflight`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[${timestamp}] [${FUNCTION_NAME}] Starting Maps API configuration retrieval`);

    // Try multiple common naming conventions for Google Maps API Key
    const googleMapsVariants = normalizeSecretName('GOOGLE_MAPS');
    const mapsApiVariants = normalizeSecretName('MAPS_API');
    const allVariants = [...googleMapsVariants, ...mapsApiVariants];

    console.log(`[${timestamp}] [${FUNCTION_NAME}] Searching for Maps API key in ${allVariants.length} variants`);

    const apiKeyResult = getEnvWithVariants(allVariants, {
      functionName: FUNCTION_NAME,
      logLevel: 'warn',
      maskValue: true
    });

    if (!apiKeyResult.found || !apiKeyResult.value) {
      console.error(`[${timestamp}] [${FUNCTION_NAME}] Maps API key not found`);
      console.log(`[${timestamp}] [${FUNCTION_NAME}] Checked variants:`, apiKeyResult.checkedNames);
      
      // Log all available env vars for debugging (masked)
      logAllEnvVars(FUNCTION_NAME);

      return new Response(
        JSON.stringify({ 
          error: 'Maps API key not configured',
          checkedNames: apiKeyResult.checkedNames,
          hint: 'Please set GOOGLE_MAPS_API_KEY in Supabase secrets'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[${timestamp}] [${FUNCTION_NAME}] ✓ Successfully retrieved Maps API key`);
    console.log(`[${timestamp}] [${FUNCTION_NAME}] Key length: ${apiKeyResult.value.length} characters`);

    const response = {
      apiKey: apiKeyResult.value,
      provider: 'Google Maps',
      configured: true,
      foundAs: apiKeyResult.checkedNames[apiKeyResult.checkedNames.length - 1]
    };

    console.log(`[${timestamp}] [${FUNCTION_NAME}] Sending successful response`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${timestamp}] [${FUNCTION_NAME}] ERROR:`, error);
    console.error(`[${timestamp}] [${FUNCTION_NAME}] Error stack:`, error instanceof Error ? error.stack : 'N/A');

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timestamp,
        function: FUNCTION_NAME
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
