-- ============================================================================
-- SUPABASE MIGRATION VERIFICATION QUERIES
-- Run these queries to verify the migration was successful
-- ============================================================================

-- ============================================================================
-- SECTION 1: SCHEMA VERIFICATION
-- ============================================================================

-- 1.1 Check all tables exist
SELECT 
  COUNT(*) as table_count,
  STRING_AGG(table_name, ', ' ORDER BY table_name) as tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Expected: Should match count from Lovable project

-- 1.2 List all tables with row counts
SELECT 
  t.table_name,
  (SELECT COUNT(*) FROM information_schema.tables i 
   WHERE i.table_schema = t.table_schema 
   AND i.table_name = t.table_name) as table_exists,
  CASE 
    WHEN schemaname IS NULL THEN 0
    ELSE n_live_tup
  END as row_count
FROM information_schema.tables t
LEFT JOIN pg_stat_user_tables ON pg_stat_user_tables.relname = t.table_name
WHERE t.table_schema = 'public'
ORDER BY t.table_name;

-- 1.3 Verify all functions exist
SELECT 
  COUNT(*) as function_count,
  STRING_AGG(proname, ', ' ORDER BY proname) as functions
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Expected functions:
-- - handle_new_user
-- - is_admin
-- - is_owner
-- - is_store_manager
-- - is_staff
-- - get_user_role
-- - get_user_customer_id
-- - get_user_store_id
-- - generate_8_digit_code

-- 1.4 Verify all triggers exist
SELECT 
  trigger_name,
  table_name,
  event_object_columns,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY table_name, trigger_name;

-- Expected triggers:
-- - hash_staff_pin_trigger
-- - hash_store_password_trigger
-- - update_*_updated_at (on multiple tables)

-- 1.5 Check indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 1.6 Verify RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Expected: All should have rowsecurity = true

-- ============================================================================
-- SECTION 2: DATA VERIFICATION
-- ============================================================================

-- 2.1 Count users
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 ELSE 0 END) as confirmed_users,
  SUM(CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END) as active_users
FROM auth.users;

-- 2.2 Count user_roles by role type
SELECT 
  role,
  COUNT(*) as count,
  SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_count,
  SUM(CASE WHEN is_active = false THEN 1 ELSE 0 END) as inactive_count
FROM public.user_roles
GROUP BY role
ORDER BY count DESC;

-- 2.3 Verify customers
SELECT 
  COUNT(*) as total_customers,
  SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_customers,
  SUM(CASE WHEN subscription_end > NOW() THEN 1 ELSE 0 END) as subscribed_customers
FROM public.customers;

-- 2.4 Verify stores
SELECT 
  COUNT(*) as total_stores,
  COUNT(DISTINCT customer_id) as customers_with_stores,
  SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_stores
FROM public.stores;

-- 2.5 Verify bills and orders
SELECT 
  COUNT(*) as total_bills,
  COUNT(DISTINCT store_id) as stores_with_bills,
  SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_bills,
  SUM(CASE WHEN status = 'hold' THEN 1 ELSE 0 END) as held_bills,
  SUM(total_amount) as total_revenue
FROM public.bills;

-- 2.6 Verify inventory items
SELECT 
  COUNT(*) as total_items,
  COUNT(DISTINCT store_id) as stores_with_inventory,
  SUM(CASE WHEN quantity > 0 THEN 1 ELSE 0 END) as items_in_stock,
  SUM(CASE WHEN quantity <= reorder_level THEN 1 ELSE 0 END) as low_stock_items
FROM public.inventory_items;

-- 2.7 Check for data integrity - orphaned records
SELECT 'Orphaned bills (store not found)' as issue, COUNT(*) as count
FROM public.bills b
LEFT JOIN public.stores s ON b.store_id = s.id
WHERE s.id IS NULL
UNION ALL
SELECT 'Orphaned bill_items (bill not found)', COUNT(*)
FROM public.bill_items bi
LEFT JOIN public.bills b ON bi.bill_id = b.id
WHERE b.id IS NULL
UNION ALL
SELECT 'Orphaned user_roles (user not found)', COUNT(*)
FROM public.user_roles ur
LEFT JOIN auth.users u ON ur.user_id = u.id
WHERE u.id IS NULL
UNION ALL
SELECT 'Orphaned stores (customer not found)', COUNT(*)
FROM public.stores s
LEFT JOIN public.customers c ON s.customer_id = c.id
WHERE c.id IS NULL;

-- ============================================================================
-- SECTION 3: AUTH VERIFICATION
-- ============================================================================

