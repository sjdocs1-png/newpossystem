import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pdjroppybrndaldgcdzk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkanJvcHB5YnJuZGFsZGdjZHprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU0OTQ3MiwiZXhwIjoyMDk0MTI1NDcyfQ.3Xa669u4yUVxYuAkG38nc_OQR49EOvlgJHh8VqjFTtg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Inspect all stores and credit data
const { data: stores, error: storesErr } = await supabase.from('stores').select('*');
console.log('=== All Stores ===');
console.log(JSON.stringify(stores, null, 2));

const { data: credits, error: creditsErr } = await supabase.from('credit_ledger').select('*');
console.log('\n=== All Credit Ledger Entries ===');
console.log(JSON.stringify(credits, null, 2));

if (credits && credits.length > 0) {
  const targetStore = credits[0].store_id;
  console.log(`\n=== Testing with store_id: ${targetStore} ===`);
  
  const { data: result, error: funcError } = await supabase.functions.invoke('sync-store-data', {
    body: {
      action: 'fetch',
      store_id: targetStore,
      data_type: 'credit_ledger',
      store_code: 'test'
    }
  });
  
  console.log('Function error:', funcError);
  console.log('Function result:', result);
}
