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
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
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
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
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
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
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
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
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
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
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
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
};
