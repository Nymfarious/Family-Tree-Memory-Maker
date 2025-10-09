import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const requestSchema = z.object({
  imageUrl: z.string().url('Invalid URL').max(500, 'URL too long'),
  prompt: z.string().max(1000, 'Prompt too long (max 1000 chars)').optional()
});

// Simple rate limiting (in-memory, per IP)
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60000; // 1 minute in ms

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(ip);
  
  if (!limit || now > limit.resetTime) {
    rateLimits.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (limit.count >= RATE_LIMIT) {
    return false;
  }
  
  limit.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.warn('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        }
      );
    }

    const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY');
    if (!REPLICATE_API_KEY) {
      throw new Error('REPLICATE_API_KEY is not set');
    }

    const body = await req.json();
    
    // Validate input
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      console.warn('Invalid input:', validation.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.errors }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const { imageUrl, prompt } = validation.data;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "imageUrl is required" }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log("Enhancing image:", imageUrl);
    
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "0fbacf7afc6c144e5be9767cff80f25aff23e52b0708f17e20f9879b2f21516c",
        input: {
          image: imageUrl,
          prompt: prompt || "restore and enhance this old family photo, improve quality and clarity",
          scale: 2,
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Replicate API error:", error);
      throw new Error(`Replicate API error: ${error}`);
    }

    const prediction = await response.json();
    console.log("Prediction started:", prediction.id);

    return new Response(
      JSON.stringify({ 
        predictionId: prediction.id,
        status: prediction.status,
        urls: prediction.urls
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in replicate-enhance:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});