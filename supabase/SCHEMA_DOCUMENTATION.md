# CryptoVault Supabase Schema Documentation

## Overview

This document describes the complete Supabase database schema for the CryptoVault crypto portfolio management application. The schema includes 10 core tables, 8 functions, and 12 triggers for full-featured portfolio tracking, transaction management, and withdrawal handling.

---

## Table of Contents

1. [Tables](#tables)
2. [Functions](#functions)
3. [Triggers](#triggers)
4. [Row Level Security](#row-level-security)
5. [Usage Examples](#usage-examples)
6. [Setup Instructions](#setup-instructions)

---

## Tables

### 1. **users**
Stores user account information and authentication details.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| auth_id | UUID | Supabase Auth user ID (foreign key) |
| email | VARCHAR(255) | Unique email address |
| username | VARCHAR(100) | Optional username |
| full_name | VARCHAR(255) | User's full name |
| profile_picture_url | TEXT | Profile image URL |
| phone_number | VARCHAR(20) | Contact phone number |
| country | VARCHAR(100) | User's country |
| is_verified | BOOLEAN | Email verification status |
| email_verified_at | TIMESTAMP | When email was verified |
| two_factor_enabled | BOOLEAN | 2FA status |
| preferred_currency | VARCHAR(10) | Currency preference (default: USD) |
| notification_preferences | JSONB | Email/push notification settings |
| kyc_status | VARCHAR(50) | KYC verification status (pending/verified/rejected) |
| kyc_submitted_at | TIMESTAMP | When KYC was submitted |
| kyc_verified_at | TIMESTAMP | When KYC was approved |
| account_status | VARCHAR(50) | Account state (active/suspended/closed) |
| last_login | TIMESTAMP | Last login timestamp |
| created_at | TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | Last update time |
| deleted_at | TIMESTAMP | Soft delete timestamp |

**Indexes:** email, auth_id

---

### 2. **sessions**
Manages user sessions for authentication and security.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to users table |
| token_hash | VARCHAR(255) | Hashed session token |
| ip_address | INET | IP address of session |
| user_agent | TEXT | Browser/device information |
| expires_at | TIMESTAMP | When session expires |
| last_activity | TIMESTAMP | Last activity timestamp |
| is_active | BOOLEAN | Session status |
| created_at | TIMESTAMP | Session creation time |

**Features:**
- Automatic cleanup of expired sessions (via trigger)
- Session timeout management
- IP tracking for security

---

### 3. **wallets**
Stores connected cryptocurrency wallets for each user.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to users table |
| wallet_address | VARCHAR(255) | Blockchain wallet address |
| wallet_type | VARCHAR(50) | Type (coinbase/metamask/ledger/trezor) |
| label | VARCHAR(100) | Custom wallet name |
| is_primary | BOOLEAN | Primary wallet flag |
| balance_usd | DECIMAL(20,2) | Total balance in USD |
| balance_btc | DECIMAL(20,8) | Total balance in BTC equivalent |
| last_synced | TIMESTAMP | Last sync with blockchain |
| connected_at | TIMESTAMP | Connection timestamp |
| disconnected_at | TIMESTAMP | Disconnection timestamp (if applicable) |
| is_active | BOOLEAN | Wallet status |
| metadata | JSONB | Additional wallet metadata |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Constraints:** Unique (user_id, wallet_address)

---

### 4. **assets**
Tracks cryptocurrency holdings for each wallet.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to users table |
| wallet_id | UUID | Reference to wallets table |
| symbol | VARCHAR(20) | Crypto symbol (BTC, ETH, etc.) |
| name | VARCHAR(100) | Full name (Bitcoin, Ethereum) |
| balance | DECIMAL(20,8) | Current balance |
| balance_usd | DECIMAL(20,2) | Balance value in USD |
| price_usd | DECIMAL(20,2) | Current price per unit |
| price_change_24h | DECIMAL(10,2) | 24h price change percentage |
| price_change_7d | DECIMAL(10,2) | 7-day price change percentage |
| price_change_30d | DECIMAL(10,2) | 30-day price change percentage |
| chain | VARCHAR(50) | Blockchain network |
| contract_address | VARCHAR(255) | Token contract address (if applicable) |
| last_synced | TIMESTAMP | Last update from blockchain |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Constraints:** Unique (user_id, wallet_id, symbol)

---

### 5. **transactions**
Records all cryptocurrency transactions for audit and history.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to users table |
| wallet_id | UUID | Reference to wallets table |
| tx_hash | VARCHAR(255) | Blockchain transaction hash (unique) |
| tx_type | VARCHAR(50) | Type (send/receive/swap/stake) |
| symbol | VARCHAR(20) | Cryptocurrency symbol |
| amount | DECIMAL(20,8) | Transaction amount |
| amount_usd | DECIMAL(20,2) | USD equivalent |
| from_address | VARCHAR(255) | Sender address |
| to_address | VARCHAR(255) | Recipient address |
| fee_amount | DECIMAL(20,8) | Transaction fee |
| fee_usd | DECIMAL(20,2) | Fee in USD |
| status | VARCHAR(50) | Status (pending/confirmed/failed) |
| confirmation_count | INTEGER | Number of confirmations |
| gas_price | DECIMAL(20,8) | Gas price paid |
| gas_used | DECIMAL(20,8) | Gas consumed |
| nonce | INTEGER | Transaction nonce |
| block_number | BIGINT | Block number |
| block_timestamp | TIMESTAMP | When block was mined |
| network | VARCHAR(50) | Network (mainnet/testnet/polygon) |
| notes | TEXT | User notes |
| metadata | JSONB | Additional data |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

**Indexes:** user_id, wallet_id, tx_hash, status, created_at, tx_type

---

### 6. **price_history**
Stores historical price data for charting and analysis.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| symbol | VARCHAR(20) | Cryptocurrency symbol |
| price_usd | DECIMAL(20,2) | Price in USD |
| price_change_24h | DECIMAL(10,2) | 24h change percentage |
| market_cap | DECIMAL(30,2) | Market capitalization |
| volume_24h | DECIMAL(30,2) | 24h trading volume |
| circulating_supply | DECIMAL(30,8) | Circulating supply |
| timestamp | TIMESTAMP | Price snapshot time |
| source | VARCHAR(50) | Data source (coinbase/coingecko/binance) |

**Indexes:** symbol, timestamp, symbol+timestamp

---

### 7. **withdrawal_requests**
Tracks all withdrawal requests with verification and status tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to users table |
| wallet_id | UUID | Reference to wallets table |
| symbol | VARCHAR(20) | Cryptocurrency to withdraw |
| amount | DECIMAL(20,8) | Withdrawal amount |
| amount_usd | DECIMAL(20,2) | USD equivalent |
| destination_address | VARCHAR(255) | Target wallet address |
| network | VARCHAR(50) | Network to use |
| fee_amount | DECIMAL(20,8) | Network fee |
| fee_usd | DECIMAL(20,2) | Fee in USD |
| status | VARCHAR(50) | Status (pending/processing/completed/failed) |
| tx_hash | VARCHAR(255) | Transaction hash (after completion) |
| rejection_reason | TEXT | Reason if rejected |
| reviewed_by | UUID | Admin user who reviewed it |
| reviewed_at | TIMESTAMP | Review timestamp |
| email_verification_token | VARCHAR(255) | Email verification token |
| email_verified_at | TIMESTAMP | Email verification time |
| two_factor_verified_at | TIMESTAMP | 2FA verification time |
| estimated_completion_at | TIMESTAMP | Expected completion time |
| completed_at | TIMESTAMP | Actual completion time |
| created_at | TIMESTAMP | Request creation time |
| updated_at | TIMESTAMP | Last update time |

**Features:**
- Multi-step verification (email + 2FA)
- Admin review workflow
- Amount validation (checked via trigger)

---

### 8. **portfolio_snapshots**
Daily snapshots of portfolio state for trend analysis.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to users table |
| total_value_usd | DECIMAL(20,2) | Total portfolio value in USD |
| total_value_btc | DECIMAL(20,8) | Total portfolio in BTC |
| total_value_eth | DECIMAL(20,8) | Total portfolio in ETH |
| assets_count | INTEGER | Number of different assets |
| allocation_data | JSONB | Per-asset allocation breakdown |
| snapshot_date | TIMESTAMP | When snapshot was taken |
| created_at | TIMESTAMP | Record creation time |

**Use Cases:**
- Portfolio growth charts
- Historical value tracking
- Performance metrics

---

### 9. **price_alerts**
Manages user-created price alerts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to users table |
| symbol | VARCHAR(20) | Cryptocurrency symbol |
| alert_type | VARCHAR(50) | Type (above/below target) |
| target_price | DECIMAL(20,2) | Target price threshold |
| is_active | BOOLEAN | Alert status |
| triggered | BOOLEAN | Whether alert has been triggered |
| triggered_at | TIMESTAMP | When alert was triggered |
| triggered_price | DECIMAL(20,2) | Price when triggered |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

**Features:**
- Automatic trigger checking via function
- Multiple alert types
- Notification integration ready

---

### 10. **audit_logs**
Comprehensive audit trail for compliance and security.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to users table |
| action | VARCHAR(100) | Action performed |
| entity_type | VARCHAR(50) | Entity affected |
| entity_id | UUID | ID of affected entity |
| old_values | JSONB | Previous values |
| new_values | JSONB | New values |
| ip_address | INET | IP address |
| user_agent | TEXT | Browser/device info |
| status | VARCHAR(50) | Action status |
| error_message | TEXT | Any error that occurred |
| created_at | TIMESTAMP | Log timestamp |

**Logged Actions:**
- WALLET_CONNECTED
- WALLET_DISCONNECTED
- TRANSACTION_CREATED
- TRANSACTION_UPDATED
- WITHDRAWAL_REQUESTED
- WITHDRAWAL_STATUS_UPDATED

---

## Functions

### 1. **calculate_portfolio_value(user_id UUID)**
Calculates total portfolio value in USD, BTC, and ETH.

```sql
SELECT * FROM calculate_portfolio_value('user-uuid-here');
-- Returns: total_usd, total_btc, total_eth
```

---

### 2. **get_portfolio_24h_change(user_id UUID)**
Calculates 24-hour portfolio change in both percentage and USD.

```sql
SELECT * FROM get_portfolio_24h_change('user-uuid-here');
-- Returns: change_percentage, change_usd
```

---

### 3. **get_transaction_summary(user_id UUID, days INTEGER DEFAULT 30)**
Summarizes transactions by type over specified period.

```sql
SELECT * FROM get_transaction_summary('user-uuid-here', 30);
-- Returns: tx_type, count, total_amount, total_usd
```

---

### 4. **get_portfolio_allocation(user_id UUID)**
Returns portfolio allocation breakdown by asset.

```sql
SELECT * FROM get_portfolio_allocation('user-uuid-here');
-- Returns: symbol, balance, balance_usd, percentage
```

---

### 5. **update_asset_prices()**
Updates all asset prices from latest price history records.

```sql
SELECT * FROM update_asset_prices();
-- Returns: updated_count
```

---

### 6. **check_and_trigger_price_alerts()**
Checks all active price alerts and triggers those that reach target.

```sql
SELECT * FROM check_and_trigger_price_alerts();
-- Returns: triggered_count
```

---

### 7. **cleanup_expired_sessions()**
Removes expired and old inactive sessions.

```sql
SELECT * FROM cleanup_expired_sessions();
-- Returns: deleted_count
```

---

### 8. **log_audit_event(user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)**
Manual audit logging function.

```sql
SELECT log_audit_event(
  'user-uuid',
  'CUSTOM_ACTION',
  'entities',
  'entity-uuid',
  '{old}'::jsonb,
  '{new}'::jsonb,
  '192.168.1.1'::inet,
  'Mozilla/5.0...'
);
-- Returns: log_id
```

---

## Triggers

### Automatic Timestamp Triggers
- `users_update_timestamp` - Updates `updated_at` on users table
- `wallets_update_timestamp` - Updates `updated_at` on wallets table
- `assets_update_timestamp` - Updates `updated_at` on assets table
- `transactions_update_timestamp` - Updates `updated_at` on transactions table
- `withdrawal_requests_update_timestamp` - Updates `updated_at` on withdrawal_requests table
- `price_alerts_update_timestamp` - Updates `updated_at` on price_alerts table

### Audit Logging Triggers
- `wallets_log_connection` - Logs when wallet is connected
- `wallets_log_disconnection` - Logs when wallet is disconnected
- `transactions_log_creation` - Logs transaction creation
- `withdrawal_requests_log_creation` - Logs withdrawal request creation
- `withdrawal_requests_log_status` - Logs withdrawal status changes

### Business Logic Triggers
- `withdrawal_requests_validate` - Validates sufficient balance before withdrawal
- `transactions_create_snapshot` - Creates portfolio snapshot after transaction

---

## Row Level Security

All tables have RLS enabled with policies for data isolation:

- **users**: Can view/update own profile
- **wallets**: Can view/manage own wallets
- **assets**: Can view/manage own assets
- **transactions**: Can view own transactions (read-only)
- **withdrawal_requests**: Can view own requests, can create new ones
- **price_alerts**: Can manage own alerts
- **portfolio_snapshots**: Can view own snapshots
- **audit_logs**: Can view own logs (read-only)

All policies use `auth.uid()` for user identification.

---

## Usage Examples

### Example 1: Get User Portfolio Overview
```sql
-- Get total portfolio value
SELECT * FROM calculate_portfolio_value('user-uuid');

-- Get 24h change
SELECT * FROM get_portfolio_24h_change('user-uuid');

-- Get allocation by asset
SELECT * FROM get_portfolio_allocation('user-uuid');
```

### Example 2: Get Transaction History
```sql
SELECT 
  id,
  tx_type,
  symbol,
  amount,
  amount_usd,
  status,
  created_at
FROM public.transactions
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 20;
```

### Example 3: Get Price Chart Data
```sql
SELECT 
  timestamp,
  price_usd,
  price_change_24h
FROM public.price_history
WHERE symbol = 'BTC'
AND timestamp > NOW() - INTERVAL '30 days'
ORDER BY timestamp DESC;
```

### Example 4: Create Withdrawal Request
```sql
INSERT INTO public.withdrawal_requests (
  user_id,
  wallet_id,
  symbol,
  amount,
  amount_usd,
  destination_address,
  network,
  fee_amount,
  fee_usd
) VALUES (
  'user-uuid',
  'wallet-uuid',
  'BTC',
  0.5,
  21000.00,
  '1A1z7agoat4xNAavZY2YoW6XwMEUpnqRDM',
  'mainnet',
  0.0005,
  21.00
);
-- Trigger will validate balance automatically
```

### Example 5: Create Price Alert
```sql
INSERT INTO public.price_alerts (
  user_id,
  symbol,
  alert_type,
  target_price
) VALUES (
  'user-uuid',
  'BTC',
  'above',
  50000.00
);
```

---

## Setup Instructions

### 1. Connect to Supabase
Navigate to [Connect to Supabase](#open-mcp-popover) and link your project.

### 2. Run Schema SQL
1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy the entire content from `supabase/schema.sql`
4. Execute the query

### 3. Configure Auth
In Supabase:
1. Go to Authentication → Providers
2. Enable Email provider
3. Set redirect URLs in settings
4. Configure email templates

### 4. Set Up Scheduled Functions
Create scheduled jobs to run periodically:

```sql
-- Run daily to clean up expired sessions
SELECT cleanup_expired_sessions();

-- Run every hour to update asset prices (if using price history)
SELECT update_asset_prices();

-- Run every 5 minutes to check price alerts
SELECT check_and_trigger_price_alerts();
```

### 5. Environment Variables
Add to your `.env` file:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
NEXT_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 6. Client Integration
Example queries in React:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Get portfolio value
const { data } = await supabase
  .rpc('calculate_portfolio_value', { p_user_id: userId });

// Get transactions
const { data: transactions } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(20);
```

---

## Security Considerations

1. **Row Level Security**: All tables have RLS enabled
2. **Audit Logging**: All sensitive actions are logged
3. **Withdrawal Validation**: Automatic balance checks
4. **Session Management**: Automatic cleanup of expired sessions
5. **Data Encryption**: Use SSL/TLS for all connections
6. **Rate Limiting**: Implement at application layer

---

## Performance Tips

1. **Indexes**: All commonly queried columns are indexed
2. **Materialized Views**: Consider adding for complex aggregations
3. **Partitioning**: Consider partitioning transactions/price_history by date
4. **Caching**: Cache frequently accessed data (portfolio snapshots, price data)
5. **Query Optimization**: Use EXPLAIN ANALYZE for complex queries

---

## Maintenance

### Monthly Tasks
- Review audit logs for suspicious activity
- Analyze slow queries using `pg_stat_statements`
- Update price history retention policies

### Quarterly Tasks
- Review and optimize RLS policies
- Audit user access permissions
- Check storage usage

### Yearly Tasks
- Archive old transaction data
- Backup and test recovery procedures
- Review security policies

---

## Support

For issues or questions:
1. Check Supabase documentation: https://supabase.com/docs
2. Review PostgreSQL documentation for complex queries
3. Use Supabase Dashboard for monitoring and debugging
