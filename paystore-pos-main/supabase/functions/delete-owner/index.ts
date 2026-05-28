import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Create regular client to verify admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify the caller is an admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.log('Auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .eq('is_active', true)
      .maybeSingle()

    if (roleError || !roleData) {
      console.log('Role check error:', roleError)
      return new Response(
        JSON.stringify({ error: 'Only admins can delete owner accounts' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { customer_id } = await req.json()

    if (!customer_id) {
      return new Response(
        JSON.stringify({ error: 'Customer ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Deleting customer:', customer_id)

    // Step 1: Get user_roles for this customer to find associated users
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('customer_id', customer_id)

    if (rolesError) {
      console.log('Error fetching user roles:', rolesError)
    }

    // Step 2: Get all stores for this customer
    const { data: stores, error: storesError } = await supabaseAdmin
      .from('stores')
      .select('id')
      .eq('customer_id', customer_id)

    if (storesError) {
      console.log('Error fetching stores:', storesError)
    }

    // Step 3: Delete each store using cascade function
    if (stores && stores.length > 0) {
      for (const store of stores) {
        const { error: cascadeError } = await supabaseAdmin.rpc('delete_store_cascade', {
          p_store_id: store.id
        })
        if (cascadeError) {
          console.log('Error cascading store delete:', store.id, cascadeError)
        }
      }
    }

    // Step 4: Delete owner's user_roles (those without store_id)
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('customer_id', customer_id)

    // Step 6: Delete customer record
    const { error: deleteCustomerError } = await supabaseAdmin
      .from('customers')
      .delete()
      .eq('id', customer_id)

    if (deleteCustomerError) {
      console.log('Error deleting customer:', deleteCustomerError)
      return new Response(
        JSON.stringify({ error: deleteCustomerError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 7: Delete auth users
    if (userRoles && userRoles.length > 0) {
      for (const role of userRoles) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(role.user_id)
          console.log('Deleted auth user:', role.user_id)
        } catch (e) {
          console.log('Error deleting auth user:', role.user_id, e)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Owner account and all related data deleted successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    console.log('Unexpected error:', message)
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
