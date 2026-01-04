import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestSchema = z.object({
  email: z.string().email().optional(),
  expiresInHours: z.number().min(1).max(168).default(24),
  notes: z.string().optional(),
  reactivateInviteId: z.string().uuid().optional(),
});

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT and get user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const { email, expiresInHours, notes, reactivateInviteId } = requestSchema.parse(body);

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    // If reactivating an existing invite
    if (reactivateInviteId) {
      // Generate new magic token
      const newToken = crypto.randomUUID();
      
      // Update existing invite with new token and expiration
      const { error: updateError } = await supabase
        .from('temporary_invites')
        .update({
          magic_token: newToken,
          expires_at: expiresAt.toISOString(),
          revoked_at: null,
          used_at: null,
        })
        .eq('id', reactivateInviteId);

      if (updateError) {
        console.error('Error reactivating invite:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to reactivate invite' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate magic link with new token
      const magicLink = `${supabaseUrl}/auth/v1/verify?token=${newToken}&type=magiclink&redirect_to=${Deno.env.get('SITE_URL') || supabaseUrl}`;

      console.log('Reactivated invite:', reactivateInviteId);

      return new Response(
        JSON.stringify({
          success: true,
          inviteId: reactivateInviteId,
          magicLink,
          expiresAt: expiresAt.toISOString(),
          reactivated: true,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new invite
    const magicToken = crypto.randomUUID();

    const { data: inviteData, error: inviteError } = await supabase
      .from('temporary_invites')
      .insert({
        created_by: user.id,
        email: email || null,
        magic_token: magicToken,
        expires_at: expiresAt.toISOString(),
        role: 'temporary',
        notes: notes || null,
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invite:', inviteError);
      return new Response(
        JSON.stringify({ error: 'Failed to create invite' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate magic link URL
    const magicLink = `${supabaseUrl}/auth/v1/verify?token=${magicToken}&type=magiclink&redirect_to=${Deno.env.get('SITE_URL') || supabaseUrl}`;

    console.log('Created temporary invite:', inviteData.id);

    return new Response(
      JSON.stringify({
        success: true,
        inviteId: inviteData.id,
        magicLink,
        expiresAt: expiresAt.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in generate-temporary-link:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});