-- 3.1 Test user authentication (example)
-- First, create test user, then run this
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  ur.role,
  ur.is_active,
  c.business_name,
  s.store_name
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.customers c ON ur.customer_id = c.id
LEFT JOIN public.stores s ON ur.store_id = s.id
WHERE u.email = 'test@example.com'
LIMIT 1;

-- 3.2 Check JWT settings
SELECT 
  key,
  value
FROM pg_settings
WHERE name LIKE '%jwt%';

-- 3.3 Verify admin users
SELECT 
  COUNT(*) as admin_count,
  STRING_AGG(u.email, ', ') as admin_emails
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role = 'admin' AND ur.is_active = true;

-- 3.4 Verify owner users
SELECT 
  COUNT(*) as owner_count,
  COUNT(DISTINCT ur.customer_id) as customers_managed,
  STRING_AGG(u.email, ', ') as owner_emails
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role = 'owner' AND ur.is_active = true;

-- 3.5 Check session age (for monitoring)
SELECT 
  'oldest_session' as metric,
  AGE(NOW(), MIN(created_at)) as age
FROM auth.sessions
UNION ALL
SELECT 
  'newest_session',
  AGE(NOW(), MAX(created_at))
FROM auth.sessions;

-- ============================================================================
-- SECTION 4: RLS POLICY VERIFICATION
-- ============================================================================

-- 4.1 List all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4.2 Verify policies are enabled
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
GROUP BY schemaname, tablename, rowsecurity
ORDER BY tablename;

-- 4.3 Check specific policy (example for bills table)
SELECT 
  policyname,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'bills' AND schemaname = 'public'
ORDER BY policyname;

-- ============================================================================
-- SECTION 5: STORAGE VERIFICATION
-- ============================================================================

-- 5.1 List all storage buckets
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
FROM storage.buckets
ORDER BY created_at;

-- 5.2 Check storage policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;

-- 5.3 Count files by bucket
SELECT 
  b.id,
  b.name,
  COUNT(o.id) as file_count,
  SUM(o.metadata->>'size')::bigint as total_size_bytes
FROM storage.buckets b
LEFT JOIN storage.objects o ON b.id = o.bucket_id
GROUP BY b.id, b.name
ORDER BY total_size_bytes DESC NULLS LAST;

-- ============================================================================
-- SECTION 6: EDGE FUNCTION STATUS
-- ============================================================================

-- Note: Edge function status cannot be checked directly from SQL
-- Check manually via Supabase dashboard or API

-- 6.1 Verify function secrets are set (not value, just existence)
-- Run via Supabase CLI:
-- supabase secrets list --project-ref [PROJECT_ID]

-- Expected secrets:
-- - OPENAI_API_KEY
-- - LOVABLE_API_KEY
-- - SUPABASE_URL
-- - SUPABASE_ANON_KEY
-- - SUPABASE_SERVICE_ROLE_KEY

-- ============================================================================
-- SECTION 7: CONSISTENCY CHECKS
-- ============================================================================

-- 7.1 Verify foreign key relationships
SELECT 
  'Bills → Stores' as relationship,
  COUNT(*) as total,
  COUNT(CASE WHEN store_id IS NOT NULL THEN 1 END) as with_reference,
  COUNT(CASE WHEN store_id IS NULL THEN 1 END) as missing_reference
FROM public.bills
UNION ALL
SELECT 
  'Bill Items → Bills',
  COUNT(*),
  COUNT(CASE WHEN bill_id IS NOT NULL THEN 1 END),
  COUNT(CASE WHEN bill_id IS NULL THEN 1 END)
FROM public.bill_items
UNION ALL
SELECT 
  'Stores → Customers',
  COUNT(*),
  COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END),
  COUNT(CASE WHEN customer_id IS NULL THEN 1 END)
FROM public.stores
UNION ALL
SELECT 
  'User Roles → Auth Users',
  COUNT(*),
  COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END),
  COUNT(CASE WHEN user_id IS NULL THEN 1 END)
FROM public.user_roles;

-- 7.2 Check timestamps (created_at and updated_at consistency)
SELECT 
  'Rows with updated_at < created_at' as issue,
  COUNT(*) as count
FROM public.bills
WHERE updated_at < created_at
UNION ALL
SELECT 
  'Future-dated records',
  COUNT(*)
FROM public.bills
WHERE created_at > NOW();

-- 7.3 Verify data type consistency
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'bills'
ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 8: PERFORMANCE CHECKS
-- ============================================================================

