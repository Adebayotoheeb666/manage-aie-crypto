-- ==========================================
-- CRYPTOVAULT SUPABASE SCHEMA (ENHANCED)
-- ==========================================
-- Production-ready schema with:
-- - Advanced security features (device trust, login attempts)
-- - Comprehensive audit logging
-- - API key management
-- - Notification logs
-- - Fee tracking and analytics
-- - Better constraints and validation
-- - Optimized indexes and performance

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext"; -- Case-insensitive text

-- ==========================================
-- 1. USERS TABLE (ENHANCED)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email CITEXT UNIQUE NOT NULL, -- Case-insensitive email
  username VARCHAR(100) UNIQUE,
  full_name VARCHAR(255),
  profile_picture_url TEXT,
  phone_number VARCHAR(20),
  country VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  two_factor_backup_codes TEXT[], -- Array of backup codes
  preferred_currency VARCHAR(10) DEFAULT 'USD',
  notification_preferences JSONB DEFAULT '{
    "email_on_transaction": true,
    "email_on_withdrawal": true,
    "email_on_price_alert": false,
    "push_notifications": true,
    "marketing_emails": false
  }'::jsonb,
  kyc_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected, expired
  kyc_submitted_at TIMESTAMP WITH TIME ZONE,
  kyc_verified_at TIMESTAMP WITH TIME ZONE,
  kyc_expires_at TIMESTAMP WITH TIME ZONE,
  kyc_document_url TEXT,
  account_status VARCHAR(50) DEFAULT 'active', -- active, suspended, locked, closed
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked_until TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  last_password_change TIMESTAMP WITH TIME ZONE,
  password_reset_token VARCHAR(255),
  password_reset_token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT preferred_currency_length CHECK (LENGTH(preferred_currency) = 3),
  CONSTRAINT account_status_valid CHECK (account_status IN ('active', 'suspended', 'locked', 'closed'))
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_auth_id ON public.users(auth_id);
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_kyc_status ON public.users(kyc_status);
CREATE INDEX idx_users_account_status ON public.users(account_status);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);
CREATE INDEX idx_users_deleted_at ON public.users(deleted_at) WHERE deleted_at IS NULL;

-- ==========================================
-- 2. SESSIONS TABLE (ENHANCED)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_name VARCHAR(255),
  is_trusted BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT session_duration CHECK (expires_at > created_at)
);

CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON public.sessions(expires_at);
CREATE INDEX idx_sessions_is_active ON public.sessions(is_active);
CREATE INDEX idx_sessions_created_at ON public.sessions(created_at DESC);

-- ==========================================
-- 3. DEVICE TRUST TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.device_trust (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  device_type VARCHAR(50), -- mobile, desktop, tablet
  browser VARCHAR(100),
  os VARCHAR(100),
  ip_address INET,
  is_trusted BOOLEAN DEFAULT FALSE,
  trust_token VARCHAR(255),
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, device_id)
);

CREATE INDEX idx_device_trust_user_id ON public.device_trust(user_id);
CREATE INDEX idx_device_trust_is_trusted ON public.device_trust(is_trusted);

-- ==========================================
-- 4. LOGIN ATTEMPTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT FALSE,
  failure_reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT email_or_user_id CHECK (user_id IS NOT NULL OR email IS NOT NULL)
);

CREATE INDEX idx_login_attempts_user_id ON public.login_attempts(user_id);
CREATE INDEX idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX idx_login_attempts_ip_address ON public.login_attempts(ip_address);
CREATE INDEX idx_login_attempts_created_at ON public.login_attempts(created_at DESC);

-- ==========================================
-- 5. API KEYS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  last_four VARCHAR(4),
  permissions TEXT[] DEFAULT '{"read:portfolio", "read:transactions"}',
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT api_key_name_length CHECK (LENGTH(name) > 0 AND LENGTH(name) <= 255)
);

CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_is_active ON public.api_keys(is_active);

