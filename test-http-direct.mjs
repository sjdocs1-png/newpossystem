import fetch from 'node-fetch';

const supabaseUrl = 'https://pdjroppybrndaldgcdzk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkanJvcHB5YnJuZGFsZGdjZHprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODU0OTQ3MiwiZXhwIjoyMDk0MTI1NDcyfQ.3Xa669u4yUVxYuAkG38nc_OQR49EOvlgJHh8VqjFTtg';

const storeId = 'b2e79446-68ff-4f86-89e4-9e0def4e5072';
const storeCode = '99061369';

console.log('🔍 Direct HTTP test of sync-store-data function\n');

const url = `${supabaseUrl}/functions/v1/sync-store-data`;
const payload = {
  action: 'fetch',
  store_id: storeId,
  data_type: 'credit_ledger',
  store_code: storeCode
};

console.log('Request:');
console.log(`  URL: ${url}`);
console.log(`  Payload: ${JSON.stringify(payload)}`);
console.log(`  Headers: Content-Type: application/json`);

const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload)
});

const text = await response.text();
let body;
try {
  body = JSON.parse(text);
} catch {
  body = text;
}

console.log(`\nResponse:`);
console.log(`  Status: ${response.status} ${response.statusText}`);
console.log(`  Body: ${JSON.stringify(body, null, 2)}`);
