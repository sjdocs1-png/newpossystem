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
    const authHeader = req.headers.get('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify the caller is an admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      console.error('User verification failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('User verified:', user.id)

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .eq('is_active', true)
      .maybeSingle()

    if (roleError || !roleData) {
      console.error('Admin check failed:', { roleError, roleData })
      return new Response(
        JSON.stringify({ error: 'Only admins can create owner accounts' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    console.log('Admin verified')

    // Parse request body
    let requestBody
    try {
      requestBody = await req.json()
    } catch (e) {
      console.error('Failed to parse JSON:', e)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body', details: String(e) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { 
      business_name, 
      owner_name, 
      owner_email, 
      owner_password, 
      phone, 
      subscription_plan, 
      subscription_days, 
      max_stores,
      business_type,
      subscription_tier,
    } = requestBody

    // Validate required fields
    if (!business_name || !owner_name || !owner_email || !owner_password) {
      const missing = []
      if (!business_name) missing.push('business_name')
      if (!owner_name) missing.push('owner_name')
      if (!owner_email) missing.push('owner_email')
      if (!owner_password) missing.push('owner_password')
      
      console.error('Missing fields:', missing)
      return new Response(
        JSON.stringify({ error: 'Missing required fields', missing }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 1: Create auth user using admin API
    console.log('Creating auth user:', { email: owner_email })
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: owner_email,
      password: owner_password,
      email_confirm: true,
      user_metadata: { full_name: owner_name }
    })

    if (authError) {
      console.error('Auth user creation failed:', authError)
      return new Response(
        JSON.stringify({ error: 'Auth user creation failed', details: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    console.log('Auth user created:', authData.user.id)

    // Step 2: Create customer record
    const subscriptionStart = new Date()
    const subscriptionEnd = new Date()
    subscriptionEnd.setDate(subscriptionEnd.getDate() + (subscription_days || 30))

    const customerPayload = {
      business_name,
      owner_name,
      owner_email,
      phone: phone || null,
      subscription_plan: subscription_plan || 'monthly',
      subscription_start: subscriptionStart.toISOString().split('T')[0],
      subscription_end: subscriptionEnd.toISOString().split('T')[0],
      max_stores: max_stores || 2,
      business_type: business_type || 'restaurant',
      subscription_tier: subscription_tier || 'basic',
    }

    console.log('Creating customer with payload:', customerPayload)
    const { data: customerData, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert(customerPayload)
      .select()
      .single()

    if (customerError) {
      console.error('Customer creation failed:', customerError)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: 'Customer creation failed', details: customerError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    console.log('Customer created:', customerData.id)

    // Step 3: Create owner role
    console.log('Creating owner role for user:', authData.user.id)
    const { error: roleInsertError } = await supabaseAdmin.from('user_roles').insert({
      user_id: authData.user.id,
      role: 'owner',
      customer_id: customerData.id,
      is_active: true
    })

    if (roleInsertError) {
      console.error('Role creation failed:', roleInsertError)
      // Rollback: delete customer and user
      await supabaseAdmin.from('customers').delete().eq('id', customerData.id)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: 'Role creation failed', details: roleInsertError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    console.log('Owner role created successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        customer: customerData,
        message: `Owner account created for ${owner_name}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Unexpected error in create-owner:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    const stack = error instanceof Error ? error.stack : ''
    return new Response(
      JSON.stringify({ error: message, stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})