-- ==========================================
-- 6. WALLETS TABLE (ENHANCED)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(255) NOT NULL,
  wallet_type VARCHAR(50) NOT NULL, -- coinbase, metamask, ledger, trezor, walletconnect
  label VARCHAR(100),
  is_primary BOOLEAN DEFAULT FALSE,
  balance_usd DECIMAL(20, 2) DEFAULT 0,
  balance_btc DECIMAL(20, 8) DEFAULT 0,
  total_fees_paid_usd DECIMAL(20, 2) DEFAULT 0,
  total_fees_paid_native DECIMAL(20, 8) DEFAULT 0,
  verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, failed
  verification_hash VARCHAR(255),
  last_verified_at TIMESTAMP WITH TIME ZONE,
  last_synced TIMESTAMP WITH TIME ZONE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  disconnected_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, wallet_address),
  CONSTRAINT wallet_type_valid CHECK (wallet_type IN ('coinbase', 'metamask', 'ledger', 'trezor', 'walletconnect')),
  CONSTRAINT balance_positive CHECK (balance_usd >= 0),
  CONSTRAINT verification_status_valid CHECK (verification_status IN ('pending', 'verified', 'failed'))
);

CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_wallets_address ON public.wallets(wallet_address);
CREATE INDEX idx_wallets_is_primary ON public.wallets(user_id, is_primary);
CREATE INDEX idx_wallets_is_active ON public.wallets(is_active);
CREATE INDEX idx_wallets_verification_status ON public.wallets(verification_status);

-- ==========================================
-- 7. ASSETS TABLE (ENHANCED)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL, -- BTC, ETH, USDC, ADA
  name VARCHAR(100) NOT NULL,
  balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
  balance_usd DECIMAL(20, 2) DEFAULT 0,
  price_usd DECIMAL(20, 2),
  price_change_24h DECIMAL(10, 2),
  price_change_7d DECIMAL(10, 2),
  price_change_30d DECIMAL(10, 2),
  chain VARCHAR(50), -- ethereum, bitcoin, cardano, polygon
  contract_address VARCHAR(255),
  decimals INTEGER,
  logo_url TEXT,
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, wallet_id, symbol),
  CONSTRAINT balance_positive CHECK (balance >= 0),
  CONSTRAINT balance_usd_positive CHECK (balance_usd >= 0),
  CONSTRAINT price_positive CHECK (price_usd IS NULL OR price_usd > 0)
);

CREATE INDEX idx_assets_user_id ON public.assets(user_id);
CREATE INDEX idx_assets_wallet_id ON public.assets(wallet_id);
CREATE INDEX idx_assets_symbol ON public.assets(symbol);
CREATE INDEX idx_assets_balance_usd ON public.assets(balance_usd DESC);
CREATE INDEX idx_assets_last_synced ON public.assets(last_synced);

-- ==========================================
-- 8. TRANSACTIONS TABLE (ENHANCED)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  tx_hash VARCHAR(255) UNIQUE,
  tx_type VARCHAR(50) NOT NULL, -- send, receive, swap, stake, unstake, bridge
  symbol VARCHAR(20) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  amount_usd DECIMAL(20, 2),
  from_address VARCHAR(255),
  to_address VARCHAR(255),
  fee_amount DECIMAL(20, 8) DEFAULT 0,
  fee_usd DECIMAL(20, 2) DEFAULT 0,
  fee_token VARCHAR(20),
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, failed, cancelled, dropped
  confirmation_count INTEGER DEFAULT 0,
  required_confirmations INTEGER DEFAULT 12,
  gas_price DECIMAL(20, 8),
  gas_used DECIMAL(20, 8),
  gas_limit DECIMAL(20, 8),
  nonce INTEGER,
  block_number BIGINT,
  block_timestamp TIMESTAMP WITH TIME ZONE,
  network VARCHAR(50), -- mainnet, testnet, polygon, arbitrum
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT tx_type_valid CHECK (tx_type IN ('send', 'receive', 'swap', 'stake', 'unstake', 'bridge')),
  CONSTRAINT status_valid CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled', 'dropped')),
  CONSTRAINT amount_positive CHECK (amount > 0),
  CONSTRAINT fee_positive CHECK (fee_amount >= 0)
);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX idx_transactions_tx_hash ON public.transactions(tx_hash);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_type ON public.transactions(tx_type);
CREATE INDEX idx_transactions_symbol ON public.transactions(symbol);
CREATE INDEX idx_transactions_block_timestamp ON public.transactions(block_timestamp DESC);

