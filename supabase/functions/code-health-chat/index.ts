import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  message: z.string().max(2000, 'Message too long'),
  selectedNode: z.object({
    id: z.string(),
    label: z.string(),
    type: z.string(),
    quality: z.number().optional(),
    risk: z.string().optional(),
    performance: z.number().optional(),
  }).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional()
});

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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
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

    const { message, selectedNode, conversationHistory } = validation.data;

    // Build context
    let contextPrompt = "You are a code health analysis assistant helping developers understand their codebase architecture and quality metrics.";
    
    if (selectedNode) {
      contextPrompt += `\n\nThe user has selected the "${selectedNode.label}" component (${selectedNode.type}):`;
      if (selectedNode.quality) contextPrompt += `\n- Quality Score: ${selectedNode.quality}/100`;
      if (selectedNode.risk) contextPrompt += `\n- Risk Level: ${selectedNode.risk}`;
      if (selectedNode.performance) contextPrompt += `\n- Performance Score: ${selectedNode.performance}/100`;
    }

    contextPrompt += "\n\nProvide helpful, specific insights about code quality, architecture decisions, refactoring suggestions, or answer questions about the selected component. Keep responses concise and actionable.";

    // Build messages array
    const messages = [
      { role: "system", content: contextPrompt },
      ...(conversationHistory || []),
      { role: "user", content: message }
    ];

    console.log("Sending request to Lovable AI Gateway");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
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

    // Stream the response back to the client
    return new Response(response.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Error in code-health-chat:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
