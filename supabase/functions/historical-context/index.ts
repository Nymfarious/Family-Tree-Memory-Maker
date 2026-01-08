// supabase/functions/historical-context/index.ts
// Family Tree Memory Maker - Historical Context AI
// Supports: Claude (Anthropic), Gemini (Google), or Lovable Gateway
// 
// Credits: Original implementation via Lovable.dev

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Determine which AI provider to use based on available env vars
function getProvider(): { name: string; apiKey: string } {
  // Priority: Claude > Gemini > Lovable Gateway
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (anthropicKey) {
    return { name: "anthropic", apiKey: anthropicKey };
  }
  
  const googleKey = Deno.env.get("GOOGLE_AI_API_KEY");
  if (googleKey) {
    return { name: "google", apiKey: googleKey };
  }
  
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (lovableKey) {
    return { name: "lovable", apiKey: lovableKey };
  }
  
  throw new Error("No AI API key configured. Set ANTHROPIC_API_KEY, GOOGLE_AI_API_KEY, or LOVABLE_API_KEY");
}

// Build the prompt for historical context
function buildPrompt(timeframe: string, location?: string, migrationPattern?: boolean): string {
  let prompt = `Provide interesting historical context and facts about ${timeframe}`;
  
  if (location) {
    prompt += ` in ${location}`;
  }
  
  if (migrationPattern) {
    prompt += `. Focus on migration patterns and explain why people might have moved during this time period (e.g., Dust Bowl, Gold Rush, Industrial Revolution, war, religious persecution, land grants, etc.).`;
  }
  
  prompt += ` Keep the response concise (3-5 key facts) and relevant to family history research. Include major events, economic conditions, and social movements that would have affected ordinary families.`;
  
  return prompt;
}

// Call Claude (Anthropic) API
async function callClaude(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: "You are a knowledgeable historian specializing in social history and migration patterns. Provide accurate, engaging historical context that helps people understand their family's history. Be specific about dates, events, and causes of migration.",
      messages: [{ role: "user", content: prompt }]
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Claude API error:", response.status, errorText);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "No historical context available.";
}

// Call Google Gemini API
async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `You are a knowledgeable historian specializing in social history and migration patterns. ${prompt}`
        }]
      }],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No historical context available.";
}

// Call Lovable Gateway (original implementation)
async function callLovableGateway(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: "You are a knowledgeable historian specializing in social history and migration patterns. Provide accurate, engaging historical context that helps people understand their family's history."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (response.status === 402) {
      throw new Error("Credits exhausted. Please add credits to continue.");
    }
    const errorText = await response.text();
    console.error("Lovable gateway error:", response.status, errorText);
    throw new Error(`Lovable gateway error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No historical context available.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { timeframe, location, migrationPattern } = await req.json();
    
    if (!timeframe) {
      throw new Error("timeframe is required");
    }

    const provider = getProvider();
    const prompt = buildPrompt(timeframe, location, migrationPattern);
    
    console.log(`Using AI provider: ${provider.name}`);
    
    let historicalContext: string;
    
    switch (provider.name) {
      case "anthropic":
        historicalContext = await callClaude(prompt, provider.apiKey);
        break;
      case "google":
        historicalContext = await callGemini(prompt, provider.apiKey);
        break;
      case "lovable":
        historicalContext = await callLovableGateway(prompt, provider.apiKey);
        break;
      default:
        throw new Error(`Unknown provider: ${provider.name}`);
    }

    return new Response(
      JSON.stringify({ 
        context: historicalContext,
        provider: provider.name // Let frontend know which provider was used
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in historical-context function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