-- ==========================================
-- 9. PRICE HISTORY TABLE (ENHANCED)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol VARCHAR(20) NOT NULL,
  price_usd DECIMAL(20, 2) NOT NULL,
  price_change_24h DECIMAL(10, 2),
  price_change_7d DECIMAL(10, 2),
  price_change_30d DECIMAL(10, 2),
  market_cap DECIMAL(30, 2),
  market_cap_rank INTEGER,
  volume_24h DECIMAL(30, 2),
  circulating_supply DECIMAL(30, 8),
  total_supply DECIMAL(30, 8),
  max_supply DECIMAL(30, 8),
  ath DECIMAL(20, 2), -- All-time high
  atl DECIMAL(20, 2), -- All-time low
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source VARCHAR(50) DEFAULT 'coingecko', -- coingecko, binance, coinbase
  
  CONSTRAINT price_positive CHECK (price_usd > 0),
  CONSTRAINT volume_positive CHECK (volume_24h IS NULL OR volume_24h >= 0)
);

CREATE INDEX idx_price_history_symbol ON public.price_history(symbol);
CREATE INDEX idx_price_history_timestamp ON public.price_history(timestamp DESC);
CREATE INDEX idx_price_history_symbol_timestamp ON public.price_history(symbol, timestamp DESC);

-- ==========================================
-- 10. WITHDRAWAL REQUESTS TABLE (ENHANCED)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  amount_usd DECIMAL(20, 2),
  destination_address VARCHAR(255) NOT NULL,
  network VARCHAR(50) NOT NULL,
  fee_amount DECIMAL(20, 8) DEFAULT 0,
  fee_usd DECIMAL(20, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, review, processing, completed, failed, cancelled
  tx_hash VARCHAR(255),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  email_verification_token VARCHAR(255),
  email_verified_at TIMESTAMP WITH TIME ZONE,
  two_factor_verified_at TIMESTAMP WITH TIME ZONE,
  estimated_completion_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT amount_positive CHECK (amount > 0),
  CONSTRAINT fee_positive CHECK (fee_amount >= 0),
  CONSTRAINT status_valid CHECK (status IN ('pending', 'review', 'processing', 'completed', 'failed', 'cancelled'))
);

CREATE INDEX idx_withdrawals_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX idx_withdrawals_status ON public.withdrawal_requests(status);
CREATE INDEX idx_withdrawals_created_at ON public.withdrawal_requests(created_at DESC);
CREATE INDEX idx_withdrawals_tx_hash ON public.withdrawal_requests(tx_hash);
CREATE INDEX idx_withdrawals_wallet_id ON public.withdrawal_requests(wallet_id);

-- ==========================================
-- 11. PORTFOLIO SNAPSHOTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total_value_usd DECIMAL(20, 2),
  total_value_btc DECIMAL(20, 8),
  total_value_eth DECIMAL(20, 8),
  assets_count INTEGER,
  wallets_count INTEGER,
  allocation_data JSONB,
  snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT value_positive CHECK (total_value_usd >= 0)
);

CREATE INDEX idx_portfolio_snapshots_user_id ON public.portfolio_snapshots(user_id);
CREATE INDEX idx_portfolio_snapshots_date ON public.portfolio_snapshots(snapshot_date DESC);
CREATE INDEX idx_portfolio_snapshots_user_date ON public.portfolio_snapshots(user_id, snapshot_date DESC);

-- ==========================================
-- 12. PRICE ALERTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  alert_type VARCHAR(50) NOT NULL, -- above, below, change_percent
  target_price DECIMAL(20, 2),
  change_percent DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  triggered BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMP WITH TIME ZONE,
  triggered_price DECIMAL(20, 2),
  notification_sent BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT alert_type_valid CHECK (alert_type IN ('above', 'below', 'change_percent')),
  CONSTRAINT target_price_or_percent CHECK (
    (alert_type IN ('above', 'below') AND target_price IS NOT NULL) OR
    (alert_type = 'change_percent' AND change_percent IS NOT NULL)
  )
);

CREATE INDEX idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX idx_price_alerts_symbol ON public.price_alerts(symbol);
CREATE INDEX idx_price_alerts_is_active ON public.price_alerts(is_active);
CREATE INDEX idx_price_alerts_triggered ON public.price_alerts(triggered);