-- 8.1 Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 8.2 Check missing indexes (slow queries)
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
ORDER BY tablename;

-- 8.3 Check query cache performance
SELECT 
  name,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE query LIKE '%user_roles%' OR query LIKE '%bills%'
ORDER BY total_time DESC
LIMIT 10;

-- ============================================================================
-- SECTION 9: ENCRYPTION & SECURITY
-- ============================================================================

-- 9.1 Check for pgcrypto extension (password hashing)
SELECT 
  extname,
  extversion
FROM pg_extension
WHERE extname IN ('pgcrypto', 'pgtap', 'uuid-ossp');

-- 9.2 Check password hash algorithms (if stored)
-- Note: Supabase auth.users passwords are encrypted separately
SELECT 
  COUNT(*) as password_count,
  COUNT(CASE WHEN encrypted_password LIKE '$2a$%' THEN 1 END) as bcrypt_hashes,
  COUNT(CASE WHEN encrypted_password LIKE '$2b$%' THEN 1 END) as bcrypt_2b_hashes
FROM auth.users
WHERE encrypted_password IS NOT NULL;

-- 9.3 Check for any unencrypted sensitive data
SELECT 
  'Warning: Unencrypted PINs' as issue,
  COUNT(*) as count
FROM public.user_roles
WHERE pin IS NOT NULL
AND pin !~ '^[a-f0-9]{60}$'  -- Should be sha256 hash
UNION ALL
SELECT 
  'Warning: Unencrypted store passwords',
  COUNT(*)
FROM public.stores
WHERE store_password IS NOT NULL
AND store_password !~ '^[a-f0-9]{60}$';

-- ============================================================================
-- SECTION 10: FINAL SIGN-OFF CHECKLIST
-- ============================================================================

-- Run this query to get a final status report

WITH summary AS (
  SELECT 
    'Users' as metric,
    COUNT(*)::text as value
  FROM auth.users
  UNION ALL
  SELECT 'Customer Accounts', COUNT(*)::text FROM public.customers
  UNION ALL
  SELECT 'Stores', COUNT(*)::text FROM public.stores
  UNION ALL
  SELECT 'Bills/Orders', COUNT(*)::text FROM public.bills
  UNION ALL
  SELECT 'Bill Items', COUNT(*)::text FROM public.bill_items
  UNION ALL
  SELECT 'Inventory Items', COUNT(*)::text FROM public.inventory_items
  UNION ALL
  SELECT 'Staff Members', COUNT(*)::text FROM public.staff
  UNION ALL
  SELECT 'Storage Buckets', COUNT(*)::text FROM storage.buckets
  UNION ALL
  SELECT 'RLS Policies', COUNT(*)::text FROM pg_policies WHERE schemaname = 'public'
  UNION ALL
  SELECT 'Database Functions', COUNT(*)::text FROM pg_proc 
    WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  UNION ALL
  SELECT 'Database Triggers', COUNT(*)::text FROM information_schema.triggers 
    WHERE trigger_schema = 'public'
)
SELECT * FROM summary;

-- ============================================================================
-- CHECKLIST COMPLETION
-- ============================================================================

-- Execute this entire script and verify:

/*
MIGRATION VERIFICATION CHECKLIST:

□ Schema Verification
  □ All tables exist and have correct row counts
  □ All functions are created and callable
  □ All triggers are active
  □ All indexes are present
  □ RLS is enabled on all tables

□ Data Verification
  □ User count matches
  □ Customer data imported
  □ Store data imported
  □ Bills and orders imported
  □ Inventory data imported
  □ No orphaned foreign key references

□ Auth Verification
  □ All users created in auth.users
  □ Email confirmed status correct
  □ User roles correctly mapped
  □ JWT settings verified
  □ Admin/Owner users verified

□ RLS Verification
  □ All policies present
  □ Policies correctly assigned
  □ Admin policies working
  □ Owner-based access working
  □ Staff-level access working

□ Storage Verification
  □ All buckets created
  □ Correct bucket policies
  □ Files accessible as expected
  □ Public/private settings correct

□ Edge Functions
  □ All functions deployed
  □ Secrets configured
  □ Functions responding correctly
  □ API endpoints working

□ Frontend
  □ Environment variables updated
  □ Application builds successfully
  □ Login flow works
  □ Authentication works
  □ No console errors

□ Integration
  □ Realtime subscriptions work
  □ Webhooks functioning
  □ External APIs responding
  □ Email notifications working

SIGN-OFF:

Date: _______________
Verified by: _______________
Approved by: _______________
*/
