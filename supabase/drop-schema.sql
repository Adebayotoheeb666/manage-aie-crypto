-- ==========================================
-- CRYPTOVAULT DROP SCHEMA SCRIPT
-- ==========================================
-- WARNING: This script will DROP all tables, functions, and triggers
-- Use with caution - this is destructive and cannot be undone!
-- ==========================================

-- Step 1: Drop all RLS policies (safely)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can manage their own devices" ON public.device_trust;
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can view their own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can manage their own wallets" ON public.wallets;
DROP POLICY IF EXISTS "Users can view their own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can manage their own assets" ON public.assets;
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view their own withdrawals" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can create withdrawal requests" ON public.withdrawal_requests;
DROP POLICY IF EXISTS "Users can manage their own price alerts" ON public.price_alerts;
DROP POLICY IF EXISTS "Users can view their own snapshots" ON public.portfolio_snapshots;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;

-- Step 2: Drop all triggers (must be done before dropping functions)
DROP TRIGGER IF EXISTS users_update_timestamp ON public.users;
DROP TRIGGER IF EXISTS wallets_update_timestamp ON public.wallets;
DROP TRIGGER IF EXISTS assets_update_timestamp ON public.assets;
DROP TRIGGER IF EXISTS transactions_update_timestamp ON public.transactions;
DROP TRIGGER IF EXISTS withdrawal_requests_update_timestamp ON public.withdrawal_requests;
DROP TRIGGER IF EXISTS price_alerts_update_timestamp ON public.price_alerts;
DROP TRIGGER IF EXISTS api_keys_update_timestamp ON public.api_keys;
DROP TRIGGER IF EXISTS wallets_log_connection ON public.wallets;
DROP TRIGGER IF EXISTS wallets_log_disconnection ON public.wallets;
DROP TRIGGER IF EXISTS transactions_log_creation ON public.transactions;
DROP TRIGGER IF EXISTS withdrawal_requests_log_creation ON public.withdrawal_requests;
DROP TRIGGER IF EXISTS withdrawal_requests_log_status ON public.withdrawal_requests;
DROP TRIGGER IF EXISTS withdrawal_requests_validate ON public.withdrawal_requests;
DROP TRIGGER IF EXISTS transactions_create_snapshot ON public.transactions;

-- Step 3: Drop all trigger functions
DROP FUNCTION IF EXISTS public.update_users_timestamp() CASCADE;
DROP FUNCTION IF EXISTS public.update_wallets_timestamp() CASCADE;
DROP FUNCTION IF EXISTS public.update_assets_timestamp() CASCADE;
DROP FUNCTION IF EXISTS public.update_transactions_timestamp() CASCADE;
DROP FUNCTION IF EXISTS public.update_withdrawal_requests_timestamp() CASCADE;
DROP FUNCTION IF EXISTS public.update_price_alerts_timestamp() CASCADE;
DROP FUNCTION IF EXISTS public.update_api_keys_timestamp() CASCADE;
DROP FUNCTION IF EXISTS public.log_wallet_connection() CASCADE;
DROP FUNCTION IF EXISTS public.log_wallet_disconnection() CASCADE;
DROP FUNCTION IF EXISTS public.log_transaction_creation() CASCADE;
DROP FUNCTION IF EXISTS public.log_withdrawal_request() CASCADE;
DROP FUNCTION IF EXISTS public.log_withdrawal_status_change() CASCADE;
DROP FUNCTION IF EXISTS public.validate_withdrawal_amount() CASCADE;
DROP FUNCTION IF EXISTS public.create_portfolio_snapshot_on_transaction() CASCADE;

-- Step 5: Drop all other functions
DROP FUNCTION IF EXISTS public.calculate_portfolio_value(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_portfolio_24h_change(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_transaction_summary(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.get_portfolio_allocation(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_total_fees_paid(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.update_asset_prices() CASCADE;
DROP FUNCTION IF EXISTS public.check_and_trigger_price_alerts() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_sessions() CASCADE;
DROP FUNCTION IF EXISTS public.lock_accounts_excessive_attempts() CASCADE;
DROP FUNCTION IF EXISTS public.unlock_expired_account_locks() CASCADE;
DROP FUNCTION IF EXISTS public.log_audit_event(UUID, VARCHAR, VARCHAR, UUID, JSONB, JSONB, INET, TEXT, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.log_audit_event(UUID, VARCHAR, VARCHAR, UUID, JSONB, JSONB, INET, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.log_audit_event(UUID, VARCHAR, VARCHAR, UUID, JSONB, JSONB) CASCADE;

-- Step 4: Drop all tables (in reverse dependency order)
DROP TABLE IF EXISTS public.notification_logs CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.price_alerts CASCADE;
DROP TABLE IF EXISTS public.portfolio_snapshots CASCADE;
DROP TABLE IF EXISTS public.withdrawal_requests CASCADE;
DROP TABLE IF EXISTS public.price_history CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.assets CASCADE;
DROP TABLE IF EXISTS public.api_keys CASCADE;
DROP TABLE IF EXISTS public.device_trust CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;
DROP TABLE IF EXISTS public.login_attempts CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Step 5: Revoke grants (cleanup)
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Step 6: Drop extensions (optional - comment out if you want to keep them)
-- DROP EXTENSION IF EXISTS "uuid-ossp";
-- DROP EXTENSION IF EXISTS "pgcrypto";
-- DROP EXTENSION IF EXISTS "citext";

-- ==========================================
-- Database reset complete!
-- ==========================================
-- Now you can run the schema.sql file to deploy the new schema
-- ==========================================
