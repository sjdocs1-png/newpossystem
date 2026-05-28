import fetch from 'node-fetch';
const url = 'https://pdjroppybrndaldgcdzk.supabase.co/functions/v1/sync-store-data';
const payload = {
  action: 'save',
  data_type: 'sale',
  store_id: 'bef7a83f-40b2-471b-b012-f5b02fe7194f',
  record_id: 'mpn6ow2xrkz2t4ln0js',
  payload: {
    customer_id: '07718862274',
    amount: 1208,
    payment_mode: 'DUE',
    bill_no: 'B2605260031'
  }
};

console.log('Request payload:', JSON.stringify(payload, null, 2));
const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
const text = await response.text();
let json;
try {
  json = JSON.parse(text);
} catch (err) {
  json = text;
}
console.log('Status:', response.status, response.statusText);
console.log('Response:', JSON.stringify(json, null, 2));
