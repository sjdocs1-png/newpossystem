import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pdjroppybrndaldgcdzk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkanJvcHB5YnJuZGFsZGdjZHprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU0OTQ3MiwiZXhwIjoyMDk0MTI1NDcyfQ.3Xa669u4yUVxYuAkG38nc_OQR49EOvlgJHh8VqjFTtg';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function importSampleData() {
  console.log('🚀 Starting data import...\n');

  try {
    // Step 1: Import customer
    console.log('Step 1: Importing customer...');
    const customerId = '1f309c22-eb0a-4786-984a-091857f72689';
    const { error: customerError } = await supabase
      .from('customers')
      .upsert({
        id: customerId,
        business_name: 'Golden Desserts & More',
        owner_email: 'soihal@gmail.com',
        owner_name: 'SOHAIL',
        phone: '9959177568',
        subscription_plan: 'yearly',
        subscription_tier: 'platinum',
        is_active: true,
        max_stores: 4,
        approval_status: 'approved',
        staff_limit: 2,
        outlet_limit: 1
      });
    
    if (customerError) {
      console.error('❌ Customer import failed:', customerError);
    } else {
      console.log('✅ Customer imported');
    }

    // Step 2: Import store
    console.log('\nStep 2: Importing store...');
    const storeId = 'b2e79446-68ff-4f86-89e4-9e0def4e5072';
    const { error: storeError } = await supabase
      .from('stores')
      .upsert({
        id: storeId,
        customer_id: customerId,
        store_name: 'Golden Desserts & More',
        address: 'Shop No 41 Grace Plaza Opp Sabri Masjid S.V. Road Jogeshwari West Mumbai-400102',
        phone: '9959177568',
        is_active: true,
        store_code: '99061369',
        business_type: 'restaurant',
        country: 'India',
        currency_code: 'INR',
        tax_type: 'GST'
      });
    
    if (storeError) {
      console.error('❌ Store import failed:', storeError);
    } else {
      console.log('✅ Store imported');
    }

    // Step 3: Create sample credit ledger entries
    console.log('\nStep 3: Creating sample credit ledger entries...');
    const creditEntries = [
      {
        store_id: storeId,
        customer_name: 'Rahul Sharma',
        customer_phone: '9876543210',
        bill_number: 'BILL-001',
        total_amount: 5000,
        paid_amount: 0,
        due_amount: 5000,
        payment_status: 'unpaid',
        notes: 'Sample credit entry 1'
      },
      {
        store_id: storeId,
        customer_name: 'Priya Patel',
        customer_phone: '9123456789',
        bill_number: 'BILL-002',
        total_amount: 9000,
        paid_amount: 2000,
        due_amount: 7000,
        payment_status: 'partial',
        notes: 'Sample credit entry 2'
      },
      {
        store_id: storeId,
        customer_name: 'Arun Verma',
        customer_phone: '8765432109',
        bill_number: 'BILL-003',
        total_amount: 14000,
        paid_amount: 0,
        due_amount: 14000,
        payment_status: 'unpaid',
        notes: 'Sample credit entry 3 - Due amount matches reported 14,000'
      }
    ];

    const { error: creditError, data: creditData } = await supabase
      .from('credit_ledger')
      .insert(creditEntries);
    
    if (creditError) {
      console.error('❌ Credit ledger import failed:', creditError);
    } else {
      console.log(`✅ ${creditData?.length || creditEntries.length} credit ledger entries created`);
    }

    console.log('\n✨ Data import completed!\n');
    
    // Verify
    console.log('Verification:');
    const { data: stores } = await supabase.from('stores').select('*');
    console.log(`- Stores: ${stores?.length || 0}`);
    
    const { data: credits } = await supabase.from('credit_ledger').select('*').eq('store_id', storeId);
    console.log(`- Credit ledger entries: ${credits?.length || 0}`);
    console.log(`- Total due amount: ₹${credits?.reduce((sum, c) => sum + (c.due_amount || 0), 0) || 0}`);

  } catch (err) {
    console.error('❌ Error during import:', err);
  }
}

importSampleData();
