import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  projectPath: z.string().default('/src'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    const body = await req.json();
    const validation = requestSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.errors }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log("Starting codebase analysis...");

    // Use AI to analyze the codebase structure
    const analysisPrompt = `Analyze this React/TypeScript project structure and provide a comprehensive breakdown of ALL components, pages, utilities, APIs, and backend services.

For each component found, provide:
- id: unique identifier (kebab-case)
- label: display name with emoji
- type: one of 'core' | 'page' | 'component' | 'util' | 'backend' | 'button' | 'api'
- quality: score 0-100
- risk: 'low' | 'medium' | 'high'
- performance: score 0-100
- dependencies: array of other component IDs it depends on

Focus on finding:
1. ALL React components (.tsx, .jsx files)
2. ALL pages in src/pages/
3. ALL utility files in src/utils/
4. ALL API/backend edge functions
5. ALL button components and UI elements
6. Backend services (auth, database, storage)

Provide real quality metrics based on:
- Code complexity
- TypeScript usage
- Error handling patterns
- Performance optimizations

Return a JSON object with:
{
  "components": [array of component objects],
  "totalFound": number,
  "categories": { "pages": number, "components": number, etc. }
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a code analysis expert. Analyze project structures and provide detailed component breakdowns." },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const analysisText = aiResult.choices?.[0]?.message?.content || '{}';
    
    console.log("Analysis result:", analysisText);

    // Try to parse the AI response as JSON
    let analysisData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       analysisText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : analysisText;
      analysisData = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", e);
      analysisData = {
        components: [],
        totalFound: 0,
        categories: {},
        error: "Failed to parse analysis results"
      };
    }

    return new Response(
      JSON.stringify(analysisData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error("Error in analyze-codebase:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        components: [],
        totalFound: 0 
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});