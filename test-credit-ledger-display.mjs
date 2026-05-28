import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pdjroppybrndaldgcdzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkanJvcHB5YnJuZGFsZGdjZHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NDk0NzIsImV4cCI6MjA5NDEyNTQ3Mn0.E_rWWq97h4dGOvxB5TfQN6vQWLLwEpvnLFVYJpvvPJc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const storeId = 'b2e79446-68ff-4f86-89e4-9e0def4e5072';
const storeCode = '99061369';

console.log('📱 Simulating CreditLedger.tsx fetch (store login mode)\n');

// Simulate what the frontend does
async function fetchCreditLedger() {
  console.log('Calling sync-store-data with:');
  console.log(`  store_id: ${storeId}`);
  console.log(`  store_code: ${storeCode}`);
  console.log(`  action: fetch`);
  console.log(`  data_type: credit_ledger\n`);

  const { data, error } = await supabase.functions.invoke('sync-store-data', {
    body: {
      action: 'fetch',
      store_id: storeId,
      data_type: 'credit_ledger',
      store_code: storeCode
    }
  });

  if (error) {
    console.log('❌ Error:', error.message);
    return null;
  }

  if (!data || !data.items) {
    console.log('❌ No data returned');
    return null;
  }

  console.log('✅ Success! Credit ledger loaded:\n');
  console.log(`Total entries: ${data.items.length}`);
  console.log(`\nDetails:`);

  let totalDue = 0;
  data.items.forEach((item, idx) => {
    console.log(`\n  ${idx + 1}. ${item.customer_name}`);
    console.log(`     Phone: ${item.customer_phone}`);
    console.log(`     Bill #: ${item.bill_number}`);
    console.log(`     Total: ₹${item.total_amount}`);
    console.log(`     Paid: ₹${item.paid_amount}`);
    console.log(`     Due: ₹${item.due_amount}`);
    console.log(`     Status: ${item.payment_status}`);
    totalDue += item.due_amount;
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`TOTAL DUE AMOUNT: ₹${totalDue}`);
  console.log(`${'='.repeat(50)}`);

  return data.items;
}

await fetchCreditLedger();
