-- ============================================================================
-- STEP 1: DISABLE RLS TEMPORARILY (ISOLATION TEST)
-- ============================================================================
-- Run this FIRST to test if RLS policy is the root cause

ALTER TABLE credit_ledger DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'credit_ledger';

-- ============================================================================
-- STEP 2: AFTER TESTING (if everything works with RLS disabled):
-- RE-ENABLE RLS WITH PROPER POLICIES
-- ============================================================================

-- Re-enable RLS
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;

-- Drop any existing broken policies first
DROP POLICY IF EXISTS "service_role_access" ON credit_ledger;
DROP POLICY IF EXISTS "authenticated_select" ON credit_ledger;
DROP POLICY IF EXISTS "authenticated_insert" ON credit_ledger;
DROP POLICY IF EXISTS "authenticated_update" ON credit_ledger;
DROP POLICY IF EXISTS "service_role_full_access" ON credit_ledger;

-- Create working policies for authenticated users
CREATE POLICY "authenticated_users_select"
ON credit_ledger
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_users_insert"
ON credit_ledger
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_users_update"
ON credit_ledger
FOR UPDATE
TO authenticated
USING (true);

-- Service role (edge functions) needs full access
CREATE POLICY "service_role_full_access"
ON credit_ledger
FOR ALL
TO service_role
USING (true);

-- ============================================================================
-- SAME FOR CREDIT_PAYMENTS TABLE
-- ============================================================================

ALTER TABLE credit_payments DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "service_role_access" ON credit_payments;
DROP POLICY IF EXISTS "authenticated_select" ON credit_payments;
DROP POLICY IF EXISTS "authenticated_insert" ON credit_payments;
DROP POLICY IF EXISTS "authenticated_update" ON credit_payments;

-- Re-enable
ALTER TABLE credit_payments ENABLE ROW LEVEL SECURITY;

-- Create working policies
CREATE POLICY "authenticated_users_select"
ON credit_payments
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "authenticated_users_insert"
ON credit_payments
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_users_update"
ON credit_payments
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "service_role_full_access"
ON credit_payments
FOR ALL
TO service_role
USING (true);

-- ============================================================================
-- VERIFICATION QUERIES (Run after testing)
-- ============================================================================

-- Check if RLS is enabled/disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('credit_ledger', 'credit_payments');

-- Check policies
SELECT schemaname, tablename, policyname, cmd, permissive
FROM pg_policies 
WHERE tablename IN ('credit_ledger', 'credit_payments')
ORDER BY tablename, policyname;

-- Check actual data in credit_ledger
SELECT id, store_id, order_id, customer_name, total_amount, due_amount, 
       payment_status, created_at
FROM credit_ledger 
ORDER BY created_at DESC 
LIMIT 10;

-- Check credit_ledger summary by store
SELECT store_id, COUNT(*) as total_entries, 
       SUM(total_amount) as total_sales,
       SUM(due_amount) as outstanding_due,
       SUM(paid_amount) as total_paid
FROM credit_ledger
GROUP BY store_id;

-- Check credit_payments
SELECT id, store_id, credit_id, amount, payment_method, created_at
FROM credit_payments
ORDER BY created_at DESC
LIMIT 10;
