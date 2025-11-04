# 📖 Supabase Database Quick Reference

## 🚀 One-Command Deployment

```bash
# 1. Open Supabase SQL Editor
https://app.supabase.com → Your Project → SQL Editor

# 2. Run this file
supabase/schema.sql

# 3. Verify deployment
supabase/verify-deployment.sql
```

---

## 📊 Database Overview

| Component | Count | Status |
|-----------|-------|--------|
| Tables | 14 | ✅ Complete |
| Functions | 11 | ✅ Complete |
| Triggers | 12 | ✅ Complete |
| RLS Policies | 15+ | ✅ Complete |
| Indexes | 40+ | ✅ Optimized |

---

## 📦 Core Tables

```
users              → User accounts & profiles
sessions           → Active user sessions
wallets            → Connected crypto wallets
assets             → Cryptocurrency holdings
transactions       → Transaction history
withdrawal_requests → Withdrawal workflow
portfolio_snapshots → Portfolio history
price_alerts       → User price alerts
price_history      → Historical price data
audit_logs         → Complete audit trail
```

---

## ⚙️ Essential Functions

### Portfolio Functions
```sql
-- Get total portfolio value
SELECT * FROM calculate_portfolio_value('user-uuid-here');

-- Get 24h change
SELECT * FROM get_portfolio_24h_change('user-uuid-here');

-- Get asset allocation
SELECT * FROM get_portfolio_allocation('user-uuid-here');
```

### Transaction Functions
```sql
-- Get transaction summary (last 30 days)
SELECT * FROM get_transaction_summary('user-uuid-here', 30);

-- Get total fees paid
SELECT * FROM get_total_fees_paid('user-uuid-here', 30);
```

### Maintenance Functions
```sql
-- Update all asset prices from price_history
SELECT update_asset_prices();

-- Check and trigger price alerts
SELECT check_and_trigger_price_alerts();

-- Clean up expired sessions
SELECT cleanup_expired_sessions();

-- Lock accounts with excessive login attempts
SELECT lock_accounts_excessive_attempts();

-- Unlock expired account locks
SELECT unlock_expired_account_locks();
```

---

## 🔍 Common Queries

### Get User Portfolio
```sql
SELECT 
  a.symbol,
  a.name,
  a.balance,
  a.balance_usd,
  a.price_usd,
  a.price_change_24h
FROM assets a
WHERE a.user_id = 'user-uuid-here'
AND a.balance > 0
ORDER BY a.balance_usd DESC;
```

### Get Recent Transactions
```sql
SELECT 
  t.tx_type,
  t.symbol,
  t.amount,
  t.amount_usd,
  t.status,
  t.created_at
FROM transactions t
WHERE t.user_id = 'user-uuid-here'
ORDER BY t.created_at DESC
LIMIT 20;
```

### Get Active Wallets
```sql
SELECT 
  w.wallet_address,
  w.wallet_type,
  w.is_primary,
  w.balance_usd,
  w.connected_at
FROM wallets w
WHERE w.user_id = 'user-uuid-here'
AND w.is_active = TRUE
ORDER BY w.is_primary DESC;
```

### Get Pending Withdrawals
```sql
SELECT 
  wr.symbol,
  wr.amount,
  wr.destination_address,
  wr.status,
  wr.created_at
FROM withdrawal_requests wr
WHERE wr.user_id = 'user-uuid-here'
ORDER BY wr.created_at DESC;
```

---

## 🔐 Security Features

### Row Level Security (RLS)
All tables have RLS enabled. Users can only access their own data via:
```sql
-- Policy example (automatically applied)
CREATE POLICY "Users can view their own data" ON table_name
  FOR SELECT USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
```

### Audit Logging
All critical actions are automatically logged:
```sql
-- View recent audit logs
SELECT * FROM audit_logs 
WHERE user_id = 'user-uuid-here'
ORDER BY created_at DESC;
```

---

## 📈 Portfolio Tracking

### Create Daily Snapshot
```sql
-- Run this daily via cron
INSERT INTO portfolio_snapshots (user_id, total_value_usd, total_value_btc, total_value_eth)
SELECT 
  id,
  (SELECT total_usd FROM calculate_portfolio_value(id)),
  (SELECT total_btc FROM calculate_portfolio_value(id)),
  (SELECT total_eth FROM calculate_portfolio_value(id))
FROM users
WHERE account_status = 'active';
```

