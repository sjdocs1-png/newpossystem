import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pdjroppybrndaldgcdzk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkanJvcHB5YnJuZGFsZGdjZHprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU0OTQ3MiwiZXhwIjoyMDk0MTI1NDcyfQ.3Xa669u4yUVxYuAkG38nc_OQR49EOvlgJHh8VqjFTtg';

// Use service role to bypass auth checks
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const storeId = 'b2e79446-68ff-4f86-89e4-9e0def4e5072';
const storeCode = '99061369';

console.log('🧪 Testing sync-store-data function with proper authentication...\n');

// Test 1: Without JWT (should fail with 401 if store validation fails)
console.log('Test 1: Function call without store_code (using store_id only)');
let { data, error } = await supabase.functions.invoke('sync-store-data', {
  body: {
    action: 'fetch',
    store_id: storeId,
    data_type: 'credit_ledger'
  }
});
console.log('Result:', error ? `❌ Error ${error.name}` : '✅ Success');
if (data) {
  console.log('  Items:', data.items?.length || 0);
  console.log('  Total due:', data.items?.reduce((s, i) => s + (i.due_amount || 0), 0) || 0);
}
if (error) {
  console.log('  Error:', error.message || error);
}

// Test 2: With store_code (should work better)
console.log('\nTest 2: Function call WITH store_code');
({ data, error } = await supabase.functions.invoke('sync-store-data', {
  body: {
    action: 'fetch',
    store_id: storeId,
    data_type: 'credit_ledger',
    store_code: storeCode
  }
}));
console.log('Result:', error ? `❌ Error ${error.name}` : '✅ Success');
if (data) {
  console.log('  Items:', data.items?.length || 0);
  if (data.items && data.items.length > 0) {
    console.log('  Entries:');
    data.items.forEach((item, idx) => {
      console.log(`    ${idx + 1}. ${item.customer_name} - ₹${item.due_amount} (${item.payment_status})`);
    });
    console.log('  Total due amount: ₹' + data.items.reduce((s, i) => s + i.due_amount, 0));
  }
}
if (error) {
  console.log('  Full error:', JSON.stringify(error, null, 2));
}
