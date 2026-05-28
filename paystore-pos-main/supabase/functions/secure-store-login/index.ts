import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const isValidStoreIdentifier = (code: string): boolean => /^[0-9]{8}$/.test(code) || /^STR[0-9]{5}$/i.test(code)
const isValidPassword = (password: string): boolean => password.length >= 4 && password.length <= 50
const sanitizeInput = (input: string): string => input.trim().replace(/[<>'"&]/g, '')

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
    const { store_code, password } = body

    if (!store_code || !password) {
      return new Response(
        JSON.stringify({ error: 'Store ID and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const sanitizedStoreIdentifier = sanitizeInput(store_code).toUpperCase()
    const sanitizedPassword = sanitizeInput(password)

    if (!isValidStoreIdentifier(sanitizedStoreIdentifier)) {
      return new Response(
        JSON.stringify({ error: 'Invalid Store ID format. Use 8 digits or STR#####.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!isValidPassword(sanitizedPassword)) {
      return new Response(
        JSON.stringify({ error: 'Invalid password format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('cf-connecting-ip') || 'unknown'

    const { data: rateLimitOk } = await supabaseAdmin
      .rpc('check_rate_limit', { 
        p_identifier: sanitizedStoreIdentifier, p_type: 'store',
        p_max_attempts: 5, p_window_minutes: 15
      })

    if (rateLimitOk === false) {
      return new Response(
        JSON.stringify({ error: 'Too many login attempts. Please try again in 15 minutes.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let resolvedStoreCode = sanitizedStoreIdentifier
    let resolvedRefCode: string | null = null

    if (!/^[0-9]{8}$/.test(sanitizedStoreIdentifier)) {
      const { data: storeLookup, error: lookupError } = await supabaseAdmin
        .from('stores')
        .select('store_code, ref_code')
        .eq('ref_code', sanitizedStoreIdentifier)
        .eq('is_active', true)
        .maybeSingle()

      if (lookupError || !storeLookup?.store_code) {
        await supabaseAdmin.rpc('log_login_attempt', {
          p_identifier: sanitizedStoreIdentifier, p_type: 'store', p_success: false, p_ip: clientIp
        })

        return new Response(
          JSON.stringify({ error: 'Invalid store ID or password' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      resolvedStoreCode = storeLookup.store_code
      resolvedRefCode = storeLookup.ref_code
    }

    const { data: storeResults, error: loginError } = await supabaseAdmin
      .rpc('secure_store_login', {
        p_store_code: resolvedStoreCode,
        p_password: sanitizedPassword
      })

    if (loginError) {
      if (loginError.message?.includes('Too many login attempts')) {
        return new Response(
          JSON.stringify({ error: 'Too many login attempts. Please try again in 15 minutes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      console.error('Login error:', loginError)
      return new Response(
        JSON.stringify({ error: 'Invalid store ID or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!storeResults || storeResults.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid store ID or password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const storeData = storeResults[0]

    if (!resolvedRefCode) {
      const { data: metaData } = await supabaseAdmin
        .from('stores')
        .select('store_code, ref_code')
        .eq('id', storeData.store_id)
        .maybeSingle()

      resolvedStoreCode = metaData?.store_code || resolvedStoreCode
      resolvedRefCode = metaData?.ref_code || null
    }

    // Fetch subscription data from the customers table
    let subscriptionData = {
      subscription_tier: 'basic',
      business_type: 'restaurant',
      enabled_addons: [] as string[],
      staff_limit: 2,
      outlet_limit: 1,
    }

    if (storeData.customer_id) {
      const { data: customerData } = await supabaseAdmin
        .from('customers')
        .select('subscription_tier, business_type, enabled_addons, staff_limit, outlet_limit')
        .eq('id', storeData.customer_id)
        .maybeSingle()

      if (customerData) {
        subscriptionData = {
          subscription_tier: customerData.subscription_tier || 'basic',
          business_type: customerData.business_type || 'restaurant',
          enabled_addons: customerData.enabled_addons || [],
          staff_limit: customerData.staff_limit || 2,
          outlet_limit: customerData.outlet_limit || 1,
        }
      }
    }

    console.log('Store login successful for:', storeData.store_name)

    return new Response(
      JSON.stringify({ 
        success: true, 
        store_id: storeData.store_id,
        store_name: storeData.store_name,
        store_address: storeData.store_address,
        store_phone: storeData.store_phone,
        customer_id: storeData.customer_id,
        store_code: resolvedStoreCode,
        ref_code: resolvedRefCode,
        // Include subscription data
        subscription_tier: subscriptionData.subscription_tier,
        business_type: subscriptionData.business_type,
        enabled_addons: subscriptionData.enabled_addons,
        staff_limit: subscriptionData.staff_limit,
        outlet_limit: subscriptionData.outlet_limit,
      }),
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
