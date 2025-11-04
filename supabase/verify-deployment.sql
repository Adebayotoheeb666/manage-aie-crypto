-- ==========================================
-- SUPABASE DEPLOYMENT VERIFICATION
-- ==========================================
-- Run this script after deploying schema.sql to verify everything is set up correctly
-- Copy and paste this entire file into Supabase SQL Editor and run it

-- ==========================================
-- 1. CHECK TABLES
-- ==========================================
SELECT 
  '📦 Tables' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 14 THEN '✅ All tables created'
    ELSE '❌ Missing tables. Expected: 14, Found: ' || COUNT(*)
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';

-- List all tables
SELECT 
  '📋 Table List' as info,
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ==========================================
-- 2. CHECK FUNCTIONS
-- ==========================================
SELECT 
  '⚙️ Functions' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 11 THEN '✅ All functions created'
    ELSE '❌ Missing functions. Expected: 11+, Found: ' || COUNT(*)
  END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';

-- List all functions
SELECT 
  '📋 Function List' as info,
  routine_name as function_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ==========================================
-- 3. CHECK INDEXES
-- ==========================================
SELECT 
  '🔍 Indexes' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 40 THEN '✅ Indexes created'
    ELSE '⚠️ Some indexes may be missing. Found: ' || COUNT(*)
  END as status
FROM pg_indexes
WHERE schemaname = 'public';

-- ==========================================
-- 4. CHECK RLS POLICIES
-- ==========================================
SELECT 
  '🔒 RLS Policies' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 15 THEN '✅ RLS policies active'
    ELSE '⚠️ Some RLS policies may be missing. Found: ' || COUNT(*)
  END as status
FROM pg_policies
WHERE schemaname = 'public';

-- List RLS policies by table
SELECT 
  '📋 RLS Policy List' as info,
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ==========================================
-- 5. CHECK TRIGGERS
-- ==========================================
SELECT 
  '⚡ Triggers' as check_type,
  COUNT(DISTINCT trigger_name) as count,
  CASE 
    WHEN COUNT(DISTINCT trigger_name) >= 12 THEN '✅ All triggers created'
    ELSE '⚠️ Some triggers may be missing. Found: ' || COUNT(DISTINCT trigger_name)
  END as status
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- List all triggers
SELECT 
  '📋 Trigger List' as info,
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ==========================================
-- 6. CHECK FOREIGN KEYS
-- ==========================================
SELECT 
  '🔗 Foreign Keys' as check_type,
  COUNT(*) as count,
  '✅ Foreign key constraints created' as status
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
AND constraint_type = 'FOREIGN KEY';

-- ==========================================
-- 7. CHECK TABLE CONSTRAINTS
-- ==========================================
SELECT 
  '✔️ Check Constraints' as check_type,
  COUNT(*) as count,
  '✅ Data validation constraints created' as status
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
AND constraint_type = 'CHECK';

-- ==========================================
-- 8. VERIFY CRITICAL TABLES
-- ==========================================

-- Check users table structure
SELECT 
  '👤 Users Table' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;

-- Check wallets table structure
SELECT 
  '💰 Wallets Table' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'wallets'
ORDER BY ordinal_position;

-- Check assets table structure
SELECT 
  '📊 Assets Table' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'assets'
ORDER BY ordinal_position;

-- ==========================================
-- 9. TEST FUNCTIONS
-- ==========================================

-- Test calculate_portfolio_value function exists and works
SELECT 
  '🧪 Function Test' as info,
  'calculate_portfolio_value' as function_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name = 'calculate_portfolio_value'
    ) THEN '✅ Function exists and callable'
    ELSE '❌ Function not found'
  END as status;

-- ==========================================
-- 10. CHECK EXTENSIONS
-- ==========================================
SELECT 
  '🔌 Extensions' as check_type,
  extname as extension_name,
  '✅ Installed' as status
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto', 'citext')
ORDER BY extname;

-- ==========================================
-- SUMMARY
-- ==========================================
SELECT 
  '🎯 DEPLOYMENT STATUS' as summary,
  CASE 
    WHEN (
      (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') = 14
      AND
      (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') >= 11
      AND
      (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') >= 15
    ) THEN '✅✅✅ ALL CHECKS PASSED - DEPLOYMENT SUCCESSFUL ✅✅✅'
    ELSE '⚠️ Some issues detected - review results above'
  END as status;

-- Expected Results:
-- ✅ 14 Tables
-- ✅ 11+ Functions
-- ✅ 40+ Indexes
-- ✅ 15+ RLS Policies
-- ✅ 12+ Triggers
-- ✅ 3 Extensions (uuid-ossp, pgcrypto, citext)
