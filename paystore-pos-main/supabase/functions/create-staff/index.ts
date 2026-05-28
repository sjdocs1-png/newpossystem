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
    const { name, email: providedEmail, role, store_id, customer_id, pin, store_login_id, password: providedPassword, face_photo_url, work_start_time, work_end_time, fingerprint_enabled, salary } = body

    if (!name || !store_id || !providedEmail) {
      return new Response(
        JSON.stringify({ error: 'Name, email and store are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const staffEmail = providedEmail.trim().toLowerCase()

    const generateNumericCode = (length: number) =>
      Array.from({ length }, () => Math.floor(Math.random() * 10)).join('')

    // Use provided password first, then pin, then generate one
    const providedPasswordValue = (providedPassword?.trim() || pin?.trim() || '').trim()
    const staffPin = (pin || providedPasswordValue || generateNumericCode(4)).trim()
    
    // Use the provided password/pin as auth password if it's at least 6 chars
    // Otherwise generate a strong one
    const password = providedPasswordValue.length >= 6 
      ? providedPasswordValue 
      : `${crypto.randomUUID()}Aa!1`

    let effectiveCustomerId = customer_id
    let isAuthorizedViaStore = false

    // Check store login authorization
    if (store_login_id) {
      console.log('Store login mode - verifying store:', store_login_id)
      const { data: storeData, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, customer_id, is_active')
        .eq('id', store_login_id)
        .eq('is_active', true)
        .maybeSingle()
      
      if (storeError || !storeData) {
        return new Response(
          JSON.stringify({ error: 'Invalid store login' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (storeData.id !== store_id) {
        return new Response(
          JSON.stringify({ error: 'Can only create staff for your own store' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      effectiveCustomerId = storeData.customer_id
      isAuthorizedViaStore = true
    }

    // If not authorized via store login, check JWT authorization
    if (!isAuthorizedViaStore) {
      const authHeader = req.headers.get('Authorization')
      
      if (authHeader && authHeader !== 'Bearer null') {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
        
        if (!userError && user) {
          const { data: roleData } = await supabaseAdmin
            .from('user_roles')
            .select('role, customer_id')
            .eq('user_id', user.id)
            .in('role', ['admin', 'owner', 'store_manager'])
            .eq('is_active', true)
            .maybeSingle()

          if (!roleData) {
            return new Response(
              JSON.stringify({ error: 'Only owners or managers can create staff accounts' }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          effectiveCustomerId = customer_id || roleData.customer_id
        }
      }
    }
    
    if (!effectiveCustomerId) {
      return new Response(
        JSON.stringify({ error: 'Customer ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Creating staff user:', { email: staffEmail, name, role, store_id, customer_id: effectiveCustomerId })

    // Try to create auth user, or reuse existing one
    let userId: string

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: staffEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: name }
    })

    if (authError) {
      console.log('Auth create error (checking for existing user):', authError.message)
      const errorMessage = authError.message.toLowerCase()
      
      // If user already exists, find and reuse their ID
      if (errorMessage.includes('already') || errorMessage.includes('duplicate') || errorMessage.includes('exists') || errorMessage.includes('database error')) {
        const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = users?.find(u => u.email?.toLowerCase() === staffEmail)
        
        if (!existingUser) {
          return new Response(
            JSON.stringify({ error: 'Could not find or create user with this email' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        userId = existingUser.id
        console.log('Reusing existing auth user:', userId)
        
        // Update the password so staff can login with the new credentials
        const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password,
          user_metadata: { full_name: name }
        })

        if (updateUserError) {
          return new Response(
            JSON.stringify({ error: updateUserError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        // Check if user already has a role for this store
        const { data: existingRole } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('store_id', store_id)
          .eq('is_active', true)
          .maybeSingle()
        
        if (existingRole) {
          // Update existing role instead of creating duplicate
          const { data: updatedRole, error: updateError } = await supabaseAdmin
            .from('user_roles')
            .update({
              role: role || 'staff',
              customer_id: effectiveCustomerId,
              pin: staffPin,
              face_photo_url: face_photo_url || undefined,
              work_start_time: work_start_time || '09:00:00',
              work_end_time: work_end_time || '18:00:00',
              fingerprint_enabled: fingerprint_enabled || false,
              salary: salary || 0,
              is_active: true,
            })
            .eq('id', existingRole.id)
            .select('staff_code')
            .single()
          
          if (updateError) {
            console.error('Role update error:', updateError)
            return new Response(
              JSON.stringify({ error: updateError.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              staff_code: updatedRole?.staff_code,
              password,
              pin: staffPin,
              message: `Staff account updated for ${name}`
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else {
        return new Response(
          JSON.stringify({ error: authError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      userId = authData.user.id
    }

    // Create user role
    const plainPin = staffPin
    const plainPassword = password
    const { data: newRole, error: roleInsertError } = await supabaseAdmin.from('user_roles').insert({
      user_id: userId,
      role: role || 'staff',
      customer_id: effectiveCustomerId,
      store_id,
      pin: staffPin,
      is_active: true,
      face_photo_url: face_photo_url,
      work_start_time: work_start_time || '09:00:00',
      work_end_time: work_end_time || '18:00:00',
      fingerprint_enabled: fingerprint_enabled || false,
      salary: salary || 0
    }).select('staff_code').single()

    if (roleInsertError) {
      // Only delete user if we just created them
      if (authData?.user) {
        await supabaseAdmin.auth.admin.deleteUser(userId)
      }
      console.error('Role insert error:', roleInsertError)
      return new Response(
        JSON.stringify({ error: roleInsertError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Update profile
    await supabaseAdmin.from('profiles').update({
      full_name: name
    }).eq('id', userId)

    console.log('Staff created successfully:', { staff_code: newRole?.staff_code, pin: plainPin })

    return new Response(
      JSON.stringify({ 
        success: true, 
        staff_code: newRole?.staff_code,
        password: plainPassword,
        pin: plainPin,
        message: `Staff account created for ${name}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
