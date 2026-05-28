import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const body = await req.json()
    const {
      customer_id,
      store_name,
      email,
      password,
      address,
      phone,
      business_type,
      country,
      currency_code,
      tax_type,
      tax_percentage
    } = body

    if (!customer_id || !store_name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'customer_id, store_name, email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    // Try to find existing user first
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    )

    let userId: string

    if (existingUser) {
      userId = existingUser.id
    } else {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: store_name.trim() }
      })

      if (authError) {
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      userId = authData.user.id
    }

    // Verify customer exists
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id, max_stores')
      .eq('id', customer_id)
      .maybeSingle()

    if (!customer) {
      if (!existingUser) await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(
        JSON.stringify({ error: 'Invalid customer account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check store limit
    const { count } = await supabaseAdmin
      .from('stores')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', customer_id)
      .eq('is_active', true)

    if ((count || 0) >= customer.max_stores) {
      if (!existingUser) await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(
        JSON.stringify({ error: `Store limit reached (max ${customer.max_stores})` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: dbStore, error } = await supabaseAdmin
      .from('stores')
      .insert({
        customer_id,
        store_name: store_name.trim(),
        password: password || null,
        address: address || null,
        phone: phone || null,
        business_type: business_type || 'restaurant',
        country: country || 'India',
        currency_code: currency_code || 'INR',
        tax_type: tax_type || 'GST',
        tax_percentage: tax_percentage ?? 0,
      })
      .select('id, store_code, store_name')
      .single()

    if (error) {
      if (!existingUser) await supabaseAdmin.auth.admin.deleteUser(userId)
      console.error('Store creation error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to create store: ' + error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'store_manager',
        customer_id,
        store_id: dbStore.id,
        is_active: true,
      })

    if (roleError) {
      await supabaseAdmin.from('stores').delete().eq('id', dbStore.id)
      if (!existingUser) await supabaseAdmin.auth.admin.deleteUser(userId)
      return new Response(
        JSON.stringify({ error: roleError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabaseAdmin
      .from('profiles')
      .update({ full_name: store_name.trim(), phone: phone || null })
      .eq('id', userId)

    return new Response(
      JSON.stringify({ success: true, store: dbStore, email: normalizedEmail }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
