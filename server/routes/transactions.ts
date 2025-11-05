import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Get user's transactions
router.get("/", authMiddleware, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, type } = req.query;

    // Build query
    let query = supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply type filter if provided
    if (
      type &&
      ["send", "receive", "swap", "deposit", "withdrawal"].includes(type)
    ) {
      query = query.eq("tx_type", type);
    }

    const { data: transactions, error, count } = await query;

    if (error) throw error;

    // Format transactions
    const formattedTransactions = (transactions || []).map((tx) => ({
      id: tx.id,
      tx_hash: tx.tx_hash,
      tx_type: tx.tx_type,
      amount: parseFloat(tx.amount),
      symbol: tx.symbol,
      amount_usd: parseFloat(tx.amount_usd) || 0,
      status: tx.status,
      created_at: tx.created_at,
      from: tx.from_address,
      to: tx.to_address,
      fee: tx.fee ? parseFloat(tx.fee) : undefined,
      fee_currency: tx.fee_currency,
    }));

    res.json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        total: count || 0,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch transactions",
      details: error.message,
    });
  }
});

export default router;