-- ==========================================
-- 13. NOTIFICATION LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- transaction, withdrawal, price_alert, security
  subject TEXT,
  message TEXT,
  channel VARCHAR(50) DEFAULT 'email', -- email, push, sms, in_app
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, bounced
  recipient VARCHAR(255),
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notification_logs(user_id);
CREATE INDEX idx_notifications_type ON public.notification_logs(notification_type);
CREATE INDEX idx_notifications_status ON public.notification_logs(status);
CREATE INDEX idx_notifications_created_at ON public.notification_logs(created_at DESC);

-- ==========================================
-- 14. AUDIT LOG TABLE (ENHANCED)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(50) DEFAULT 'success', -- success, failure, attempt
  error_message TEXT,
  severity VARCHAR(50) DEFAULT 'info', -- info, warning, critical
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_severity ON public.audit_logs(severity);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- ==========================================
-- 15. FUNCTIONS (ENHANCED)
-- ==========================================

-- Function: Calculate portfolio total value
CREATE OR REPLACE FUNCTION calculate_portfolio_value(p_user_id UUID)
RETURNS TABLE(total_usd DECIMAL, total_btc DECIMAL, total_eth DECIMAL, updated_at TIMESTAMP) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(a.balance_usd), 0::DECIMAL) as total_usd,
    COALESCE(SUM(CASE WHEN a.symbol = 'BTC' THEN a.balance ELSE 0 END), 0::DECIMAL) as total_btc,
    COALESCE(SUM(CASE WHEN a.symbol = 'ETH' THEN a.balance ELSE 0 END), 0::DECIMAL) as total_eth,
    MAX(a.updated_at) as updated_at
  FROM public.assets a
  WHERE a.user_id = p_user_id AND a.balance > 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get 24h change for user
CREATE OR REPLACE FUNCTION get_portfolio_24h_change(p_user_id UUID)
RETURNS TABLE(change_percentage DECIMAL, change_usd DECIMAL, previous_value DECIMAL) AS $$
DECLARE
  v_current_value DECIMAL;
  v_previous_value DECIMAL;
BEGIN
  SELECT total_usd INTO v_current_value FROM calculate_portfolio_value(p_user_id);
  
  SELECT COALESCE(total_value_usd, 0)::DECIMAL
  INTO v_previous_value
  FROM public.portfolio_snapshots
  WHERE user_id = p_user_id
  AND snapshot_date >= NOW() - INTERVAL '1 day 1 hour'
  AND snapshot_date < NOW() - INTERVAL '23 hours'
  ORDER BY snapshot_date DESC
  LIMIT 1;

  RETURN QUERY SELECT
    CASE 
      WHEN COALESCE(v_previous_value, 0) > 0 THEN ((v_current_value - v_previous_value) / v_previous_value * 100)::DECIMAL
      ELSE 0::DECIMAL
    END as change_percentage,
    (v_current_value - COALESCE(v_previous_value, v_current_value))::DECIMAL as change_usd,
    COALESCE(v_previous_value, 0)::DECIMAL as previous_value;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get transaction summary
