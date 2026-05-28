# Swiggy & Zomato Integration Guide

This guide explains how to integrate Swiggy and Zomato orders into your PayStore POS system.

## Features

- **Automatic Order Sync**: Receive orders from Swiggy/Zomato via webhooks
- **Manual Order Entry**: Add platform orders manually through the POS interface
- **Platform Identification**: Clear visual indicators for different order sources
- **Delivery Management**: Track delivery addresses, instructions, and ETAs
- **Commission Tracking**: Automatic calculation of platform commissions

## Setup Instructions

### 1. Database Migration

Run the migration to add platform integration fields:

```sql
-- This has been added to: supabase/migrations/20260504000000_add_platform_integration.sql
ALTER TABLE public.qr_orders
ADD COLUMN platform_type TEXT CHECK (platform_type IN ('swiggy', 'zomato', 'qr', 'direct')),
ADD COLUMN platform_order_id TEXT,
ADD COLUMN platform_customer_id TEXT,
ADD COLUMN delivery_address TEXT,
ADD COLUMN delivery_instructions TEXT,
ADD COLUMN estimated_delivery_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN delivery_fee NUMERIC DEFAULT 0,
ADD COLUMN platform_commission NUMERIC DEFAULT 0;
```

### 2. Webhook Configuration

#### For Swiggy:
1. Go to your Swiggy Partner Dashboard
2. Navigate to Settings > Webhooks
3. Set webhook URL: `https://your-project.supabase.co/functions/v1/platform-order-webhook?platform=swiggy`
4. Configure webhook secret in Supabase environment variables:
   - Variable: `SWIGGY_WEBHOOK_SECRET`
   - Value: Your webhook secret from Swiggy

#### For Zomato:
1. Go to your Zomato Partner Dashboard
2. Navigate to Settings > Integrations > Webhooks
3. Set webhook URL: `https://your-project.supabase.co/functions/v1/platform-order-webhook?platform=zomato`
4. Configure webhook secret in Supabase environment variables:
   - Variable: `ZOMATO_WEBHOOK_SECRET`
   - Value: Your webhook secret from Zomato

### 3. Environment Variables

Add these to your Supabase project settings:

```env
# Webhook secrets for signature verification
SWIGGY_WEBHOOK_SECRET=your_swiggy_webhook_secret
ZOMATO_WEBHOOK_SECRET=your_zomato_webhook_secret

# Default store ID (optional, can be overridden in webhook payload)
DEFAULT_STORE_ID=your_default_store_uuid
```

## Webhook Payload Formats

### Swiggy Order Payload
```json
{
  "order_id": "SWIG123456",
  "store_id": "your-store-uuid",
  "customer": {
    "name": "John Doe",
    "phone": "+91-9876543210"
  },
  "delivery_address": {
    "full_address": "123 Main St, City, State 123456"
  },
  "delivery_instructions": "Ring the bell twice",
  "estimated_delivery_time": "2024-05-04T19:30:00Z",
  "items": [
    {
      "name": "Margherita Pizza",
      "quantity": 2,
      "price": 250,
      "item_id": "item_123"
    }
  ],
  "subtotal": 500,
  "tax": 50,
  "delivery_fee": 30,
  "total": 580,
  "order_notes": "Extra cheese on one pizza"
}
```

### Zomato Order Payload
```json
{
  "order_id": "ZOM789012",
  "store_id": "your-store-uuid",
  "customer": {
    "name": "Jane Smith",
    "phone": "+91-9876543211"
  },
  "delivery_address": {
    "full_address": "456 Oak Ave, City, State 123457"
  },
  "delivery_instructions": "Leave at door",
  "estimated_delivery_time": "2024-05-04T20:00:00Z",
  "items": [
    {
      "name": "Chicken Burger",
      "quantity": 1,
      "price": 180,
      "item_id": "item_456"
    }
  ],
  "subtotal": 180,
  "tax": 18,
  "delivery_fee": 25,
  "total": 223,
  "order_notes": "No onions please"
}
```

## Manual Order Entry

If webhooks are not available, you can manually add platform orders:

1. In the POS interface, go to QR Orders panel
2. Click "Platform Order" button
3. Fill in the order details:
   - Platform (Swiggy/Zomato)
   - Platform Order ID
   - Customer details
   - Delivery information
   - Order items and amounts

## Commission Rates

Default commission rates are automatically applied:
- **Swiggy**: 22%
- **Zomato**: 20%

These can be customized in the webhook function code.

## Order Management

### Visual Indicators
- **Swiggy orders**: Orange badge with 🍔 icon
- **Zomato orders**: Red badge with 🍕 icon
- **QR orders**: Green badge with 📱 icon

### Delivery Information
Platform orders show additional delivery details:
- Delivery address
- Special instructions
- Estimated delivery time
- Delivery fee
- Platform commission

### Order Flow
1. **Pending**: New order received
2. **Accepted**: Order confirmed by staff
3. **Preparing**: Food being prepared
4. **Ready**: Order ready for pickup/delivery
5. **Completed**: Order delivered/completed

## Troubleshooting

### Webhook Issues
- Check webhook URL is correct
- Verify webhook secrets are set in environment variables
- Check Supabase function logs for errors
- Ensure store_id is included in webhook payload

### Order Not Appearing
- Check if order already exists (duplicate prevention)
- Verify store_id matches an existing store
- Check database permissions

### Signature Verification
- Webhook signature verification is optional but recommended
- If signatures don't match, orders are still processed but warnings are logged

## API Endpoints

### Webhook Endpoint
```
POST https://your-project.supabase.co/functions/v1/platform-order-webhook?platform={swiggy|zomato}
```

### Manual Order Creation
Handled through the POS interface - no direct API endpoint.

## Security Notes

- Webhook signatures are verified using HMAC-SHA256
- All orders are validated before insertion
- Duplicate orders are prevented
- CORS headers are properly configured

## Support

For integration issues:
1. Check Supabase function logs
2. Verify webhook payload format
3. Ensure environment variables are set
4. Test with manual order entry first