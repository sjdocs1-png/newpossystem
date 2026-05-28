import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pdjroppybrndaldgcdzk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkanJvcHB5YnJuZGFsZGdjZHprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU0OTQ3MiwiZXhwIjoyMDk0MTI1NDcyfQ.3Xa669u4yUVxYuAkG38nc_OQR49EOvlgJHh8VqjFTtg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Test 1: First, list all stores to get a valid store_id
console.log('=== Test 1: Fetching stores ===');
const { data: stores, error: storesError } = await supabase
  .from('stores')
  .select('id, store_code, is_active')
  .eq('is_active', true)
  .limit(1);

if (storesError) {
  console.error('Error fetching stores:', storesError);
  process.exit(1);
}

if (!stores || stores.length === 0) {
  console.error('No active stores found');
  process.exit(1);
}

const store = stores[0];
console.log('Found store:', store);

// Test 2: Try to invoke the sync-store-data function
console.log('\n=== Test 2: Invoking sync-store-data function ===');
const { data: functionResult, error: functionError } = await supabase.functions.invoke('sync-store-data', {
  body: {
    action: 'fetch',
    store_id: store.id,
    data_type: 'credit_ledger',
    store_code: store.store_code
  }
});

console.log('Function error:', functionError);
console.log('Function result:', functionResult);

// Test 3: Try direct DB query to compare
console.log('\n=== Test 3: Direct DB query (credit_ledger) ===');
const { data: creditData, error: creditError } = await supabase
  .from('credit_ledger')
  .select('*')
  .eq('store_id', store.id)
  .limit(5);

console.log('Direct query error:', creditError);
console.log('Direct query result count:', creditData?.length || 0);
console.log('Direct query data:', creditData);
