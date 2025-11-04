-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- TABLES
-- ==========================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100),
  full_name VARCHAR(255),
  profile_picture_url TEXT,
  phone_number VARCHAR(20),
  country VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  preferred_currency VARCHAR(10) DEFAULT 'USD',
  notification_preferences JSONB DEFAULT '{}',
  kyc_status VARCHAR(50) DEFAULT 'pending',
  kyc_submitted_at TIMESTAMP,
  kyc_verified_at TIMESTAMP,
  account_status VARCHAR(50) DEFAULT 'active',
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_account_status ON users(account_status);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(255) NOT NULL,
  wallet_type VARCHAR(50),
  label VARCHAR(100),
  is_primary BOOLEAN DEFAULT FALSE,
  balance_usd DECIMAL(20,2) DEFAULT 0,
  balance_btc DECIMAL(20,8) DEFAULT 0,
  last_synced TIMESTAMP,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  disconnected_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, wallet_address)
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_is_primary ON wallets(is_primary);
CREATE INDEX idx_wallets_is_active ON wallets(is_active);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  balance DECIMAL(20,8) NOT NULL DEFAULT 0,
  balance_usd DECIMAL(20,2) NOT NULL DEFAULT 0,
  price_usd DECIMAL(20,2) DEFAULT 0,
  price_change_24h DECIMAL(10,2) DEFAULT 0,
  price_change_7d DECIMAL(10,2) DEFAULT 0,
  price_change_30d DECIMAL(10,2) DEFAULT 0,
  market_cap DECIMAL(20,2),
  volume_24h DECIMAL(20,2),
  circulating_supply DECIMAL(20,8),
  last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_wallet_id ON assets(wallet_id);
CREATE INDEX idx_assets_symbol ON assets(symbol);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  tx_type VARCHAR(50) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  amount_usd DECIMAL(20,2),
  tx_hash VARCHAR(255),
  from_address VARCHAR(255),
  to_address VARCHAR(255),
  fee_amount DECIMAL(20,8),
  fee_usd DECIMAL(20,2),
  status VARCHAR(50) DEFAULT 'pending',
  confirmation_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Price history table
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol VARCHAR(20) NOT NULL,
  price_usd DECIMAL(20,2) NOT NULL,
  price_change_24h DECIMAL(10,2),
  market_cap DECIMAL(20,2),
  volume_24h DECIMAL(20,2),
  circulating_supply DECIMAL(20,8),
  source VARCHAR(50) DEFAULT 'coingecko',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_price_history_symbol ON price_history(symbol);
CREATE INDEX idx_price_history_timestamp ON price_history(timestamp DESC);

-- Withdrawal requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
  symbol VARCHAR(20) NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  amount_usd DECIMAL(20,2),
  destination_address VARCHAR(255) NOT NULL,
  network VARCHAR(50),
  fee_amount DECIMAL(20,8),
  fee_usd DECIMAL(20,2),
  status VARCHAR(50) DEFAULT 'pending',
  tx_hash VARCHAR(255),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  two_factor_verified_at TIMESTAMP,
  estimated_completion_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);

-- Portfolio snapshots table
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_value_usd DECIMAL(20,2) NOT NULL,
  total_value_btc DECIMAL(20,8),
  total_value_eth DECIMAL(20,8),
  assets_count INTEGER,
  allocation_data JSONB,
  snapshot_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_portfolio_snapshots_user_id ON portfolio_snapshots(user_id);
CREATE INDEX idx_portfolio_snapshots_snapshot_date ON portfolio_snapshots(snapshot_date DESC);