CREATE OR REPLACE FUNCTION get_transaction_summary(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE(tx_type VARCHAR, count BIGINT, total_amount DECIMAL, total_usd DECIMAL, total_fees DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.tx_type,
    COUNT(*)::BIGINT,
    SUM(t.amount)::DECIMAL,
    SUM(t.amount_usd)::DECIMAL,
    SUM(t.fee_usd)::DECIMAL
  FROM public.transactions t
  WHERE t.user_id = p_user_id
  AND t.created_at >= NOW() - MAKE_INTERVAL(days := p_days)
  AND t.status IN ('confirmed', 'pending')
  GROUP BY t.tx_type;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get user portfolio allocation
CREATE OR REPLACE FUNCTION get_portfolio_allocation(p_user_id UUID)
RETURNS TABLE(symbol VARCHAR, name VARCHAR, balance DECIMAL, balance_usd DECIMAL, price_usd DECIMAL, percentage DECIMAL, chain VARCHAR) AS $$
DECLARE
  v_total_usd DECIMAL;
BEGIN
  SELECT total_usd INTO v_total_usd FROM calculate_portfolio_value(p_user_id);
  
  RETURN QUERY
  SELECT
    a.symbol,
    a.name,
    a.balance,
    a.balance_usd,
    a.price_usd,
    CASE
      WHEN v_total_usd > 0 THEN (a.balance_usd / v_total_usd * 100)::DECIMAL
      ELSE 0::DECIMAL
    END as percentage,
    a.chain
  FROM public.assets a
  WHERE a.user_id = p_user_id AND a.balance > 0
  ORDER BY a.balance_usd DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get total fees paid
CREATE OR REPLACE FUNCTION get_total_fees_paid(p_user_id UUID, p_days INTEGER DEFAULT NULL)
RETURNS TABLE(total_fees_usd DECIMAL, total_fees_native DECIMAL, transaction_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(t.fee_usd)::DECIMAL,
    SUM(t.fee_amount)::DECIMAL,
    COUNT(*)::BIGINT
  FROM public.transactions t
  WHERE t.user_id = p_user_id
  AND t.status IN ('confirmed', 'pending')
  AND (p_days IS NULL OR t.created_at >= NOW() - MAKE_INTERVAL(days := p_days));
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Update asset prices from price history
CREATE OR REPLACE FUNCTION update_asset_prices()
RETURNS TABLE(updated_count INTEGER) AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  WITH latest_prices AS (
    SELECT DISTINCT ON (symbol) 
      symbol,
      price_usd,
      price_change_24h,
      price_change_7d,
      price_change_30d
    FROM public.price_history
    ORDER BY symbol, timestamp DESC
  )
  UPDATE public.assets a
  SET 
    price_usd = lp.price_usd,
    price_change_24h = lp.price_change_24h,
    price_change_7d = lp.price_change_7d,
    price_change_30d = lp.price_change_30d,
    balance_usd = a.balance * lp.price_usd,
    last_synced = NOW(),
    updated_at = NOW()
  FROM latest_prices lp
  WHERE a.symbol = lp.symbol AND (a.price_usd IS NULL OR a.price_usd != lp.price_usd);
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Check and trigger price alerts
CREATE OR REPLACE FUNCTION check_and_trigger_price_alerts()
RETURNS TABLE(triggered_count INTEGER) AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Update alerts where target price is reached
  UPDATE public.price_alerts pa
  SET 
    triggered = TRUE,
    triggered_at = NOW(),
    triggered_price = (
      SELECT price_usd FROM public.price_history
      WHERE symbol = pa.symbol
      ORDER BY timestamp DESC
      LIMIT 1
    ),
    is_active = FALSE
  WHERE pa.is_active = TRUE
  AND (
    (pa.alert_type = 'above' AND (
      SELECT price_usd FROM public.price_history
      WHERE symbol = pa.symbol
      ORDER BY timestamp DESC
      LIMIT 1
    ) >= pa.target_price)
    OR
    (pa.alert_type = 'below' AND (
      SELECT price_usd FROM public.price_history
      WHERE symbol = pa.symbol
      ORDER BY timestamp DESC
      LIMIT 1
    ) <= pa.target_price)
  );
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  DELETE FROM public.sessions
  WHERE expires_at < NOW() OR (is_active = FALSE AND created_at < NOW() - INTERVAL '30 days');
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Lock accounts with too many failed attempts
CREATE OR REPLACE FUNCTION lock_accounts_excessive_attempts()
RETURNS TABLE(locked_count INTEGER) AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  UPDATE public.users u
  SET 
    account_status = 'locked',
    account_locked_until = NOW() + INTERVAL '30 minutes',
    updated_at = NOW()
  WHERE u.failed_login_attempts >= 5
  AND u.account_status != 'locked';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Unlock accounts
CREATE OR REPLACE FUNCTION unlock_expired_account_locks()
RETURNS TABLE(unlocked_count INTEGER) AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  UPDATE public.users u
  SET 
    account_status = 'active',
    account_locked_until = NULL,
    failed_login_attempts = 0,
    updated_at = NOW()
  WHERE u.account_status = 'locked'
  AND u.account_locked_until IS NOT NULL
  AND u.account_locked_until < NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Log audit event
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_action VARCHAR,
  p_entity_type VARCHAR DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_severity VARCHAR DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    ip_address,
    user_agent,
    severity
  ) VALUES (
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_ip_address,
    p_user_agent,
    p_severity
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 16. TRIGGERS (ENHANCED)
-- ==========================================

-- Trigger: Update users.updated_at
CREATE OR REPLACE FUNCTION update_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_update_timestamp ON public.users;
CREATE TRIGGER users_update_timestamp
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_users_timestamp();

-- Trigger: Update wallets.updated_at
CREATE OR REPLACE FUNCTION update_wallets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wallets_update_timestamp ON public.wallets;
CREATE TRIGGER wallets_update_timestamp
BEFORE UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION update_wallets_timestamp();

-- Trigger: Update assets.updated_at
CREATE OR REPLACE FUNCTION update_assets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assets_update_timestamp ON public.assets;
CREATE TRIGGER assets_update_timestamp
BEFORE UPDATE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION update_assets_timestamp();

-- Trigger: Update transactions.updated_at
CREATE OR REPLACE FUNCTION update_transactions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transactions_update_timestamp ON public.transactions;
CREATE TRIGGER transactions_update_timestamp
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION update_transactions_timestamp();

-- Trigger: Update withdrawal_requests.updated_at
CREATE OR REPLACE FUNCTION update_withdrawal_requests_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS withdrawal_requests_update_timestamp ON public.withdrawal_requests;
CREATE TRIGGER withdrawal_requests_update_timestamp
BEFORE UPDATE ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION update_withdrawal_requests_timestamp();

-- Trigger: Update price_alerts.updated_at
CREATE OR REPLACE FUNCTION update_price_alerts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS price_alerts_update_timestamp ON public.price_alerts;
CREATE TRIGGER price_alerts_update_timestamp
BEFORE UPDATE ON public.price_alerts
FOR EACH ROW
EXECUTE FUNCTION update_price_alerts_timestamp();

-- Trigger: Update api_keys.updated_at
CREATE OR REPLACE FUNCTION update_api_keys_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS api_keys_update_timestamp ON public.api_keys;
CREATE TRIGGER api_keys_update_timestamp
BEFORE UPDATE ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION update_api_keys_timestamp();

-- Trigger: Log wallet connection
CREATE OR REPLACE FUNCTION log_wallet_connection()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_audit_event(
    NEW.user_id,
    'WALLET_CONNECTED',
    'wallets',
    NEW.id,
    NULL,
    jsonb_build_object(
      'wallet_address', NEW.wallet_address,
      'wallet_type', NEW.wallet_type,
      'label', NEW.label
    ),
    NULL,
    NULL,
    'info'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wallets_log_connection ON public.wallets;
CREATE TRIGGER wallets_log_connection
AFTER INSERT ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION log_wallet_connection();

-- Trigger: Log wallet disconnection
CREATE OR REPLACE FUNCTION log_wallet_disconnection()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
    PERFORM log_audit_event(
      NEW.user_id,
      'WALLET_DISCONNECTED',
      'wallets',
      NEW.id,
      jsonb_build_object('is_active', OLD.is_active),
      jsonb_build_object('is_active', NEW.is_active),
      NULL,
      NULL,
      'info'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wallets_log_disconnection ON public.wallets;
CREATE TRIGGER wallets_log_disconnection
AFTER UPDATE ON public.wallets
FOR EACH ROW
EXECUTE FUNCTION log_wallet_disconnection();

-- Trigger: Log transaction creation
CREATE OR REPLACE FUNCTION log_transaction_creation()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_audit_event(
    NEW.user_id,
    'TRANSACTION_CREATED',
    'transactions',
    NEW.id,
    NULL,
    jsonb_build_object(
      'tx_type', NEW.tx_type,
      'symbol', NEW.symbol,
      'amount', NEW.amount,
      'amount_usd', NEW.amount_usd,
      'fee_usd', NEW.fee_usd
    ),
    NULL,
    NULL,
    'info'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transactions_log_creation ON public.transactions;
CREATE TRIGGER transactions_log_creation
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION log_transaction_creation();

-- Trigger: Log withdrawal request creation
CREATE OR REPLACE FUNCTION log_withdrawal_request()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_audit_event(
    NEW.user_id,
    'WITHDRAWAL_REQUESTED',
    'withdrawal_requests',
    NEW.id,
    NULL,
    jsonb_build_object(
      'symbol', NEW.symbol,
      'amount', NEW.amount,
      'destination_address', NEW.destination_address,
      'network', NEW.network,
      'fee_usd', NEW.fee_usd
    ),
    NULL,
    NULL,
    'info'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS withdrawal_requests_log_creation ON public.withdrawal_requests;
CREATE TRIGGER withdrawal_requests_log_creation
AFTER INSERT ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION log_withdrawal_request();

-- Trigger: Log withdrawal status changes
CREATE OR REPLACE FUNCTION log_withdrawal_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_severity VARCHAR := 'info';
BEGIN
  IF OLD.status != NEW.status THEN
    -- Set severity based on status
    IF NEW.status = 'failed' OR NEW.status = 'cancelled' THEN
      v_severity := 'warning';
    END IF;
    
    PERFORM log_audit_event(
      NEW.user_id,
      'WITHDRAWAL_STATUS_UPDATED',
      'withdrawal_requests',
      NEW.id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status, 'tx_hash', NEW.tx_hash),
      NULL,
      NULL,
      v_severity
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS withdrawal_requests_log_status ON public.withdrawal_requests;
CREATE TRIGGER withdrawal_requests_log_status
AFTER UPDATE ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION log_withdrawal_status_change();

-- Trigger: Validate withdrawal amount
CREATE OR REPLACE FUNCTION validate_withdrawal_amount()
RETURNS TRIGGER AS $$
DECLARE
  v_available_balance DECIMAL;
BEGIN
  SELECT balance INTO v_available_balance
  FROM public.assets
  WHERE user_id = NEW.user_id
  AND symbol = NEW.symbol
  AND wallet_id = NEW.wallet_id;
  
  IF COALESCE(v_available_balance, 0) < NEW.amount THEN
    RAISE EXCEPTION 'Insufficient balance for withdrawal. Available: %, Requested: %', 
      COALESCE(v_available_balance, 0), NEW.amount;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS withdrawal_requests_validate ON public.withdrawal_requests;
CREATE TRIGGER withdrawal_requests_validate
BEFORE INSERT ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION validate_withdrawal_amount();

-- Trigger: Create portfolio snapshot on transaction
CREATE OR REPLACE FUNCTION create_portfolio_snapshot_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_total_usd DECIMAL;
  v_total_btc DECIMAL;
  v_total_eth DECIMAL;
  v_assets_count INTEGER;
  v_wallets_count INTEGER;
BEGIN
  SELECT total_usd, total_btc, total_eth 
  INTO v_total_usd, v_total_btc, v_total_eth
  FROM calculate_portfolio_value(NEW.user_id);
  
  SELECT COUNT(DISTINCT symbol) INTO v_assets_count
  FROM public.assets
  WHERE user_id = NEW.user_id AND balance > 0;
  
  SELECT COUNT(DISTINCT id) INTO v_wallets_count
  FROM public.wallets
  WHERE user_id = NEW.user_id AND is_active = TRUE;
  
  INSERT INTO public.portfolio_snapshots (
    user_id,
    total_value_usd,
    total_value_btc,
    total_value_eth,
    assets_count,
    wallets_count
  )
  VALUES (
    NEW.user_id,
    v_total_usd,
    v_total_btc,
    v_total_eth,
    v_assets_count,
    v_wallets_count
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transactions_create_snapshot ON public.transactions;
CREATE TRIGGER transactions_create_snapshot
AFTER INSERT ON public.transactions
FOR EACH ROW
WHEN (NEW.status = 'confirmed')
EXECUTE FUNCTION create_portfolio_snapshot_on_transaction();

-- ==========================================
-- 17. ROW LEVEL SECURITY POLICIES
-- ==========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_trust ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = auth_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id) WITH CHECK (auth.uid() = auth_id);

-- Policies for sessions table
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.sessions;
CREATE POLICY "Users can view their own sessions" ON public.sessions
  FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Policies for device_trust table
DROP POLICY IF EXISTS "Users can manage their own devices" ON public.device_trust;
CREATE POLICY "Users can manage their own devices" ON public.device_trust
  FOR ALL USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Policies for api_keys table
DROP POLICY IF EXISTS "Users can manage their own API keys" ON public.api_keys;
CREATE POLICY "Users can manage their own API keys" ON public.api_keys
  FOR ALL USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Policies for wallets table
DROP POLICY IF EXISTS "Users can view their own wallets" ON public.wallets;
CREATE POLICY "Users can view their own wallets" ON public.wallets
  FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own wallets" ON public.wallets;
CREATE POLICY "Users can manage their own wallets" ON public.wallets
  FOR ALL USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Policies for assets table
DROP POLICY IF EXISTS "Users can view their own assets" ON public.assets;
CREATE POLICY "Users can view their own assets" ON public.assets
  FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own assets" ON public.assets;
CREATE POLICY "Users can manage their own assets" ON public.assets
  FOR ALL USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Policies for transactions table
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Policies for withdrawal requests table
DROP POLICY IF EXISTS "Users can view their own withdrawals" ON public.withdrawal_requests;
CREATE POLICY "Users can view their own withdrawals" ON public.withdrawal_requests
  FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Users can create withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Policies for price alerts table
DROP POLICY IF EXISTS "Users can manage their own price alerts" ON public.price_alerts;
CREATE POLICY "Users can manage their own price alerts" ON public.price_alerts
  FOR ALL USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Policies for portfolio snapshots table
DROP POLICY IF EXISTS "Users can view their own snapshots" ON public.portfolio_snapshots;
CREATE POLICY "Users can view their own snapshots" ON public.portfolio_snapshots
  FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Policies for notification logs table
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notification_logs;
CREATE POLICY "Users can view their own notifications" ON public.notification_logs
  FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Policies for audit logs table
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- ==========================================
-- 18. GRANTS
-- ==========================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION calculate_portfolio_value(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_portfolio_24h_change(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_transaction_summary(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_portfolio_allocation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_total_fees_paid(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_asset_prices() TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_trigger_price_alerts() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION lock_accounts_excessive_attempts() TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_expired_account_locks() TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event(UUID, VARCHAR, VARCHAR, UUID, JSONB, JSONB, INET, TEXT, VARCHAR) TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_trust TO authenticated;
GRANT SELECT, INSERT ON public.login_attempts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.withdrawal_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.price_alerts TO authenticated;
GRANT SELECT ON public.price_history TO authenticated;
GRANT SELECT ON public.portfolio_snapshots TO authenticated;
GRANT SELECT, INSERT ON public.notification_logs TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

-- ==========================================
-- 19. COMMENTS (Documentation)
-- ==========================================

COMMENT ON TABLE public.users IS 'User accounts with authentication and profile information';
COMMENT ON TABLE public.sessions IS 'Active user sessions with security metadata';
COMMENT ON TABLE public.device_trust IS 'Trusted devices for enhanced security';
COMMENT ON TABLE public.login_attempts IS 'Login attempt history for security monitoring';
COMMENT ON TABLE public.api_keys IS 'API keys for programmatic access';
COMMENT ON TABLE public.wallets IS 'Connected cryptocurrency wallets';
COMMENT ON TABLE public.assets IS 'Cryptocurrency holdings in wallets';
COMMENT ON TABLE public.transactions IS 'Transaction history with fees and status';
COMMENT ON TABLE public.price_history IS 'Historical price data for charting';
COMMENT ON TABLE public.withdrawal_requests IS 'Withdrawal requests with verification';
COMMENT ON TABLE public.portfolio_snapshots IS 'Daily portfolio value snapshots';
COMMENT ON TABLE public.price_alerts IS 'User-created price alerts';
COMMENT ON TABLE public.notification_logs IS 'Notification delivery history';
COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit trail';

COMMENT ON FUNCTION calculate_portfolio_value(UUID) IS 'Calculate total portfolio value in USD, BTC, and ETH';
COMMENT ON FUNCTION get_portfolio_24h_change(UUID) IS 'Get 24-hour portfolio change in percentage and USD';
COMMENT ON FUNCTION get_transaction_summary(UUID, INTEGER) IS 'Get transaction summary by type for given period';
COMMENT ON FUNCTION get_portfolio_allocation(UUID) IS 'Get portfolio allocation breakdown by asset';
COMMENT ON FUNCTION get_total_fees_paid(UUID, INTEGER) IS 'Calculate total fees paid in given period';
