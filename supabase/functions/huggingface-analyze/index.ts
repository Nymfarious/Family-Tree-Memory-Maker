import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const HUGGING_FACE_API_KEY = Deno.env.get('HUGGING_FACE_API_KEY');
    if (!HUGGING_FACE_API_KEY) {
      throw new Error('HUGGING_FACE_API_KEY is not set');
    }

    const { text, task = 'summarization' } = await req.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: "text is required" }), 
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log(`Running Hugging Face ${task} task`);

    // Use appropriate model based on task
    const models: Record<string, string> = {
      'summarization': 'facebook/bart-large-cnn',
      'sentiment': 'distilbert-base-uncased-finetuned-sst-2-english',
      'ner': 'dslim/bert-base-NER',
    };

    const model = models[task] || models['summarization'];

    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
        parameters: task === 'summarization' ? {
          max_length: 150,
          min_length: 30,
        } : {}
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Hugging Face API error:", error);
      throw new Error(`Hugging Face API error: ${error}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ result }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in huggingface-analyze:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});