-- Price alerts table
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  target_price DECIMAL(20,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  triggered BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMP,
  triggered_price DECIMAL(20,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_is_active ON price_alerts(is_active);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Contact messages table
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contact_messages_email ON contact_messages(email);
CREATE INDEX idx_contact_messages_status ON contact_messages(status);

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Calculate portfolio value function
CREATE OR REPLACE FUNCTION calculate_portfolio_value(p_user_id UUID)
RETURNS TABLE(total_usd DECIMAL, total_btc DECIMAL, total_eth DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(balance_usd), 0::DECIMAL)::DECIMAL as total_usd,
    COALESCE(SUM(balance_usd) / NULLIF(
      (SELECT price_usd FROM price_history WHERE symbol = 'BTC' ORDER BY timestamp DESC LIMIT 1), 0
    ), 0::DECIMAL)::DECIMAL as total_btc,
    COALESCE(SUM(balance_usd) / NULLIF(
      (SELECT price_usd FROM price_history WHERE symbol = 'ETH' ORDER BY timestamp DESC LIMIT 1), 0
    ), 0::DECIMAL)::DECIMAL as total_eth
  FROM assets
  WHERE user_id = p_user_id AND balance > 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get 24h portfolio change function
CREATE OR REPLACE FUNCTION get_portfolio_24h_change(p_user_id UUID)
RETURNS TABLE(change_usd DECIMAL, change_percentage DECIMAL) AS $$
DECLARE
  v_current_value DECIMAL;
  v_previous_value DECIMAL;
BEGIN
  -- Get current value
  SELECT (calculate_portfolio_value(p_user_id)).total_usd INTO v_current_value;

  -- Get value from 24 hours ago (from snapshots or estimate)
  SELECT total_value_usd INTO v_previous_value
  FROM portfolio_snapshots
  WHERE user_id = p_user_id
    AND snapshot_date >= NOW() - INTERVAL '25 hours'
    AND snapshot_date < NOW() - INTERVAL '23 hours'
  ORDER BY snapshot_date DESC
  LIMIT 1;

  v_previous_value := COALESCE(v_previous_value, v_current_value);

  RETURN QUERY
  SELECT
    (v_current_value - v_previous_value)::DECIMAL as change_usd,
    CASE
      WHEN v_previous_value = 0 THEN 0::DECIMAL
      ELSE ((v_current_value - v_previous_value) / v_previous_value * 100)::DECIMAL
    END as change_percentage;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get portfolio allocation function
CREATE OR REPLACE FUNCTION get_portfolio_allocation(p_user_id UUID)
RETURNS TABLE(symbol VARCHAR, balance DECIMAL, balance_usd DECIMAL, percentage DECIMAL) AS $$
BEGIN
  RETURN QUERY
  WITH portfolio_total AS (
    SELECT COALESCE(SUM(balance_usd), 0) as total FROM assets WHERE user_id = p_user_id AND balance > 0
  )
  SELECT
    a.symbol,
    a.balance,
    a.balance_usd,
    CASE
      WHEN pt.total = 0 THEN 0::DECIMAL
      ELSE (a.balance_usd / pt.total * 100)::DECIMAL
    END as percentage
  FROM assets a, portfolio_total pt
  WHERE a.user_id = p_user_id AND a.balance > 0
  ORDER BY a.balance_usd DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get transaction summary function
CREATE OR REPLACE FUNCTION get_transaction_summary(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE(tx_type VARCHAR, count BIGINT, total_amount DECIMAL, total_usd DECIMAL) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.tx_type,
    COUNT(*)::BIGINT,
    SUM(t.amount)::DECIMAL,
    SUM(t.amount_usd)::DECIMAL
  FROM transactions t
  WHERE t.user_id = p_user_id
    AND t.created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY t.tx_type;
END;
$$ LANGUAGE plpgsql STABLE;

-- Update asset prices function
CREATE OR REPLACE FUNCTION update_asset_prices()
RETURNS TABLE(updated_count INTEGER) AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  UPDATE assets a
  SET
    price_usd = ph.price_usd,
    price_change_24h = ph.price_change_24h,
    balance_usd = a.balance * ph.price_usd,
    last_synced = CURRENT_TIMESTAMP
  FROM (
    SELECT DISTINCT ON (symbol) symbol, price_usd, price_change_24h
    FROM price_history
    ORDER BY symbol, timestamp DESC
  ) ph
  WHERE a.symbol = ph.symbol AND a.balance > 0;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- Check and trigger price alerts function
CREATE OR REPLACE FUNCTION check_and_trigger_price_alerts()
RETURNS TABLE(triggered_count INTEGER) AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  UPDATE price_alerts pa
  SET
    triggered = TRUE,
    triggered_at = CURRENT_TIMESTAMP,
    triggered_price = ph.price_usd,
    is_active = FALSE
  FROM price_history ph
  WHERE pa.symbol = ph.symbol
    AND pa.is_active = TRUE
    AND pa.triggered = FALSE
    AND (
      (pa.alert_type = 'above' AND ph.price_usd >= pa.target_price)
      OR (pa.alert_type = 'below' AND ph.price_usd <= pa.target_price)
    )
    AND ph.timestamp = (
      SELECT MAX(timestamp) FROM price_history WHERE symbol = pa.symbol
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- Cleanup expired sessions function
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS TABLE(deleted_count INTEGER) AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  DELETE FROM sessions
  WHERE expires_at < CURRENT_TIMESTAMP OR (
    last_activity < CURRENT_TIMESTAMP - INTERVAL '30 days'
  );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$$ LANGUAGE plpgsql;

-- Log audit event function
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_action VARCHAR,
  p_entity_type VARCHAR,
  p_entity_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id, action, entity_type, entity_id,
    old_values, new_values, ip_address, user_agent,
    status, created_at
  )
  VALUES (
    p_user_id, p_action, p_entity_type, p_entity_id,
    p_old_values, p_new_values, p_ip_address, p_user_agent,
    'success', CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Update users.updated_at on change
CREATE OR REPLACE FUNCTION update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_user_updated_at();

-- Update wallets.updated_at on change
CREATE OR REPLACE FUNCTION update_wallet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_wallet_updated_at();

-- Update assets.updated_at on change
CREATE OR REPLACE FUNCTION update_asset_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_asset_updated_at();

-- Update transactions.updated_at on change
CREATE OR REPLACE FUNCTION update_transaction_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_transaction_updated_at();

-- Update price_alerts.updated_at on change
CREATE OR REPLACE FUNCTION update_price_alert_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER price_alerts_updated_at BEFORE UPDATE ON price_alerts
  FOR EACH ROW EXECUTE FUNCTION update_price_alert_updated_at();

-- Update withdrawal_requests.updated_at on change
CREATE OR REPLACE FUNCTION update_withdrawal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER withdrawal_requests_updated_at BEFORE UPDATE ON withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION update_withdrawal_updated_at();

-- Create portfolio snapshot after transaction
CREATE OR REPLACE FUNCTION create_portfolio_snapshot_after_transaction()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO portfolio_snapshots (
    user_id, total_value_usd, total_value_btc, total_value_eth,
    assets_count, allocation_data
  )
  SELECT
    NEW.user_id,
    (calculate_portfolio_value(NEW.user_id)).total_usd,
    (calculate_portfolio_value(NEW.user_id)).total_btc,
    (calculate_portfolio_value(NEW.user_id)).total_eth,
    (SELECT COUNT(*) FROM assets WHERE user_id = NEW.user_id AND balance > 0),
    json_agg(
      json_build_object(
        'symbol', symbol,
        'balance', balance,
        'balance_usd', balance_usd,
        'percentage', (balance_usd / NULLIF(
          (SELECT SUM(balance_usd) FROM assets WHERE user_id = NEW.user_id), 0
        ) * 100)
      )
    )
  FROM assets
  WHERE user_id = NEW.user_id AND balance > 0;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER snapshot_after_transaction AFTER INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION create_portfolio_snapshot_after_transaction();

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users RLS: Users can only view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::TEXT = id::TEXT OR auth.uid() IS NULL);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::TEXT = id::TEXT);

-- Sessions RLS: Users can only view their own sessions
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (user_id = auth.uid());

-- Wallets RLS: Users can only access their own wallets
CREATE POLICY "Users can view own wallets" ON wallets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own wallets" ON wallets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own wallets" ON wallets
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own wallets" ON wallets
  FOR DELETE USING (user_id = auth.uid());

-- Assets RLS: Users can only access their own assets
CREATE POLICY "Users can view own assets" ON assets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own assets" ON assets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own assets" ON assets
  FOR UPDATE USING (user_id = auth.uid());

-- Transactions RLS: Users can only access their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (user_id = auth.uid());

-- Price history RLS: Everyone can view price history
CREATE POLICY "Anyone can view price history" ON price_history
  FOR SELECT USING (TRUE);

-- Withdrawal requests RLS: Users can only access their own
CREATE POLICY "Users can view own withdrawals" ON withdrawal_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own withdrawals" ON withdrawal_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own withdrawals" ON withdrawal_requests
  FOR UPDATE USING (user_id = auth.uid());

-- Portfolio snapshots RLS: Users can only view their own
CREATE POLICY "Users can view own snapshots" ON portfolio_snapshots
  FOR SELECT USING (user_id = auth.uid());

-- Price alerts RLS: Users can only access their own
CREATE POLICY "Users can view own price alerts" ON price_alerts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own price alerts" ON price_alerts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own price alerts" ON price_alerts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own price alerts" ON price_alerts
  FOR DELETE USING (user_id = auth.uid());

-- Audit logs RLS: Users can only view their own logs
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- Contact messages RLS: Anyone can insert
CREATE POLICY "Anyone can insert contact messages" ON contact_messages
  FOR INSERT WITH CHECK (TRUE);

-- ==========================================
-- INITIAL DATA
-- ==========================================

-- Insert some sample cryptocurrency price history
INSERT INTO price_history (symbol, price_usd, price_change_24h, market_cap, volume_24h, circulating_supply, timestamp)
VALUES
  ('BTC', 43250.00, 2.5, 847500000000, 28500000000, 21000000, CURRENT_TIMESTAMP),
  ('ETH', 2280.50, -0.8, 273600000000, 15200000000, 120000000, CURRENT_TIMESTAMP),
  ('USDC', 1.00, 0.0, 24800000000, 2800000000, 24800000000, CURRENT_TIMESTAMP),
  ('USDT', 1.00, 0.0, 94500000000, 48200000000, 94500000000, CURRENT_TIMESTAMP),
  ('SOL', 108.75, 1.2, 47200000000, 2100000000, 434000000, CURRENT_TIMESTAMP),
  ('XRP', 2.42, 3.1, 128700000000, 3200000000, 53200000000, CURRENT_TIMESTAMP),
  ('ADA', 1.08, -1.5, 38900000000, 520000000, 36000000000, CURRENT_TIMESTAMP),
  ('DOGE', 0.38, 5.2, 54200000000, 2400000000, 142600000000, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
