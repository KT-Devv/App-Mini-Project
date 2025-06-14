
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Cors headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a Supabase client with the service_role key
const getSupabaseAdmin = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const authHeader = req.headers.get('Authorization')!
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));

    if (!user) throw new Error('User not found');

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfile) {
      return new Response(JSON.stringify({ profile: existingProfile }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const username = user.user_metadata?.username || user.email?.split('@')[0] || 'User';
    const email = user.email || '';

    const { data: newProfile, error: createError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: user.id, username, email })
      .select()
      .single();

    if (createError) throw createError;

    return new Response(JSON.stringify({ profile: newProfile }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
