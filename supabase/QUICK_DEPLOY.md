# Quick Deploy Guide (2 Minutes)

## Fast Track: Deploy Everything in 2 Steps

### Step 1: Deploy Schema (via Supabase Dashboard)

1. Open https://app.supabase.com and select your project
2. Go to **SQL Editor** → **New Query**
3. Copy entire content from `supabase/migrations/001_initial_schema.sql`
4. Paste into editor and click **Run**
5. ✓ Done (wait 2-3 minutes)

### Step 2: Load Test Data (via Supabase Dashboard)

1. **SQL Editor** → **New Query**
2. Copy entire content from `supabase/migrations/002_test_data.sql`
3. Paste and click **Run**
4. ✓ Done

## Verify It Works

Visit your dashboard - you should now see:

- **Portfolio Value**: $41,126.25
- **5 Assets**: BTC, ETH, USDC, SOL, DOGE
- **7 Transactions**: Receive/Send/Swap
- **Portfolio Chart**: 7-day history

## Test User Details

```
Email: testuser@example.com
Wallet: 0xdf12925e53b8638e2ddbf4b0c64d4635609388ab
```

## What Gets Created

**Tables** (10):

- users, sessions, wallets, assets, transactions
- price_history, withdrawal_requests, portfolio_snapshots
- price_alerts, audit_logs

**Functions** (7):

- calculate_portfolio_value
- get_portfolio_24h_change
- get_portfolio_allocation
- get_transaction_summary
- update_asset_prices
- check_and_trigger_price_alerts
- cleanup_expired_sessions

**Triggers** (8):

- Auto-update timestamps on all tables
- Auto-create portfolio snapshots on transactions

**Security** (RLS):

- Users can only see their own data
- Price history is public

## File Locations

- **Schema**: `supabase/migrations/001_initial_schema.sql` (658 lines)
- **Test Data**: `supabase/migrations/002_test_data.sql` (361 lines)
- **Full Guide**: `supabase/DEPLOYMENT_INSTRUCTIONS.md`

## Troubleshooting

**Error: "relation does not exist"**
→ Schema deployment failed. Redeploy from step 1.

**Data doesn't show up**
→ Check if RLS is blocking queries. Go to **Database > RLS** and toggle off temporarily.

**Need help?**
→ See `DEPLOYMENT_INSTRUCTIONS.md` for detailed troubleshooting.
