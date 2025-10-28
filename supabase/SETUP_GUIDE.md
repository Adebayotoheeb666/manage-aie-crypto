# CryptoVault Supabase Setup Guide

Complete guide to set up the CryptoVault Supabase schema and integrate it with your application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Connect Supabase](#step-1-connect-supabase)
3. [Step 2: Deploy Schema](#step-2-deploy-schema)
4. [Step 3: Configure Authentication](#step-3-configure-authentication)
5. [Step 4: Environment Variables](#step-4-environment-variables)
6. [Step 5: Test the Setup](#step-5-test-the-setup)
7. [Step 6: Frontend Integration](#step-6-frontend-integration)
8. [Step 7: Set Up Scheduled Functions](#step-7-set-up-scheduled-functions)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Supabase account (free or paid)
- Supabase project created
- Node.js 16+ installed locally
- Your CryptoVault project files

---

## Step 1: Connect Supabase

Your environment variables are already set:

Set these in your hosting provider's environment settings (do not commit values to the repo):

```env
VITE_SUPABASE_URL=<set in host env>
VITE_SUPABASE_ANON_KEY=<set in host env>
NEXT_SUPABASE_SERVICE_ROLE_KEY=<set in host env>
```

These are already configured in your project environment.

---

## Step 2: Deploy Schema

### Method 1: Using SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project
   - Navigate to **SQL Editor**

2. **Create New Query**
   - Click "New Query"
   - Name it "Initial Schema Setup"

3. **Copy Schema SQL**
   - Open `supabase/schema.sql` from your project
   - Copy the entire content
   - Paste into the SQL Editor

4. **Execute Query**
   - Click "Run" or press Ctrl+Enter
   - Wait for completion (may take 1-2 minutes)
   - You should see "Query succeeded" at the bottom

5. **Verify Tables Created**
   - Go to **Table Editor** in Supabase Dashboard
   - You should see these tables:
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

### Method 2: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref rdrmehocsdmadhostbgz

# Deploy migrations
supabase db push
```

---

## Step 3: Configure Authentication

### 3.1 Enable Email Authentication

1. In Supabase Dashboard, go to **Authentication > Providers**
2. Find **Email**
3. Toggle it ON
4. Configure:
   - **Email Templates** → Customize if needed
   - **Settings** → Configure redirect URLs

### 3.2 Set Redirect URLs

In **Authentication > URL Configuration**:

Add redirect URLs:

```
http://localhost:5173/dashboard
http://localhost:5173/auth/callback
https://yourdomain.com/dashboard
https://yourdomain.com/auth/callback
```

### 3.3 Enable RLS (Row Level Security)

RLS is already enabled in the schema.sql file. Verify in Supabase:

1. Go to **Authentication > Policies**
2. You should see policies for each table
3. Verify they're all enabled

---

## Step 4: Environment Variables

Your `.env` file should already have:

```env
# Supabase URLs and Keys (configure in host env, not in files)
VITE_SUPABASE_URL=<set in host env>
VITE_SUPABASE_ANON_KEY=<set in host env>
NEXT_SUPABASE_SERVICE_ROLE_KEY=<set in host env>
```

These are available to the app automatically.

---

## Step 5: Test the Setup

### 5.1 Test Database Connection

Create a test file `test-supabase.ts`:

```typescript
import { supabase } from "@shared/lib/supabase";

async function testConnection() {
  try {
    // Test 1: Check if we can connect
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("✓ Auth connection working");

    // Test 2: Check database access
    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (error) throw error;
    console.log("✓ Database connection working");
    console.log(`  Users in database: ${count}`);

    // Test 3: Check functions
    if (user?.id) {
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .single();

      if (profile) {
        console.log("✓ User profile exists");
      } else {
        console.log("⚠ User profile not found (expected for new users)");
      }
    }

    console.log("\n✅ All tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testConnection();
```

Run:

```bash
npx ts-node test-supabase.ts
```

### 5.2 Test Authentication

In your application, test the sign-up flow:

```typescript
const { data, error } = await supabase.auth.signUp({
  email: "test@example.com",
  password: "TestPassword123!",
});

if (error) {
  console.error("Sign up error:", error);
} else {
  console.log("✓ User created:", data.user?.id);
}
```

---

## Step 6: Frontend Integration

### 6.1 Use the Supabase Library

The library `shared/lib/supabase.ts` provides helper functions:

```typescript
import {
  getPortfolioValue,
  getUserWallets,
  getTransactionHistory,
  createWithdrawalRequest,
} from "@shared/lib/supabase";

// Get portfolio value
const portfolioValue = await getPortfolioValue(userId);
console.log(`Portfolio worth: $${portfolioValue.total_usd}`);

// Get user wallets
const wallets = await getUserWallets(userId);
console.log(`User has ${wallets.length} wallets`);

// Get recent transactions
const transactions = await getTransactionHistory(userId, 20);
console.log(`Recent transactions:`, transactions);
```

### 6.2 Use Types

Import types for type-safe code:

```typescript
import type {
  User,
  Wallet,
  Transaction,
  WithdrawalRequest,
} from "@shared/types/database";

async function processUser(user: User) {
  console.log(`Processing user: ${user.email}`);
  // TypeScript will catch type errors
}
```

### 6.3 Example: Dashboard Data Fetching

```typescript
import { useEffect, useState } from 'react';
import {
  getPortfolioValue,
  getUserAssets,
  getPortfolioAllocation,
} from '@shared/lib/supabase';

export function DashboardPage({ userId }: { userId: string }) {
  const [portfolioValue, setPortfolioValue] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [value, assetsList] = await Promise.all([
          getPortfolioValue(userId),
          getUserAssets(userId),
        ]);

        setPortfolioValue(value);
        setAssets(assetsList);
      } catch (error) {
        console.error('Failed to fetch portfolio data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Portfolio Value: ${portfolioValue?.total_usd}</h1>
      <ul>
        {assets.map((asset) => (
          <li key={asset.id}>
            {asset.symbol}: {asset.balance} ({asset.balance_usd} USD)
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Step 7: Set Up Scheduled Functions

Supabase doesn't have built-in cron jobs, but you can use:

### Option 1: External Cron Service (Recommended)

Use **Supabase Edge Functions** or external services like **Vercel Cron**, **AWS Lambda**, or **Google Cloud Functions**.

Example with Vercel:

```typescript
// api/cron/update-prices.ts
export const config = {
  runtime: "nodejs",
};

export default async function handler(req: any, res: any) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { data, error } = await supabase.rpc("update_asset_prices");
    if (error) throw error;

    return res.status(200).json({
      success: true,
      updated: data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating prices:", error);
    return res.status(500).json({ error: "Failed to update prices" });
  }
}
```

### Option 2: Manual Execution (Development)

Run maintenance functions manually when needed:

```typescript
import {
  updateAssetPrices,
  cleanupExpiredSessions,
} from "@shared/lib/supabase";

// In your admin panel or API route
async function runMaintenance() {
  console.log("Running maintenance...");

  const [priceUpdate, sessionCleanup] = await Promise.all([
    updateAssetPrices(),
    cleanupExpiredSessions(),
  ]);

  console.log(`Updated ${priceUpdate.updated_count} asset prices`);
  console.log(`Cleaned up ${sessionCleanup.deleted_count} sessions`);
}
```

---

## Troubleshooting

### Issue: "Permission denied" Error

**Cause:** RLS policies blocking access
**Solution:**

1. Verify you're logged in with correct user
2. Check RLS policies in Supabase Dashboard
3. Ensure `auth.uid()` is set correctly

### Issue: "relation does not exist" Error

**Cause:** Schema not deployed
**Solution:**

1. Re-run the schema.sql script
2. Check SQL Editor for errors
3. Verify tables exist in Table Editor

### Issue: Cannot Create Users

**Cause:** Auth not configured
**Solution:**

1. Verify Email provider is enabled
2. Check redirect URLs are correct
3. Verify ANON_KEY in environment

### Issue: RLS Policies Not Working

**Cause:** Policy syntax or auth context
**Solution:**

1. Test with Service Role key first (unrestricted)
2. Verify auth.uid() returns correct value
3. Check policy conditions

### Issue: Functions Not Returning Data

**Cause:** Missing function or permissions
**Solution:**

1. Verify function exists: `SELECT * FROM pg_proc WHERE proname = 'function_name'`
2. Check function permissions
3. Test with Service Role key

---

## Verification Checklist

- [ ] All 10 tables created
- [ ] All indexes created
- [ ] All 8 functions created
- [ ] All 12 triggers created
- [ ] RLS enabled on all tables
- [ ] Email authentication enabled
- [ ] Redirect URLs configured
- [ ] Environment variables set
- [ ] Database connection working
- [ ] Authentication flow working
- [ ] Helper functions imported in code
- [ ] Types available in TypeScript

---

## Next Steps

1. **Integrate with your app:**
   - Import `supabase` client in your components
   - Use helper functions for CRUD operations
   - Add error handling and loading states

2. **Set up authentication:**
   - Implement sign-up flow
   - Implement sign-in flow
   - Implement password reset
   - Implement 2FA (optional)

3. **Implement wallet functionality:**
   - Connect wallet (Coinbase/MetaMask)
   - Fetch wallet balance
   - Store transaction history
   - Display portfolio

4. **Set up price updates:**
   - Import price data from API
   - Update prices in database
   - Trigger price alerts
   - Display price charts

5. **Enable withdrawal functionality:**
   - Create withdrawal request flow
   - Email verification
   - 2FA verification
   - Process withdrawal

6. **Monitor and maintain:**
   - Review audit logs regularly
   - Monitor database usage
   - Optimize slow queries
   - Update schema as needed

---

## Support

If you encounter issues:

1. Check **Supabase Dashboard → Logs** for database errors
2. Check **Supabase Dashboard → Auth → Logs** for authentication issues
3. Review error messages in browser console
4. Check this guide's Troubleshooting section
5. Refer to [Supabase Documentation](https://supabase.com/docs)
6. Check [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## Security Reminders

⚠️ **Important Security Practices:**

1. **Never commit secrets** to version control
2. **Use Service Role Key only on backend** - it has admin access
3. **Use Anon Key in frontend** - it respects RLS policies
4. **Enable RLS on all tables** - already done in schema
5. **Review audit logs** regularly for suspicious activity
6. **Rotate API keys** periodically
7. **Keep dependencies updated** - run `npm audit`
8. **Use HTTPS only** in production
9. **Enable 2FA** for user accounts
10. **Use environment variables** for all secrets

---

## Database Backup

Supabase automatically backs up your data. To manually backup:

1. In Supabase Dashboard, go to **Settings → Backups**
2. Click "Create Backup"
3. Download backup file when ready

To restore:

1. In Supabase Dashboard, go to **Settings → Backups**
2. Select backup to restore
3. Click "Restore"

---

**Setup Complete! Your CryptoVault database is ready to use.** 🎉
