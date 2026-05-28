# IMMEDIATE RLS DEBUGGING - Step by Step

## STEP 1: Temporary RLS Isolation Test (CRITICAL)

### Go to Supabase Dashboard → SQL Editor
Copy-paste and run these commands ONE BY ONE:

```sql
-- Check current RLS state
SELECT * FROM pg_tables WHERE tablename = 'credit_ledger';

-- DISABLE RLS temporarily to isolate root cause
ALTER TABLE credit_ledger DISABLE ROW LEVEL SECURITY;

-- Verify disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'credit_ledger';
```

### Then test in POS app:
1. Create a NEW due bill
2. Open Credit Ledger page
3. Check if ledger now shows (before it showed ₹0)
4. Screenshot: Reports → Due Outstanding, Due Collected

### Results Expected:
- **IF IT WORKS**: Root cause = BROKEN RLS POLICY ✓
- **IF STILL FAILS**: Root cause = validation or DB column mismatch

---

## STEP 2: Check Function Logs in Supabase

### Go to Supabase Dashboard → Functions → sync-store-data → Logs

Look for these exact strings:
- `[sync-store-data] Incoming request body:` — full payload
- `[sync-store-data] authenticated user context:` — who is calling
- `[sync-store-data] CREDIT LEDGER INSERT FAILED:` — error details
- `[sync-store-data] incoming due item:` — item being processed

Screenshot logs showing:
- Request payload (store_id, order_id, customer_name, total_amount, due_amount)
- Error message (if insert failed)
- Auth user + role

---

## STEP 3: Verify DB Insert After Due Bill

### After creating due bill, go to SQL Editor and run:

```sql
-- Check if credit_ledger rows exist
SELECT id, store_id, order_id, customer_name, total_amount, due_amount, 
       payment_status, created_at
FROM credit_ledger 
ORDER BY created_at DESC 
LIMIT 10;

-- Check row count by store
SELECT store_id, COUNT(*) as total_rows, 
       SUM(total_amount) as total_sales,
       SUM(due_amount) as outstanding_due
FROM credit_ledger
GROUP BY store_id;

-- Check RLS policy on credit_ledger
SELECT * FROM pg_policies 
WHERE tablename = 'credit_ledger';
```

---

## STEP 4: Reports Fallback Check

### In POS app go to Reports page:

Look for these should NOT be ₹0:
- [ ] "Due Outstanding" (total due_amount from credit_ledger or orders with payment_method='due')
- [ ] "Due Collected" (total paid_amount from credit_ledger)  
- [ ] "Pending Credit Bills" (count of unpaid bills)

If these show numbers even though ledger insert failed = FALLBACK WORKING ✓

---

## STEP 5: Create RLS Fix (if RLS is culprit)

### After confirming RLS broke it, RE-ENABLE with correct policies:

```sql
-- Re-enable RLS
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;

-- Create proper policies for service role (function uses it)
CREATE POLICY "Service role full access" 
ON credit_ledger
FOR ALL
USING (true)
WITH CHECK (true);

-- Create policy for authenticated users (owner/staff)
CREATE POLICY "Authenticated users can access own store" 
ON credit_ledger
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stores s
    JOIN user_roles ur ON s.customer_id = ur.customer_id
    WHERE s.id = credit_ledger.store_id
    AND ur.user_id = auth.uid()
    AND ur.is_active = true
  )
);

-- Insert policy for authenticated
CREATE POLICY "Authenticated users can insert own store entries"
ON credit_ledger
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores s
    JOIN user_roles ur ON s.customer_id = ur.customer_id
    WHERE s.id = credit_ledger.store_id
    AND ur.user_id = auth.uid()
    AND ur.is_active = true
  )
);

-- Update policy
CREATE POLICY "Authenticated users can update own store entries"
ON credit_ledger
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM stores s
    JOIN user_roles ur ON s.customer_id = ur.customer_id
    WHERE s.id = credit_ledger.store_id
    AND ur.user_id = auth.uid()
    AND ur.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores s
    JOIN user_roles ur ON s.customer_id = ur.customer_id
    WHERE s.id = credit_ledger.store_id
    AND ur.user_id = auth.uid()
    AND ur.is_active = true
  )
);
```

---

## STEP 6: Check credit_payments RLS

Same issue likely exists on credit_payments table:

```sql
-- Check if credit_payments has RLS
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename IN ('credit_ledger', 'credit_payments');

-- Apply same fix to credit_payments if needed
ALTER TABLE credit_payments ENABLE ROW LEVEL SECURITY;

-- Drop existing broken policies
DROP POLICY IF EXISTS "credit_payments_service_role" ON credit_payments;

-- Create working policy
CREATE POLICY "Service role full access" 
ON credit_payments
FOR ALL
USING (true)
WITH CHECK (true);
```

---

## FINAL VERIFICATION

After all changes, test again in POS:
1. ✓ Create due bill
2. ✓ Check Credit Ledger shows entry
3. ✓ Check Reports shows outstanding due
4. ✓ Record payment on due
5. ✓ Check ledger updates to "partial"
6. ✓ Check outstanding due decreased

---

## Share Back:

1. Screenshot of RLS test results (DISABLED vs ENABLED)
2. Function logs from Supabase (copy-paste console output)
3. SQL query results (credit_ledger counts)
4. Reports page screenshot before/after
5. Error message if insert still fails

**Timeline: Prioritize STEP 1 (RLS test) first — yeh tell karega exact root cause!**
