import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pdjroppybrndaldgcdzk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkanJvcHB5YnJuZGFsZGdjZHprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1NDk0NzIsImV4cCI6MjA5NDEyNTQ3Mn0.E_rWWq97h4dGOvxB5TfQN6vQWLLwEpvnLFVYJpvvPJc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const storeId = 'b2e79446-68ff-4f86-89e4-9e0def4e5072';
const storeCode = '99061369';
// Arun Verma's credit entry ID
const creditId = 'a0a57d25-d2b6-47cc-acc5-7203a7116bff';

console.log('💳 Testing Payment Recording (handlePayDue)\n');
console.log('Recording payment for Arun Verma (₹5,000 of ₹14,000 due)...\n');

// Test recording a payment
const { data: paymentData, error: paymentError } = await supabase.functions.invoke('sync-store-data', {
  body: {
    action: 'save',
    store_id: storeId,
    data_type: 'credit_payments',
    store_code: storeCode,
    payment: {
      credit_id: creditId,
      amount: 5000,
      payment_method: 'cash',
      received_by: 'Manager',
      notes: 'Test payment - marked as partial'
    }
  }
});

if (paymentError) {
  console.log('❌ Payment recording failed:', paymentError.message);
} else {
  console.log('✅ Payment recorded successfully!');
  console.log('Response:', JSON.stringify(paymentData, null, 2));
}

// Fetch updated credit ledger
console.log('\n📊 Fetching updated credit ledger...\n');

const { data: updatedData, error: fetchError } = await supabase.functions.invoke('sync-store-data', {
  body: {
    action: 'fetch',
    store_id: storeId,
    data_type: 'credit_ledger',
    store_code: storeCode
  }
});

if (fetchError) {
  console.log('❌ Fetch failed:', fetchError.message);
} else {
  console.log('✅ Updated credit ledger:');
  const arunEntry = updatedData.items.find(item => item.id === creditId);
  if (arunEntry) {
    console.log(`\nArun Verma's entry:`);
    console.log(`  Total: ₹${arunEntry.total_amount}`);
    console.log(`  Previously paid: ₹0`);
    console.log(`  Now paid: ₹${arunEntry.paid_amount}`);
    console.log(`  Remaining due: ₹${arunEntry.due_amount}`);
    console.log(`  Status: ${arunEntry.payment_status}`);
  }
}
