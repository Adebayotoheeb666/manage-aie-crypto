# Deploying Supabase Schema and Test Data

This guide explains how to deploy the complete schema and test data to your Supabase database.

## Prerequisites

- Supabase project created at https://app.supabase.com
- Environment variables configured:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Method 1: Using Supabase Dashboard (Recommended for Setup)

### Step 1: Open SQL Editor

1. Go to https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Deploy Schema

1. Create a new query called "001_initial_schema"
2. Copy the entire content from `supabase/migrations/001_initial_schema.sql`
3. Paste it into the SQL Editor
4. Click **Run** (or Ctrl+Enter)
5. Wait for completion (2-3 minutes)
6. You should see ✓ Query succeeded

**Verify:** Go to **Table Editor** and confirm you see these tables:
- users
- sessions
- wallets
- assets
- transactions
- price_history
- withdrawal_requests
- portfolio_snapshots
- price_alerts
- audit_logs
- contact_messages

### Step 3: Load Test Data

1. Create another new query called "002_test_data"
2. Copy the entire content from `supabase/migrations/002_test_data.sql`
3. Paste it into the SQL Editor
4. Click **Run**
5. You should see output showing data counts

**Verify:** In **Table Editor**, you should see:
- 1 user: `testuser@example.com`
- 1 wallet with 5 assets (BTC, ETH, USDC, SOL, DOGE)
- 7 transactions (5 receive, 2 send/swap)
- 7 portfolio snapshots
- 3 price alerts

## Method 2: Using Supabase CLI (For Advanced Users)

```bash
# 1. Install Supabase CLI (if not already installed)
npm install -g supabase

# 2. Link your project
supabase link --project-ref <your-project-ref>

# 3. Create migrations directory structure
mkdir -p supabase/migrations

# 4. Copy migration files to supabase/migrations/
# (They should already be in the right place)

# 5. Deploy migrations
supabase db push

# 6. Pull updated types (optional but recommended)
supabase gen types typescript --local > shared/types/database.ts
```

## Method 3: Direct Database Connection (Using psql)

If you prefer using PostgreSQL directly:

```bash
# 1. Get your database connection string from Supabase dashboard
# Settings > Database > Connection string > URI

# 2. Run migrations
psql <CONNECTION_STRING> < supabase/migrations/001_initial_schema.sql
psql <CONNECTION_STRING> < supabase/migrations/002_test_data.sql
```

## After Deployment

### 1. Verify the Connection

Navigate to your dashboard in the app. You should now see:
- Portfolio value: $41,126.25
- Portfolio allocation chart with 5 assets
- Transaction history with 7 transactions
- Portfolio history chart showing 7 snapshots

### 2. Update Type Definitions (Optional but Recommended)

The Supabase JavaScript client can auto-generate TypeScript types:

```bash
# Using Supabase CLI
supabase gen types typescript --local > shared/types/database.ts
```

### 3. Configure RLS Policies (Optional)

The migrations include Row Level Security (RLS) policies. If you want to test without RLS:

1. Go to **Database > RLS** in Supabase dashboard
2. Toggle RLS **OFF** for development
3. Toggle RLS **ON** for production

**Note:** With RLS enabled, users can only see their own data. The test user must be authenticated to view test data.

### 4. Test Authentication

To test with the demo account:

1. The schema doesn't create Supabase Auth users automatically
2. You need to create an auth user manually or use the app's signup flow
3. Connect the test wallet: `0xdf12925e53b8638e2ddbf4b0c64d4635609388ab`

Or, to manually link a user to auth:

```sql
-- In SQL Editor, after creating an auth user in Supabase Auth:
UPDATE users 
SET auth_id = '<auth_user_id>' 
WHERE id = '123e4567-e89b-12d3-a456-426614174000'::UUID;
```

## Test Data Summary

### Test User
- **Email**: testuser@example.com
- **Username**: testuser
- **ID**: `123e4567-e89b-12d3-a456-426614174000`

### Test Wallet
- **Address**: `0xdf12925e53b8638e2ddbf4b0c64d4635609388ab`
- **Type**: MetaMask
- **Primary**: Yes

### Test Assets
| Symbol | Balance | Value (USD) | Price |
|--------|---------|-------------|-------|
| BTC    | 0.5     | $21,625    | $43,250.00 |
| ETH    | 5.0     | $11,402.50 | $2,280.50 |
| USDC   | 5,000   | $5,000     | $1.00 |
| SOL    | 25      | $2,718.75  | $108.75 |
| DOGE   | 1,000   | $380       | $0.38 |

**Total Portfolio Value**: $41,126.25

### Test Transactions
- 5 receive transactions (various cryptocurrencies)
- 2 send transactions (ETH and USDC)
- 1 swap transaction (BTC)
- Status: Mix of confirmed and pending

### Historical Data
- 7 portfolio snapshots (last 7 days)
- Used for the portfolio chart showing value trends

## Troubleshooting

### "relation 'users' does not exist"
- The schema hasn't been deployed yet
- Follow Method 1 above to deploy the initial schema

### "permission denied for table"
- RLS might be interfering with test data insertion
- Temporarily disable RLS in **Database > RLS** settings
- Run the test data migration
- Re-enable RLS if desired

### "function 'calculate_portfolio_value' does not exist"
- The schema was partially deployed
- Clear all tables/functions and redeploy from scratch

### Data doesn't appear in app
- Verify you're authenticated with the correct user
- Check that RLS isn't blocking your queries
- Ensure environment variables are set correctly
- Check browser console for errors

## Production Deployment Checklist

- [ ] Deploy schema using Supabase CLI
- [ ] Enable Row Level Security (RLS)
- [ ] Create proper auth users (don't use test data in production)
- [ ] Back up your database
- [ ] Test all functions work correctly
- [ ] Monitor RLS policies for security

## Additional Resources

- [Supabase SQL Documentation](https://supabase.com/docs/guides/database)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)
