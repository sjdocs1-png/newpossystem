import fetch from 'node-fetch';

const supabaseUrl = 'https://pdjroppybrndaldgcdzk.supabase.co';
const storeId = 'b2e79446-68ff-4f86-89e4-9e0def4e5072';
const storeCode = '99061369';
const creditId = 'a0a57d25-d2b6-47cc-acc5-7203a7116bff';

const url = `${supabaseUrl}/functions/v1/sync-store-data`;
const payload = {
  action: 'save',
  store_id: storeId,
  data_type: 'credit_payments',
  store_code: storeCode,
  payment: {
    credit_id: creditId,
    amount: 5000,
    payment_method: 'cash',
    received_by: 'Manager',
    notes: 'Test payment'
  }
};

console.log('Testing payment recording...\n');
console.log('Payload:', JSON.stringify(payload, null, 2), '\n');

const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

const text = await response.text();
let body;
try {
  body = JSON.parse(text);
} catch {
  body = text;
}

console.log(`Status: ${response.status} ${response.statusText}`);
console.log(`Response: ${JSON.stringify(body, null, 2)}`);
