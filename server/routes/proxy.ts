import type { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@shared/types/database";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

// Create a server-side supabase client with service role when available
function serverSupabase() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
}

export const handlePortfolioValue: RequestHandler = async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "userId required" });
  try {
    const supabase = serverSupabase();
    const { data, error } = await supabase.rpc("calculate_portfolio_value", {
      p_user_id: userId,
    });
    if (error) {
      // Return default data if RPC function doesn't exist
      if (
        error.message?.includes("could not find") ||
        error.code === "PGRST116"
      ) {
        return res.json({ data: { total_usd: 0, total_btc: 0, total_eth: 0 } });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.json({ data });
  } catch (err) {
    console.error("Proxy error:", err);
    const { serverError } = await import("../lib/respond");
    return serverError(res, err, 500);
  }
};

export const handlePortfolio24hChange: RequestHandler = async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "userId required" });
  try {
    const supabase = serverSupabase();
    const { data, error } = await supabase.rpc("get_portfolio_24h_change", {
      p_user_id: userId,
    });
    if (error) {
      // Return default data if RPC function doesn't exist
      if (
        error.message?.includes("could not find") ||
        error.code === "PGRST116"
      ) {
        return res.json({ data: { change_usd: 0, change_percentage: 0 } });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.json({ data });
  } catch (err) {
    console.error("Proxy error:", err);
    const { serverError } = await import("../lib/respond");
    return serverError(res, err, 500);
  }
};

export const handleUserAssets: RequestHandler = async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "userId required" });
  try {
    const supabase = serverSupabase();
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .eq("user_id", userId)
      .gt("balance", 0)
      .order("balance_usd", { ascending: false });
    if (error) {
      // Return empty array if table doesn't exist
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        return res.json({ data: [] });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.json({ data: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Return empty array instead of error for network/missing table issues
    return res.json({ data: [] });
  }
};

export const handleTransactionHistory: RequestHandler = async (req, res) => {
  const { userId, limit = 20, offset = 0 } = req.body || {};
  if (!userId) return res.status(400).json({ error: "userId required" });
  try {
    const supabase = serverSupabase();
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) {
      // Return empty array if table doesn't exist
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        return res.json({ data: [] });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.json({ data: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Return empty array instead of error for network/missing table issues
    return res.json({ data: [] });
  }
};

export const handlePortfolioSnapshots: RequestHandler = async (req, res) => {
  const { userId, daysBack = 90 } = req.body || {};
  if (!userId) return res.status(400).json({ error: "userId required" });
  try {
    const supabase = serverSupabase();
    const { data, error } = await supabase
      .from("portfolio_snapshots")
      .select("*")
      .eq("user_id", userId)
      .gt(
        "snapshot_date",
        new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString(),
      )
      .order("snapshot_date", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ data });
  } catch (err) {
    console.error("Proxy error:", err);
    const { serverError } = await import("../lib/respond");
    return serverError(res, err, 500);
  }
};

export const handleLatestPrice: RequestHandler = async (req, res) => {
  const { symbol } = req.body || {};
  if (!symbol) return res.status(400).json({ error: "symbol required" });
  try {
    const supabase = serverSupabase();
    const { data, error } = await supabase
      .from("price_history")
      .select("*")
      .eq("symbol", symbol)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== "PGRST116")
      return res.status(500).json({ error: error.message });
    return res.json({ data: data || null });
  } catch (err) {
    console.error("Proxy error:", err);
    const { serverError } = await import("../lib/respond");
    return serverError(res, err, 500);
  }
};

export const handleUserWallets: RequestHandler = async (req, res) => {
  const { userId, primaryOnly = false } = req.body || {};
  if (!userId) return res.status(400).json({ error: "userId required" });
  try {
    const supabase = serverSupabase();
    let query = supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (primaryOnly) {
      query = query.eq("is_primary", true);
    }

    const { data, error } = await query.order("is_primary", {
      ascending: false,
    });

    if (error) {
      // Return empty array if table doesn't exist
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        return res.json({ data: [] });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.json({ data: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Return empty array instead of error for network/missing table issues
    return res.json({ data: [] });
  }
};

export const handlePendingWithdrawals: RequestHandler = async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: "userId required" });
  try {
    const supabase = serverSupabase();
    const { data, error } = await supabase
      .from("withdrawal_requests")
      .select("id,amount,symbol,status,created_at")
      .eq("user_id", userId)
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: false });

    if (error) {
      // Return empty array if table doesn't exist
      if (error.message?.includes("does not exist") || error.code === "42P01") {
        return res.json({ data: [] });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.json({ data: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Return empty array instead of error for network/missing table issues
    return res.json({ data: [] });
  }
};

export const handleSeedAssets: RequestHandler = async (req, res) => {
  const { userId, walletId } = req.body || {};
  if (!userId || !walletId) {
    return res.status(400).json({ error: "userId and walletId required" });
  }
  try {
    const supabase = serverSupabase();

    // Test assets to seed for demo
    const testAssets = [
      { symbol: "BTC", name: "Bitcoin", balance: 0.542, price_usd: 370544.3 },
      { symbol: "ETH", name: "Ethereum", balance: 5.148, price_usd: 2280 },
      { symbol: "USDC", name: "USD Coin", balance: 8500, price_usd: 1.0 },
      { symbol: "ADA", name: "Cardano", balance: 2500, price_usd: 0.98 },
    ];

    const assetsToInsert = testAssets.map(asset => ({
      user_id: userId,
      wallet_id: walletId,
      symbol: asset.symbol,
      name: asset.name,
      balance: asset.balance,
      balance_usd: asset.balance * asset.price_usd,
      price_usd: asset.price_usd,
      chain: "ethereum",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Try to insert assets - if they exist, update them
    const { data: existingAssets } = await supabase
      .from("assets")
      .select("id,symbol")
      .eq("user_id", userId)
      .eq("wallet_id", walletId);

    const existingSymbols = new Set((existingAssets || []).map(a => a.symbol));
    const assetsToCreate = assetsToInsert.filter(a => !existingSymbols.has(a.symbol));
    const assetsToUpdate = assetsToInsert.filter(a => existingSymbols.has(a.symbol));

    // Insert new assets
    if (assetsToCreate.length > 0) {
      const { error: insertError } = await supabase
        .from("assets")
        .insert(assetsToCreate as never);

      if (insertError) {
        console.error("Failed to insert assets:", insertError);
      }
    }

    // Update existing assets
    for (const asset of assetsToUpdate) {
      const { error: updateError } = await supabase
        .from("assets")
        .update({
          balance: asset.balance,
          balance_usd: asset.balance_usd,
          price_usd: asset.price_usd,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("wallet_id", walletId)
        .eq("symbol", asset.symbol);

      if (updateError) {
        console.error(`Failed to update ${asset.symbol}:`, updateError);
      }
    }

    return res.json({
      data: {
        success: true,
        message: "Test assets seeded",
        created: assetsToCreate.length,
        updated: assetsToUpdate.length,
      }
    });
  } catch (err) {
    console.error("Seed assets error:", err);
    return res.status(500).json({ error: "Failed to seed test assets" });
  }
};