### Get Portfolio History
```sql
SELECT 
  snapshot_date,
  total_value_usd,
  total_value_btc
FROM portfolio_snapshots
WHERE user_id = 'user-uuid-here'
ORDER BY snapshot_date DESC
LIMIT 30;
```

---

## 💰 Price Management

### Insert Price Data
```sql
INSERT INTO price_history (symbol, price_usd, price_change_24h, market_cap, volume_24h)
VALUES ('BTC', 45000.00, 2.5, 850000000000, 35000000000);
```

### Get Latest Price
```sql
SELECT * FROM price_history
WHERE symbol = 'BTC'
ORDER BY timestamp DESC
LIMIT 1;
```

---

## 🚨 Price Alerts

### Create Price Alert
```sql
INSERT INTO price_alerts (user_id, symbol, alert_type, target_price)
VALUES ('user-uuid-here', 'BTC', 'above', 50000.00);
```

### Get Active Alerts
```sql
SELECT * FROM price_alerts
WHERE user_id = 'user-uuid-here'
AND is_active = TRUE;
```

---

## 🔧 Maintenance Tasks

### Daily
```sql
-- Create portfolio snapshots
SELECT create_daily_snapshots();

-- Update asset prices
SELECT update_asset_prices();
```

### Every 5 Minutes
```sql
-- Update real-time prices
SELECT update_asset_prices();

-- Check price alerts
SELECT check_and_trigger_price_alerts();
```

### Hourly
```sql
-- Clean up expired sessions
SELECT cleanup_expired_sessions();

-- Unlock expired account locks
SELECT unlock_expired_account_locks();
```

---

## 📊 Analytics Queries

### Total Platform Value
```sql
SELECT 
  COUNT(DISTINCT u.id) as total_users,
  SUM(a.balance_usd) as total_value_locked,
  COUNT(DISTINCT w.id) as total_wallets,
  COUNT(DISTINCT t.id) as total_transactions
FROM users u
LEFT JOIN assets a ON a.user_id = u.id
LEFT JOIN wallets w ON w.user_id = u.id AND w.is_active = TRUE
LEFT JOIN transactions t ON t.user_id = u.id;
```

### Top Assets by Value
```sql
SELECT 
  a.symbol,
  COUNT(DISTINCT a.user_id) as holders,
  SUM(a.balance) as total_balance,
  SUM(a.balance_usd) as total_value_usd
FROM assets a
WHERE a.balance > 0
GROUP BY a.symbol
ORDER BY total_value_usd DESC;
```

### Recent Activity
```sql
SELECT 
  DATE_TRUNC('day', t.created_at) as date,
  COUNT(*) as transaction_count,
  SUM(t.amount_usd) as total_volume
FROM transactions t
WHERE t.created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', t.created_at)
ORDER BY date DESC;
```

---

## 🎯 TypeScript Integration

```typescript
// Import client and types
import { supabase } from '@shared/lib/supabase';
import type { User, Wallet, Asset } from '@shared/types/database';

// Get portfolio value
const value = await getPortfolioValue(userId);

// Get user assets
const assets = await getUserAssets(userId);

// Get transactions
const txs = await getTransactionHistory(userId, 20);

// Create withdrawal
await createWithdrawalRequest(
  userId, walletId, 'BTC', 0.1, 4500, 
  '0x...', 'ethereum', 0.0001, 4.5
);
```

---

## 🐛 Debugging

### Check RLS Policies
```sql
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### Check Current User
```sql
SELECT auth.uid(); -- Current authenticated user
```

### Disable RLS (Testing Only!)
```sql
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
-- Remember to re-enable: ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### View Query Performance
```sql
EXPLAIN ANALYZE
SELECT * FROM assets WHERE user_id = 'user-uuid-here';
```

---

## 📞 Support

- **Schema Documentation**: `supabase/SCHEMA_DOCUMENTATION.md`
- **Setup Guide**: `supabase/SETUP_GUIDE.md`
- **Deployment Guide**: `DEPLOYMENT_READY.md`
- **Verification**: `supabase/verify-deployment.sql`

---

## ✅ Checklist

- [ ] Schema deployed (`schema.sql`)
- [ ] Verification passed (`verify-deployment.sql`)
- [ ] Authentication enabled (Email provider)
- [ ] Environment variables set
- [ ] Test data created (optional)
- [ ] Cron jobs configured
- [ ] Application deployed
