import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pdjroppybrndaldgcdzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkanJvcHB5YnJuZGFsZGdjZHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NDk0NzIsImV4cCI6MjA5NDEyNTQ3Mn0.jlPQa25Kb0YeOiKptavlHPKmh-C40i7KqWichdGSOhg';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test 1: Get ALL stores (not just active)
console.log('=== Fetching ALL stores (no filter) ===');
const { data: allStores, error: allStoresError } = await supabase
  .from('stores')
  .select('*');

if (allStoresError) {
  console.error('Error:', allStoresError);
} else {
  console.log(`Total stores: ${allStores?.length || 0}`);
  if (allStores && allStores.length > 0) {
    console.log('First store:', JSON.stringify(allStores[0], null, 2));
  }
}

// Test 2: Check credit_ledger table structure
console.log('\n=== Checking credit_ledger table ===');
const { data: creditSample, error: creditError } = await supabase
  .from('credit_ledger')
  .select('*')
  .limit(5);

if (creditError) {
  console.error('Error accessing credit_ledger:', creditError);
} else {
  console.log(`Credit ledger entries: ${creditSample?.length || 0}`);
}
