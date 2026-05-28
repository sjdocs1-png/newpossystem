import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret, x-webhook-signature',
};

interface PlatformOrder {
  platform: 'swiggy' | 'zomato';
  orderId: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryInstructions?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    itemId?: string;
  }>;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  estimatedDeliveryTime?: string;
  orderNotes?: string;
}

// Commission rates by platform
const COMMISSION_RATES: Record<string, number> = {
  swiggy: 22,
  zomato: 20,
};

// Verify webhook signature
async function verifyWebhookSignature(platform: string, signature: string | null, rawBody: string): Promise<boolean> {
  const secretEnvKey = `${platform.toUpperCase()}_WEBHOOK_SECRET`;
  const secret = Deno.env.get(secretEnvKey);

  if (!secret) {
    console.warn(`No webhook secret configured for platform: ${platform} (env: ${secretEnvKey})`);
    return false;
  }

  if (!signature) {
    console.warn(`No signature provided for platform: ${platform}`);
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const expectedSignature = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

  return signature === expectedSignature;
}

// Parse Swiggy order format
function parseSwiggyOrder(payload: any): PlatformOrder {
  return {
    platform: 'swiggy',
    orderId: payload.order_id || payload.id,
    customerName: payload.customer?.name || 'Swiggy Customer',
    customerPhone: payload.customer?.phone,
    deliveryAddress: payload.delivery_address?.full_address,
    deliveryInstructions: payload.delivery_instructions,
    items: (payload.items || []).map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      itemId: item.item_id,
    })),
    subtotal: payload.subtotal || 0,
    tax: payload.tax || 0,
    deliveryFee: payload.delivery_fee || 0,
    total: payload.total || 0,
    estimatedDeliveryTime: payload.estimated_delivery_time,
    orderNotes: payload.order_notes,
  };
}

// Parse Zomato order format
function parseZomatoOrder(payload: any): PlatformOrder {
  return {
    platform: 'zomato',
    orderId: payload.order_id || payload.id,
    customerName: payload.customer?.name || 'Zomato Customer',
    customerPhone: payload.customer?.phone,
    deliveryAddress: payload.delivery_address?.full_address,
    deliveryInstructions: payload.delivery_instructions,
    items: (payload.items || []).map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      itemId: item.item_id,
    })),
    subtotal: payload.subtotal || 0,
    tax: payload.tax || 0,
    deliveryFee: payload.delivery_fee || 0,
    total: payload.total || 0,
    estimatedDeliveryTime: payload.estimated_delivery_time,
    orderNotes: payload.order_notes,
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const platform = url.searchParams.get('platform');

    if (!platform || !['swiggy', 'zomato'].includes(platform)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing platform parameter. Use ?platform=swiggy or ?platform=zomato' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get raw body for signature verification
    const rawBody = await req.text();
    const signature = req.headers.get('x-webhook-signature') || req.headers.get('X-Webhook-Signature');

    // Verify webhook signature (optional but recommended)
    const isValidSignature = await verifyWebhookSignature(platform, signature, rawBody);

    if (!isValidSignature) {
      console.warn(`Invalid signature for ${platform} webhook`);
      // Continue processing but log the warning
    }

    // Parse the order data
    const payload = JSON.parse(rawBody);
    let orderData: PlatformOrder;

    if (platform === 'swiggy') {
      orderData = parseSwiggyOrder(payload);
    } else if (platform === 'zomato') {
      orderData = parseZomatoOrder(payload);
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find store by platform credentials or webhook configuration
    // This would need to be configured per store
    const storeId = payload.store_id || Deno.env.get('DEFAULT_STORE_ID');

    if (!storeId) {
      return new Response(
        JSON.stringify({ error: 'Store ID not found. Configure store_id in payload or set DEFAULT_STORE_ID env var.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if order already exists
    const { data: existingOrder } = await supabaseClient
      .from('qr_orders')
      .select('id')
      .eq('platform_order_id', orderData.orderId)
      .eq('platform_type', platform)
      .maybeSingle();

    if (existingOrder) {
      console.log(`Order ${orderData.orderId} from ${platform} already exists, skipping`);
      return new Response(
        JSON.stringify({ success: true, message: 'Order already exists', orderId: existingOrder.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate order number
    const orderNumber = `${platform.toUpperCase()}${Date.now().toString().slice(-6)}`;

    // Calculate commission
    const commissionRate = COMMISSION_RATES[platform] || 15;
    const commission = (orderData.total * commissionRate) / 100;

    // Create the order
    const { data: newOrder, error: insertError } = await supabaseClient
      .from('qr_orders')
      .insert({
        store_id: storeId,
        order_number: orderNumber,
        platform_type: platform,
        platform_order_id: orderData.orderId,
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        delivery_address: orderData.deliveryAddress,
        delivery_instructions: orderData.deliveryInstructions,
        estimated_delivery_time: orderData.estimatedDeliveryTime,
        items: orderData.items,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        total: orderData.total,
        delivery_fee: orderData.deliveryFee,
        platform_commission: commission,
        status: 'pending',
        notes: orderData.orderNotes,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting platform order:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Created ${platform} order: ${orderNumber} (${orderData.orderId})`);

    // Trigger real-time notification (orders will appear in the UI automatically)
    // The existing realtime subscription in QROrdersPanel will handle this

    return new Response(
      JSON.stringify({
        success: true,
        orderId: newOrder.id,
        orderNumber: orderNumber,
        platformOrderId: orderData.orderId,
        message: `${platform} order created successfully`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Platform order webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});