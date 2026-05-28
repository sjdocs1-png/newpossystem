import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// Auth helper: verify JWT, store_code, or active store_id
async function authenticateRequest(req: Request, supabaseAdmin: any, store_id: string, store_code?: string): Promise<{ authorized: boolean; error?: string }> {
  // Path 1: JWT authentication
  const authHeader = req.headers.get('Authorization')
  if (authHeader && authHeader !== 'Bearer null' && !authHeader.endsWith('undefined')) {
    const token = authHeader.replace('Bearer ', '')
    // Skip if token is the anon key (not a real user JWT)
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    if (token !== anonKey) {
      try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
        if (!error && user) {
          const { data: roleData } = await supabaseAdmin
            .from('user_roles')
            .select('role, store_id, customer_id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .in('role', ['admin', 'owner', 'store_manager', 'staff'])
            .limit(1)
            .maybeSingle()
          
          if (roleData) {
            if (roleData.role === 'admin') return { authorized: true }
            if (roleData.role === 'owner') {
              // Check if store exists first
              const { data: store } = await supabaseAdmin
                .from('stores').select('customer_id').eq('id', store_id).maybeSingle()
              // If store doesn't exist, allow owner through (will be caught by store existence check later)
              if (!store) return { authorized: true }
              if (store.customer_id === roleData.customer_id) return { authorized: true }
            }
            if ((roleData.role === 'store_manager' || roleData.role === 'staff') && roleData.store_id === store_id) {
              return { authorized: true }
            }
          }
          return { authorized: false, error: 'Access denied to this store' }
        }
      } catch {}
    }
  }

  // Path 2: Store code authentication
  if (store_code) {
    const { data: storeData, error } = await findStoreRecord(supabaseAdmin, store_id, store_code)
    if (!error && storeData) return { authorized: true }
    console.warn('[sync-store-data] store_code auth failed', { store_id, store_code, error })
    return { authorized: false, error: 'Invalid store credentials' }
  }

  // Path 3: Fallback - verify store_id is valid and active (for store-login sessions without store_code)
  const { data: activeStore, error: activeStoreError } = await findStoreRecord(supabaseAdmin, store_id)
  if (!activeStoreError && activeStore) return { authorized: true }

  return { authorized: false, error: 'Authentication required' }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const isUUID = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

// Deterministic UUID conversion for local/non-UUID order identifiers.
// Matches the same order-based UUID strategy used by sync-orders so order_id references stay valid.
function toUUID(input: string): string {
  const value = String(input || '')
  if (isUUID(value)) return value
  let hash = 0
  const str = 'order:' + value
  const bytes: number[] = []
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
    bytes.push(Math.abs(hash) % 256)
  }
  while (bytes.length < 16) {
    hash = ((hash << 5) - hash) + bytes.length
    hash |= 0
    bytes.push(Math.abs(hash) % 256)
  }
  const hex = bytes.slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`
}

const isRetryableError = (error: any) => {
  if (!error) return false
  const message = String(error.message || error.msg || error).toLowerCase()
  return /timeout|timed out|rate limit|503|504|502|408|network error|request failed/.test(message) || error.status === 408 || error.status === 429 || error.status === 502 || error.status === 503 || error.status === 504
}

async function executeDbOperation(operation: () => Promise<any>, label = '') {
  let attempt = 0
  while (attempt < 3) {
    const result = await operation()
    const error = result?.error
    if (!error) return result
    if (!isRetryableError(error) || attempt === 2) return result
    attempt += 1
    await delay(100 * attempt)
    console.warn(`[sync-store-data] retrying ${label} attempt ${attempt + 1} after retryable error`, error.message || error)
  }
  return { data: null, error: { message: 'Retry failed' } }
}

async function logSystemError(supabaseAdmin: any, store_id: string, module: string, action: string, payload: any, error: any) {
  try {
    await executeDbOperation(() => supabaseAdmin.from('system_error_logs').insert({
      store_id,
      module,
      action,
      payload: payload ? JSON.stringify(payload) : null,
      error_message: error?.message || String(error || ''),
      stack_trace: error?.stack || null,
      created_at: new Date().toISOString(),
    }), 'system_error_logs')
  } catch (err) {
    console.error('[sync-store-data] failed to log system error:', err)
  }
}

function normalizeUuidField(value: any) {
  if (!value || typeof value !== 'string') return null
  return isUUID(value) ? value : null
}

function isPhoneNumber(value: string) {
  const normalized = String(value || '').replace(/[^0-9+]/g, '').trim()
  return normalized.length >= 6 && normalized.length <= 20 && /^[+]?[0-9]+$/.test(normalized)
}

function normalizePhone(value: any) {
  if (!value) return null
  const cleaned = String(value).replace(/[^0-9+]/g, '').trim()
  return cleaned || null
}

async function findStoreRecord(supabaseAdmin: any, store_id: string, store_code?: string) {
  let query = supabaseAdmin.from('stores').select('id, store_code, customer_id').eq('id', store_id)
  if (store_code) query = query.eq('store_code', store_code)

  let result = await query.eq('is_active', true).maybeSingle()
  if (result.error && /is_active/.test(String(result.error.message || result.error))) {
    console.warn('[sync-store-data] stores.is_active filter failed, retrying without is_active filter')
    const fallbackQuery = supabaseAdmin.from('stores').select('id, store_code, customer_id').eq('id', store_id)
    if (store_code) fallbackQuery.eq('store_code', store_code)
    result = await fallbackQuery.maybeSingle()
  }
  return result
}

async function resolveCustomerReference(supabaseAdmin: any, store_id: string, item: any) {
  const rawCustomerId = item.customer_id ?? item.customerId ?? null
  const rawCustomerPhone = item.customer_phone ?? item.customerPhone ?? item.phone ?? item.contact ?? null
  const rawCustomerName = item.customer_name ?? item.customerName ?? item.name ?? null
  const customerId = normalizeUuidField(String(rawCustomerId || ''))
  const customerPhone = normalizePhone(rawCustomerPhone ?? rawCustomerId)
  let customer_id = customerId
  let customer_phone = customerPhone
  let customer_name = rawCustomerName ? String(rawCustomerName) : null

  if (!customer_id && customer_phone && !customer_name) {
    customer_name = customer_phone
  }

  if (!customer_id && customer_phone) {
    const { data: existing, error: existingErr } = await executeDbOperation(() => supabaseAdmin
      .from('pos_customers')
      .select('id,name,phone')
      .eq('store_id', store_id)
      .eq('phone', customer_phone)
      .limit(1)
      .maybeSingle(), 'resolveCustomerReference.findCustomerByPhone')

    if (!existingErr && existing?.id) {
      customer_id = existing.id
      customer_name = customer_name || existing.name || existing.phone || null
    } else {
      const insertPayload: any = {
        store_id,
        phone: customer_phone,
        name: customer_name || null,
      }
      const { data: inserted, error: insertErr } = await executeDbOperation(() => supabaseAdmin
        .from('pos_customers')
        .insert(insertPayload)
        .select(), 'resolveCustomerReference.createCustomer')

      if (!insertErr && inserted?.[0]?.id) {
        customer_id = inserted[0].id
        customer_name = customer_name || inserted[0].name || inserted[0].phone || null
      } else if (insertErr) {
        console.warn('[sync-store-data] resolveCustomerReference create customer failed:', insertErr)
      }
    }
  }

  return {
    customer_id,
    customer_phone,
    customer_name: customer_name || (customer_phone ? customer_phone : 'Walk-in Credit'),
  }
}

function normalizeDataType(value: any) {
  if (!value || typeof value !== 'string') return value
  const normalized = value.toString().trim().toLowerCase()
  const map: Record<string, string> = {
    'creditledger': 'credit_ledger',
    'credit ledger': 'credit_ledger',
    'credit-ledger': 'credit_ledger',
    'creditledgerentry': 'credit_ledger',
    'credit ledger entry': 'credit_ledger',
    'credit_ledgers': 'credit_ledger',
    'creditledgers': 'credit_ledger',
    'creditpayments': 'credit_payments',
    'credit payments': 'credit_payments',
    'credit-payments': 'credit_payments',
    'creditpayment': 'credit_payments',
    'credit payment': 'credit_payments',
    'credit_payments': 'credit_payments',
    'credit_ledger': 'credit_ledger',
    'creditbill': 'credit_ledger',
    'credit bill': 'credit_ledger',
    'bill_counter': 'bill_counter',
    'bill counter': 'bill_counter',
    'billcounter': 'bill_counter',
    'due_sale': 'credit_ledger',
    'credit_sale': 'credit_ledger',
    'due_payment': 'credit_payments',
    'invoice': 'credit_ledger',
    'bill': 'bill_counter',
    'menu items': 'menu_items',
    'menu-items': 'menu_items',
    'menuitems': 'menu_items',
    'pos customers': 'pos_customers',
    'pos-customers': 'pos_customers',
    'poscustomers': 'pos_customers',
    'advance requests': 'advance_requests',
    'advance-requests': 'advance_requests',
    'leave requests': 'leave_requests',
    'leave-requests': 'leave_requests',
    'staff notifications': 'staff_notifications',
    'staff-notifications': 'staff_notifications',
    'staff schedules': 'staff_schedules',
    'staff-schedules': 'staff_schedules',
    'bill counter': 'bill_counter',
    'sale': 'sale',
    'customer': 'sale',
    'customer_sale': 'sale',
    'sale_entry': 'sale',
  }
  return map[normalized] || normalized
}

function normalizeAction(value: any) {
  if (!value || typeof value !== 'string') return value
  const normalized = value.toString().trim().toLowerCase()
  const map: Record<string, string> = {
    'create': 'save',
    'add': 'save',
    'upsert': 'save',
    'replace': 'save',
    'remove': 'delete',
    'fetch': 'fetch',
    'save': 'save',
    'delete': 'delete',
    'update': 'update',
  }
  return map[normalized] || normalized
}

function validateDuePayload(item: any, storeCustomerId: string | null) {
  const invoiceId = item.order_id || item.orderId || item.id || item.invoice_id || item.invoiceId
  const amount = Number(item.total_amount ?? item.total ?? item.amount ?? 0)
  // Relaxed validation: only require invoiceId, store_id and positive amount

  if (!invoiceId) return 'invoice_id (order_id) is required'
  if (!item.store_id) return 'store_id is required'
  if (!(amount > 0)) return 'amount must be greater than 0'
  return null
}

async function mergeCustomerLedger(supabaseAdmin: any, store_id: string, item: any) {
  const customerPhone = item.customer_phone || item.customerPhone || null
  if (!customerPhone) return null

  const { data: existing, error: existingErr } = await executeDbOperation(() => supabaseAdmin
    .from('credit_ledger')
    .select('*')
    .eq('store_id', store_id)
    .eq('customer_phone', customerPhone)
    .neq('payment_status', 'paid')
    .limit(1)
    .maybeSingle(), 'mergeCustomerLedger.select')

  if (existingErr) throw existingErr
  if (!existing) return null

  const totalAmount = Number(existing.total_amount || 0) + Number(item.total_amount || item.total || 0)
  const paidAmount = Number(existing.paid_amount || 0) + Number(item.paid_amount || item.paid || 0)
  const dueAmount = Math.max(0, totalAmount - paidAmount)
  const paymentStatus = dueAmount <= 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid')

  const { data: updated, error: updErr } = await executeDbOperation(() => supabaseAdmin
    .from('credit_ledger')
    .update({ total_amount: totalAmount, paid_amount: paidAmount, due_amount: dueAmount, payment_status: paymentStatus, updated_at: new Date().toISOString() })
    .eq('id', existing.id), 'mergeCustomerLedger.update')

  if (updErr) throw updErr
  return updated?.[0] || null
}

async function updatePaymentReports(supabaseAdmin: any, store_id: string, paymentMethod: string, amount: number) {
  try {
    if (!paymentMethod || !(amount > 0)) return
    const settingKey = 'payment_method_totals'
    const { data: existing, error: existingErr } = await executeDbOperation(() => supabaseAdmin
      .from('store_settings')
      .select('setting_value')
      .eq('store_id', store_id)
      .eq('setting_key', settingKey)
      .maybeSingle(), 'updatePaymentReports.select')
    if (existingErr) return

    const totals = existing?.setting_value || {}
    totals[paymentMethod] = Number(totals[paymentMethod] || 0) + amount

    await executeDbOperation(() => supabaseAdmin
      .from('store_settings')
      .upsert({ store_id, setting_key: settingKey, setting_value: totals, updated_at: new Date().toISOString() }, { onConflict: 'store_id,setting_key' }), 'updatePaymentReports.upsert')
  } catch (err) {
    console.warn('[sync-store-data] updatePaymentReports failed:', err)
  }
}

async function saveDueTransaction(supabaseAdmin: any, store_id: string, items: any[], storeCustomerId: string | null) {
  if (!items?.length) {
    return { error: 'items required' }
  }
  const results: any[] = []

  for (const item of items) {
    const rawInvoiceId = item.order_id || item.orderId || item.id || item.invoice_id || item.invoiceId
    try { console.log('[sync-store-data] incoming due item:', JSON.stringify(item)); } catch (e) {}
    const validationError = validateDuePayload(item, storeCustomerId)
    if (validationError) {
      return { error: validationError, item }
    }

    const ledgerId = item.id && typeof item.id === 'string' ? toUUID(item.id) : toUUID(String(rawInvoiceId))
    const orderId = item.order_id && typeof item.order_id === 'string' ? toUUID(item.order_id) : toUUID(String(rawInvoiceId))
    const customerRef = await resolveCustomerReference(supabaseAdmin, store_id, item)
    const payload = {
      id: ledgerId,
      store_id,
      customer_id: customerRef.customer_id,
      customer_name: customerRef.customer_name,
      customer_phone: customerRef.customer_phone,
      bill_number: item.bill_number || item.billNumber || null,
      order_id: orderId,
      total_amount: Number(item.total_amount ?? item.total ?? 0),
      paid_amount: Number(item.paid_amount ?? item.paid ?? 0),
      due_amount: Number(item.due_amount ?? item.due ?? Math.max(0, Number(item.total_amount ?? item.total ?? 0) - Number(item.paid_amount ?? item.paid ?? 0))),
      payment_status: item.payment_status || item.status || (Number(item.due_amount ?? item.due ?? 0) <= 0 ? 'paid' : (Number(item.paid_amount ?? item.paid ?? 0) > 0 ? 'partial' : 'unpaid')),
      notes: item.notes || null,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
    }

    try {
      console.log('[sync-store-data] saveDueTransaction final payload:', JSON.stringify(payload));
      let { data, error } = await executeDbOperation(() => supabaseAdmin
        .from('credit_ledger')
        .insert(payload)
        .select(), 'saveDueTransaction.insert')

      if (error && /customer_id/.test(String(error.message || error))) {
        console.warn('[sync-store-data] CREDIT LEDGER INSERT FAILED due to customer_id column, retrying without customer_id', error.message || error)
        const fallbackPayload = { ...payload }
        delete fallbackPayload.customer_id
        const fallbackResult = await executeDbOperation(() => supabaseAdmin
          .from('credit_ledger')
          .insert(fallbackPayload)
          .select(), 'saveDueTransaction.insert_without_customer_id')
        data = fallbackResult.data
        error = fallbackResult.error
      }

      if (error) {
        console.error('[sync-store-data] CREDIT LEDGER INSERT FAILED:', error)
        await logSystemError(supabaseAdmin, store_id, 'credit_ledger', 'save_insert_failed', payload, error)
        return { error: error.message || 'Ledger insert failed', detail: error }
      }

      const saved = data?.[0]
      results.push({ success: true, item: saved })
    } catch (err) {
      console.error('[sync-store-data] CREDIT LEDGER EXCEPTION:', err)
      await logSystemError(supabaseAdmin, store_id, 'credit_ledger', 'save_exception', item, err)
      return { error: String(err), item }
    }
  }

  return { success: true, saved_count: results.length, results }
}

async function recordDuePayment(supabaseAdmin: any, store_id: string, items: any[], storeCustomerId: string | null) {
  if (!items?.length) {
    return { error: 'items required' }
  }
  const results: any[] = []

  for (const item of items) {
    const rawCreditId = item.credit_id || item.creditId
    const creditId = rawCreditId && typeof rawCreditId === 'string' ? toUUID(rawCreditId) : null
    const amount = Number(item.amount || 0)
    const paymentMethod = item.payment_method || item.paymentMethod || 'cash'
    const paymentPayload = {
      id: item.id && typeof item.id === 'string' ? toUUID(item.id) : undefined,
      store_id,
      credit_id: creditId,
      amount,
      payment_method: paymentMethod,
      received_by: item.received_by || item.receivedBy || null,
      notes: item.notes || null,
      created_at: item.created_at || new Date().toISOString(),
    }
    try { console.log('[sync-store-data] recordDuePayment payload:', JSON.stringify(paymentPayload)); } catch (e) {}

    if (!creditId) {
      return { error: 'credit_id is required for credit payments', item }
    }
    if (!(amount > 0)) {
      return { error: 'amount must be greater than 0 for credit payments', item }
    }

    try {
      const { data: credit, error: creditErr } = await executeDbOperation(() => supabaseAdmin
        .from('credit_ledger')
        .select('*')
        .eq('id', creditId)
        .eq('store_id', store_id)
        .maybeSingle(), 'recordDuePayment.findCredit')
      if (creditErr) return { error: creditErr.message || 'Unable to find credit ledger', item }
      if (!credit) return { error: 'Referenced credit ledger not found', item }
      try { console.log('[sync-store-data] matching credit ledger:', JSON.stringify(credit)); } catch (e) {}

      const { data: inserted, error: insertErr } = await executeDbOperation(() => supabaseAdmin
        .from('credit_payments')
        .insert(paymentPayload)
        .select(), 'recordDuePayment.insertPayment')
      if (insertErr) return { error: insertErr.message || 'Failed to insert credit payment', item }

      const newPaid = Number(credit.paid_amount || 0) + amount
      const newDue = Math.max(0, Number(credit.total_amount || 0) - newPaid)
      const newStatus = newDue <= 0 ? 'paid' : (newPaid > 0 ? 'partial' : 'unpaid')

      const { data: updated, error: updateErr } = await executeDbOperation(() => supabaseAdmin
        .from('credit_ledger')
        .update({ paid_amount: newPaid, due_amount: newDue, payment_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', creditId), 'recordDuePayment.updateLedger')

      if (updateErr) {
        await executeDbOperation(() => supabaseAdmin.from('credit_payments').delete().eq('id', inserted?.[0]?.id || paymentPayload.id), 'recordDuePayment.rollbackPayment')
        return { error: updateErr.message || 'Failed to update ledger after payment', item }
      }

      await updatePaymentReports(supabaseAdmin, store_id, paymentMethod, amount)
      results.push({ success: true, payment: inserted?.[0], ledger: updated?.[0] })
    } catch (err) {
      await logSystemError(supabaseAdmin, store_id, 'credit_payments', 'save', item, err)
      return { error: String(err), item }
    }
  }

  return { success: true, saved_count: results.length, results }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  let requestBody: any = {}
  let requestStoreId: string | null = null
  let requestAction = 'unknown'

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const body = await req.json()
    requestBody = body

    const rawAction = body?.action ?? body?.action_type ?? body?.actionType
    const rawDataType = body?.data_type ?? body?.dataType ?? body?.type
    let action = normalizeAction(rawAction)
    let data_type = normalizeDataType(rawDataType)
    const store_id = String(body?.store_id || '').trim()
    const store_code = body?.store_code ?? body?.storeCode ? String(body?.store_code ?? body?.storeCode).trim() : undefined

    const supportedActions = new Set(['save', 'fetch', 'delete', 'update', 'increment'])
    const supportedDataTypes = new Set([
      'menu_items', 'inventory', 'expenses', 'held_bills', 'tables',
      'settings', 'pos_customers', 'credit_ledger', 'credit_payments',
      'advance_requests', 'leave_requests', 'staff_notifications', 'staff_schedules',
      'categories', 'bill_counter', 'sale'
    ])

    if (!supportedActions.has(action) || !supportedDataTypes.has(data_type)) {
      console.warn('[sync-store-data] invalid action/data_type received - auto-normalizing to save/sale', {
        rawAction,
        rawDataType,
        normalized_action: action,
        normalized_data_type: data_type,
      })
      action = 'save'
      data_type = 'sale'
    }

    requestStoreId = store_id || null
    requestAction = action || 'unknown'

    try {
      console.log('[sync-store-data] Incoming request body:', JSON.stringify(body))
      console.log('[sync-store-data] Parsed request metadata:', JSON.stringify({ action, data_type, store_id, store_code }))
    } catch (e) {}

    if (!store_id) {
      return new Response(JSON.stringify({ success: false, error: 'store_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Authenticate the request
    const auth = await authenticateRequest(req, supabaseAdmin, store_id, store_code)
    if (!auth.authorized) {
      return new Response(JSON.stringify({ success: false, error: auth.error || 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Log authenticated user context (if available)
    try {
      const authHeader = req.headers.get('Authorization')
      if (authHeader && authHeader !== 'Bearer null' && !authHeader.endsWith('undefined')) {
        const token = authHeader.replace('Bearer ', '')
        try {
          const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token)
          if (user) {
            const { data: roleData } = await supabaseAdmin.from('user_roles').select('role,store_id,customer_id').eq('user_id', user.id).limit(1).maybeSingle()
            console.log('[sync-store-data] authenticated user context:', JSON.stringify({ user_id: user.id, role: roleData?.role, role_store_id: roleData?.store_id, role_customer_id: roleData?.customer_id }))
          }
        } catch (e) {}
      }
    } catch (e) { console.warn('[sync-store-data] auth logging failed') }

    // Verify store exists and is active / fallback if is_active column is missing
    const { data: storeData, error: storeDataError } = await findStoreRecord(supabaseAdmin, store_id)

    if (!storeData) {
      console.warn('[sync-store-data] store lookup failed', { store_id, storeCode: store_code, error: storeDataError })
      return new Response(JSON.stringify({ success: false, error: 'Store not found or inactive', store_missing: true }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ===== MENU ITEMS =====
    if (data_type === 'menu_items') {
      if (action === 'fetch') {
        const { data, error } = await supabaseAdmin
          .from('menu_items').select('*').eq('store_id', store_id)
        if (error) throw error

        const menuItemIds = (data || []).map((item: any) => item.id)
        let ingredientsData: any[] = []
        let variationsData: any[] = []

        if (menuItemIds.length > 0) {
          const { data: ings } = await supabaseAdmin
            .from('menu_item_ingredients').select('*').in('menu_item_id', menuItemIds)
          ingredientsData = ings || []

          const { data: vars } = await supabaseAdmin
            .from('menu_item_variations').select('*').in('menu_item_id', menuItemIds).order('sort_order', { ascending: true })
          variationsData = vars || []
        }

        return new Response(JSON.stringify({ success: true, items: data || [], ingredients: ingredientsData, variations: variationsData }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        if (!items?.length) {
          return new Response(JSON.stringify({ error: 'items required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const dbItems = items.map((item: any) => ({
          ...(item.id ? { id: item.id } : {}),
          store_id,
          name: item.name,
          name_hindi: item.nameHindi || item.name_hindi || null,
          price: item.price || 0,
          category: item.category || 'General',
          is_available: item.isAvailable !== undefined ? item.isAvailable : (item.is_available !== undefined ? item.is_available : true),
          preparation_time: item.preparationTime || item.preparation_time || null,
          stock: item.stock || null,
          image_url: item.image || item.image_url || null,
          linked_inventory_id: item.linkedInventoryId || item.linked_inventory_id || null,
          gramage_per_unit: item.gramagePerUnit || item.gramage_per_unit || 0,
          sku: item.sku || null,
        }))

        const { data, error } = await supabaseAdmin
          .from('menu_items').upsert(dbItems).select()
        if (error) throw error

        return new Response(JSON.stringify({ success: true, items: data || [], saved_count: dbItems.length }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'delete') {
        const { item_ids } = body
        if (!item_ids?.length) {
          return new Response(JSON.stringify({ error: 'item_ids required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        await supabaseAdmin.from('menu_item_ingredients').delete().in('menu_item_id', item_ids)
        await supabaseAdmin.from('menu_item_variations').delete().in('menu_item_id', item_ids)
        const { error } = await supabaseAdmin
          .from('menu_items').delete().eq('store_id', store_id).in('id', item_ids)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'update') {
        const { item_id, updates } = body
        if (!item_id) {
          return new Response(JSON.stringify({ error: 'item_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const { error } = await supabaseAdmin
          .from('menu_items').update(updates).eq('id', item_id).eq('store_id', store_id)
        if (error) throw error

        if (body.ingredients !== undefined) {
          await supabaseAdmin.from('menu_item_ingredients').delete().eq('menu_item_id', item_id)
          if (body.ingredients.length > 0) {
            await supabaseAdmin.from('menu_item_ingredients').insert(
              body.ingredients.map((ing: any) => ({
                menu_item_id: item_id,
                inventory_item_id: ing.inventoryItemId || ing.inventory_item_id,
                quantity_required: ing.quantityRequired || ing.quantity_required,
                unit: ing.unit
              }))
            )
          }
        }

        if (body.variations !== undefined) {
          await supabaseAdmin.from('menu_item_variations').delete().eq('menu_item_id', item_id)
          if (body.variations.length > 0) {
            await supabaseAdmin.from('menu_item_variations').insert(
              body.variations.map((v: any, idx: number) => ({
                menu_item_id: item_id,
                name: v.name,
                sku: v.sku || null,
                price: v.price || 0,
                is_available: v.isAvailable !== undefined ? v.isAvailable : true,
                stock: v.stock || null,
                sort_order: v.sortOrder !== undefined ? v.sortOrder : idx,
                unit: v.unit || 'pcs'
              }))
            )
          }
        }

        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== INVENTORY =====
    if (data_type === 'inventory') {
      if (action === 'fetch') {
        const { data, error } = await supabaseAdmin
          .from('inventory_items').select('*').eq('store_id', store_id)
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        if (!items?.length) {
          return new Response(JSON.stringify({ error: 'items required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const dbItems = items.map((item: any) => ({
          id: item.id,
          store_id,
          name: item.name,
          quantity: item.quantity || 0,
          unit: item.unit || 'pcs',
          min_stock: item.minStock || item.min_stock || 0,
          cost_per_unit: item.costPerUnit || item.cost_per_unit || 0,
          cost_unit: item.costUnit || item.cost_unit || 'pcs',
          production_yield: item.productionYield || item.production_yield || null,
          production_yield_unit: item.productionYieldUnit || item.production_yield_unit || null,
          updated_at: new Date().toISOString(),
        }))

        const { error } = await supabaseAdmin
          .from('inventory_items').upsert(dbItems, { onConflict: 'id' })
        if (error) throw error

        return new Response(JSON.stringify({ success: true, saved_count: dbItems.length }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'delete') {
        const { item_ids } = body
        if (!item_ids?.length) {
          return new Response(JSON.stringify({ error: 'item_ids required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const { error } = await supabaseAdmin
          .from('inventory_items').delete().eq('store_id', store_id).in('id', item_ids)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== EXPENSES =====
    if (data_type === 'expenses') {
      if (action === 'fetch') {
        const { data, error } = await supabaseAdmin
          .from('expenses').select('*').eq('store_id', store_id).order('date', { ascending: false })
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        if (!items?.length) {
          return new Response(JSON.stringify({ error: 'items required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const dbItems = items.map((item: any) => ({
          id: item.id,
          store_id,
          category: item.category || 'General',
          amount: item.amount || 0,
          description: item.description || '',
          date: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
          paid_by: item.paidBy || item.paid_by || '',
          updated_at: new Date().toISOString(),
        }))

        const { error } = await supabaseAdmin
          .from('expenses').upsert(dbItems, { onConflict: 'id' })
        if (error) throw error

        return new Response(JSON.stringify({ success: true, saved_count: dbItems.length }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'delete') {
        const { item_ids } = body
        if (!item_ids?.length) {
          return new Response(JSON.stringify({ error: 'item_ids required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const { error } = await supabaseAdmin
          .from('expenses').delete().eq('store_id', store_id).in('id', item_ids)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== HELD BILLS =====
    if (data_type === 'held_bills') {
      if (action === 'fetch') {
        const { data, error } = await supabaseAdmin
          .from('held_bills').select('*').eq('store_id', store_id)
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        if (!items?.length) {
          return new Response(JSON.stringify({ error: 'items required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const dbItems = items.map((item: any) => ({
          id: item.id,
          store_id,
          items: item.items || [],
          table_number: item.tableNumber || item.table_number || null,
          customer_name: item.customerName || item.customer_name || null,
          held_at: item.heldAt ? new Date(item.heldAt).toISOString() : new Date().toISOString(),
        }))

        const { error } = await supabaseAdmin
          .from('held_bills').upsert(dbItems, { onConflict: 'id' })
        if (error) throw error

        return new Response(JSON.stringify({ success: true, saved_count: dbItems.length }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'delete') {
        const { item_ids } = body
        if (!item_ids?.length) {
          return new Response(JSON.stringify({ error: 'item_ids required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const { error } = await supabaseAdmin
          .from('held_bills').delete().eq('store_id', store_id).in('id', item_ids)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== TABLES =====
    if (data_type === 'tables') {
      if (action === 'fetch') {
        const { data, error } = await supabaseAdmin
          .from('store_settings').select('*').eq('store_id', store_id).eq('setting_key', 'tables')
        if (error) throw error
        const tables = data?.[0]?.setting_value || []
        return new Response(JSON.stringify({ success: true, items: tables }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        const { error } = await supabaseAdmin
          .from('store_settings')
          .upsert({
            store_id,
            setting_key: 'tables',
            setting_value: items || [],
            updated_at: new Date().toISOString(),
          }, { onConflict: 'store_id,setting_key' })
        if (error) {
          await supabaseAdmin
            .from('store_settings')
            .update({ setting_value: items || [], updated_at: new Date().toISOString() })
            .eq('store_id', store_id)
            .eq('setting_key', 'tables')
        }
        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== SETTINGS =====
    if (data_type === 'settings') {
      if (action === 'fetch') {
        const { data, error } = await supabaseAdmin
          .from('store_settings').select('*').eq('store_id', store_id)
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { settings } = body
        if (!settings || typeof settings !== 'object') {
          return new Response(JSON.stringify({ error: 'settings object required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const dbSettings = Object.entries(settings).map(([key, value]) => ({
          store_id,
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString(),
        }))

        for (const setting of dbSettings) {
          const { error } = await supabaseAdmin
            .from('store_settings')
            .upsert(setting, { onConflict: 'store_id,setting_key' })
          if (error) {
            await supabaseAdmin
              .from('store_settings')
              .update({ setting_value: setting.setting_value, updated_at: setting.updated_at })
              .eq('store_id', store_id)
              .eq('setting_key', setting.setting_key)
          }
        }

        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== POS CUSTOMERS =====
    if (data_type === 'pos_customers') {
      if (action === 'fetch') {
        const { data, error } = await supabaseAdmin
          .from('pos_customers').select('*').eq('store_id', store_id).order('created_at', { ascending: false })
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        if (!items?.length) {
          return new Response(JSON.stringify({ error: 'items required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const dbItems = items.map((item: any) => ({
          ...(item.id ? { id: item.id } : {}),
          store_id,
          name: item.name || '',
          phone: item.phone || null,
          email: item.email || null,
          address: item.address || null,
          city: item.city || null,
          state: item.state || null,
          pincode: item.pincode || null,
        }))
        const { data, error } = await supabaseAdmin
          .from('pos_customers').upsert(dbItems).select()
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'delete') {
        const { item_ids } = body
        if (!item_ids?.length) {
          return new Response(JSON.stringify({ error: 'item_ids required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const { error } = await supabaseAdmin
          .from('pos_customers').delete().eq('store_id', store_id).in('id', item_ids)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== CREDIT LEDGER =====
    if (data_type === 'credit_ledger') {
      if (action === 'fetch') {
        const { data, error } = await executeDbOperation(() => supabaseAdmin
          .from('credit_ledger').select('*').eq('store_id', store_id).order('created_at', { ascending: false }), 'credit_ledger.fetch')
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        const result = await saveDueTransaction(supabaseAdmin, store_id, items, storeData?.customer_id || null)
        if (result.error) {
          return new Response(JSON.stringify({ success: false, error: result.error, detail: result.item || null }),
            { status: result.error.includes('required') ? 400 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify(result),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== CREDIT PAYMENTS =====
    if (data_type === 'credit_payments') {
      if (action === 'fetch') {
        const { data, error } = await executeDbOperation(() => supabaseAdmin
          .from('credit_payments').select('*').eq('store_id', store_id).order('created_at', { ascending: false }), 'credit_payments.fetch')
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const items = body.items || (body.payment ? [body.payment] : body.payments || [])
        const result = await recordDuePayment(supabaseAdmin, store_id, items, storeData?.customer_id || null)
        if (result.error) {
          return new Response(JSON.stringify({ success: false, error: result.error, detail: result.item || null }),
            { status: result.error.includes('required') ? 400 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify(result),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== SALE PAYLOAD =====
    if (data_type === 'sale') {
      if (action === 'save') {
        const recordId = body?.record_id || body?.recordId || body?.id
        const payload = body?.payload || {}
        const customerId = payload?.customer_id || payload?.customerId || null
        const amount = Number(payload?.amount ?? payload?.total_amount ?? 0)
        const paymentMode = String(payload?.payment_mode || payload?.paymentMode || payload?.paymentType || 'DUE')
        const billNo = payload?.bill_no || payload?.billNo || payload?.billNumber || null

        if (!recordId) {
          return new Response(JSON.stringify({ success: false, error: 'record_id is required for sale payload' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        if (!(amount > 0)) {
          return new Response(JSON.stringify({ success: false, error: 'payload.amount must be greater than 0 for sale payload' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        const item = {
          id: toUUID(String(recordId)),
          store_id,
          customer_id: normalizeUuidField(String(customerId || '')),
          customer_name: payload?.customer_name || payload?.customerName || null,
          customer_phone: payload?.customer_phone || payload?.customerPhone || ((customerId && isPhoneNumber(String(customerId))) ? String(customerId) : null),
          bill_number: billNo,
          order_id: toUUID(String(recordId)),
          total_amount: amount,
          paid_amount: 0,
          due_amount: amount,
          payment_status: 'unpaid',
          notes: `Auto-mapped sale payload payment_mode=${paymentMode}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const result = await saveDueTransaction(supabaseAdmin, store_id, [item], storeData?.customer_id || null)
        if (result.error) {
          return new Response(JSON.stringify({ success: false, error: result.error, detail: result.item || null }),
            { status: result.error.includes('required') ? 400 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify(result),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== ADVANCE REQUESTS =====
    if (data_type === 'advance_requests') {
      if (action === 'fetch') {
        const { staff_id } = body
        let query = supabaseAdmin.from('advance_requests').select('*').eq('store_id', store_id).order('created_at', { ascending: false })
        if (staff_id) query = query.eq('staff_id', staff_id)
        const { data, error } = await query
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        if (!items?.length) {
          return new Response(JSON.stringify({ error: 'items required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const dbItems = items.map((item: any) => ({
          ...(item.id ? { id: item.id } : {}),
          store_id,
          staff_id: item.staffId || item.staff_id,
          staff_name: item.staffName || item.staff_name,
          amount: item.amount || 0,
          reason: item.reason || null,
          status: item.status || 'pending',
          approved_by: item.approvedBy || item.approved_by || null,
          approved_at: item.approvedAt || item.approved_at || null,
          paid_at: item.paidAt || item.paid_at || null,
        }))
        const { data, error } = await supabaseAdmin
          .from('advance_requests').upsert(dbItems).select()
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== LEAVE REQUESTS =====
    if (data_type === 'leave_requests') {
      if (action === 'fetch') {
        const { staff_id } = body
        let query = supabaseAdmin.from('leave_requests').select('*').eq('store_id', store_id).order('created_at', { ascending: false })
        if (staff_id) query = query.eq('staff_id', staff_id)
        const { data, error } = await query
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        if (!items?.length) {
          return new Response(JSON.stringify({ error: 'items required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const dbItems = items.map((item: any) => ({
          ...(item.id ? { id: item.id } : {}),
          store_id,
          staff_id: item.staffId || item.staff_id,
          staff_name: item.staffName || item.staff_name,
          leave_type: item.type || item.leave_type || 'casual',
          start_date: item.startDate || item.start_date,
          end_date: item.endDate || item.end_date,
          reason: item.reason || null,
          status: item.status || 'pending',
          approved_by: item.approvedBy || item.approved_by || null,
          approved_at: item.approvedAt || item.approved_at || null,
        }))
        const { data, error } = await supabaseAdmin
          .from('leave_requests').upsert(dbItems).select()
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== STAFF NOTIFICATIONS =====
    if (data_type === 'staff_notifications') {
      if (action === 'fetch') {
        const { staff_id } = body
        let query = supabaseAdmin.from('staff_notifications').select('*').eq('store_id', store_id).order('created_at', { ascending: false }).limit(100)
        if (staff_id) query = query.or(`staff_id.eq.${staff_id},staff_id.is.null`)
        const { data, error } = await query
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        if (!items?.length) {
          return new Response(JSON.stringify({ error: 'items required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const dbItems = items.map((item: any) => ({
          ...(item.id ? { id: item.id } : {}),
          store_id,
          staff_id: item.staffId || item.staff_id || null,
          title: item.title || '',
          message: item.message || null,
          type: item.type || 'info',
          is_read: item.is_read || item.read || false,
          created_by: item.created_by || item.createdBy || null,
        }))
        const { data, error } = await supabaseAdmin
          .from('staff_notifications').upsert(dbItems).select()
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'update') {
        const { item_id, updates } = body
        if (!item_id) {
          return new Response(JSON.stringify({ error: 'item_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const { error } = await supabaseAdmin
          .from('staff_notifications').update(updates).eq('id', item_id).eq('store_id', store_id)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== STAFF SCHEDULES =====
    if (data_type === 'staff_schedules') {
      if (action === 'fetch') {
        const { data, error } = await supabaseAdmin
          .from('staff_schedules').select('*').eq('store_id', store_id).order('date', { ascending: true })
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        if (!items?.length) {
          return new Response(JSON.stringify({ error: 'items required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const dbItems = items.map((item: any) => ({
          ...(item.id ? { id: item.id } : {}),
          store_id,
          staff_id: item.staffId || item.staff_id,
          staff_name: item.staffName || item.staff_name,
          date: item.date,
          shift: item.shift || 'morning',
          start_time: item.startTime || item.start_time || '09:00',
          end_time: item.endTime || item.end_time || '18:00',
          notes: item.notes || null,
        }))
        const { data, error } = await supabaseAdmin
          .from('staff_schedules').upsert(dbItems).select()
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'delete') {
        const { item_ids } = body
        if (!item_ids?.length) {
          return new Response(JSON.stringify({ error: 'item_ids required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const { error } = await supabaseAdmin
          .from('staff_schedules').delete().eq('store_id', store_id).in('id', item_ids)
        if (error) throw error
        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== CATEGORIES =====
    if (data_type === 'categories') {
      if (action === 'fetch') {
        const { data, error } = await supabaseAdmin
          .from('store_categories').select('*').eq('store_id', store_id).order('sort_order', { ascending: true })
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      if (action === 'save') {
        const { items } = body
        if (!items?.length) {
          return new Response(JSON.stringify({ error: 'items required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        const dbItems = items.map((item: any, idx: number) => ({
          store_id,
          category_id: item.id || item.category_id,
          name: item.name,
          name_hindi: item.nameHindi || item.name_hindi || null,
          icon: item.icon || '📦',
          color: item.color || 'cat-food',
          sort_order: item.sortOrder !== undefined ? item.sortOrder : idx,
        }))
        // Delete existing and re-insert for clean sync
        await supabaseAdmin.from('store_categories').delete().eq('store_id', store_id)
        const { data, error } = await supabaseAdmin.from('store_categories').insert(dbItems).select()
        if (error) throw error
        return new Response(JSON.stringify({ success: true, items: data || [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
    }

    // ===== BILL COUNTERS =====
    if (data_type === 'bill_counter') {
      if (action === 'increment') {
        const { counter_type } = body // 'bill' or 'kot'
        const today = new Date().toISOString().split('T')[0]
        
        if (counter_type === 'bill') {
          // Atomic increment
          const { data, error } = await supabaseAdmin.rpc('increment_bill_counter', { p_store_id: store_id, p_date: today })
          if (error) throw error
          return new Response(JSON.stringify({ success: true, counter: data }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        
        if (counter_type === 'kot') {
          const { data, error } = await supabaseAdmin.rpc('increment_kot_counter', { p_store_id: store_id, p_date: today })
          if (error) throw error
          return new Response(JSON.stringify({ success: true, counter: data }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      }
    }

    console.warn('[sync-store-data] Unsupported action/data_type combination', {
      action: rawAction,
      data_type: rawDataType,
      normalized_action: action,
      normalized_data_type: data_type,
      store_id,
      store_code: body?.store_code || body?.storeCode,
      body,
    })

    await logSystemError(supabaseAdmin, store_id, 'sync-store-data', 'invalid_request', {
      request_body: body,
      raw_action: rawAction,
      raw_data_type: rawDataType,
      normalized_action: action,
      normalized_data_type: data_type,
    }, { message: 'Unsupported action/data_type combination' })

    return new Response(JSON.stringify({
      success: true,
      warning: 'Unsupported action or data_type combination - request ignored safely.',
      unsupported_request: true,
      request: {
        action: rawAction,
        data_type: rawDataType,
      },
    }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: unknown) {
    console.error('Error:', error)
    try {
      if (requestStoreId && typeof requestStoreId === 'string') {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false }
        })
        await logSystemError(supabaseAdmin, requestStoreId, 'sync-store-data', requestAction, requestBody, error)
      }
    } catch (logErr) {
      console.error('Failed to log system error:', logErr)
    }
    const safeError = error instanceof Error ? error.message : String(error || 'An unexpected error occurred')
    const stack = error instanceof Error ? error.stack : null
    return new Response(JSON.stringify({ success: false, error: safeError, stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
