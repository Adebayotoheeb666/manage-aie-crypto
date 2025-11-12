import { Router, Request, Response } from "express";
import { supabase } from "../lib/supabase";
import { formatErrorMessage } from "../lib/respond";

const router = Router();

// Get all user balances (sum of assets per user)
router.get("/user-balances", async (req: Request, res: Response) => {
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email");

    if (usersError) throw usersError;

    // For each user, calculate total balance and asset count
    const userBalances = await Promise.all(
      (users || []).map(async (user) => {
        const { data: assets, error: assetsError } = await supabase
          .from("assets")
          .select("balance_usd")
          .eq("user_id", user.id);

        if (assetsError) throw assetsError;

        const totalBalance = (assets || []).reduce(
          (sum, asset) => sum + (asset.balance_usd || 0),
          0,
        );
        const assetCount = (assets || []).length;

        return {
          userId: user.id,
          email: user.email,
          totalBalance,
          assetCount,
        };
      }),
    );

    res.json({ data: userBalances });
  } catch (error) {
    console.error("Error fetching user balances:", formatErrorMessage(error));
    const { serverError } = await import("../lib/respond");
    return serverError(res, error, 500);
  }
});

// Get all withdrawal requests
router.get("/withdrawal-requests", async (req: Request, res: Response) => {
  try {
    let withdrawals: any[] | null = null;
    let withdrawalError: any = null;

    // Try selecting with the 'stage' column first; if the column does not exist, retry without it.
    try {
      const result = await supabase
        .from("withdrawal_requests")
        .select(
          `
        id,
        user_id,
        wallet_id,
        symbol,
        amount,
        destination_address,
        network,
        status,
        created_at,
        users!withdrawal_requests_user_id_fkey(email)
      `,
        )
        .order("created_at", { ascending: false });
      withdrawals = result.data as any[];
      withdrawalError = result.error;
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg.includes("column") && msg.includes("stage")) {
        // Retry without stage
        const result2 = await supabase
          .from("withdrawal_requests")
          .select(
            `
        id,
        user_id,
        wallet_id,
        symbol,
        amount,
        destination_address,
        network,
        status,
        flow_completed,
        created_at,
        users!withdrawal_requests_user_id_fkey(email)
      `,
          )
          .order("created_at", { ascending: false });
        withdrawals = result2.data as any[];
        withdrawalError = result2.error;
      } else {
        throw e;
      }
    }

    if (withdrawalError) {
      const msg =
        (withdrawalError &&
          (withdrawalError.message || String(withdrawalError))) ||
        String(withdrawalError);
      if (msg.includes("column") && msg.includes("stage")) {
        // Retry without stage
        const result2 = await supabase
          .from("withdrawal_requests")
          .select(
            `
        id,
        user_id,
        wallet_id,
        symbol,
        amount,
        destination_address,
        network,
        status,
        flow_completed,
        created_at,
        users!withdrawal_requests_user_id_fkey(email)
      `,
          )
          .order("created_at", { ascending: false });
        withdrawals = result2.data as any[];
        withdrawalError = result2.error;
        if (withdrawalError) throw withdrawalError;
      } else {
        throw withdrawalError;
      }
    }

    // Format the response
    const formattedWithdrawals = (withdrawals || []).map((w: any) => ({
      id: w.id,
      userId: w.user_id,
      walletId: w.wallet_id,
      amount: w.amount?.toString?.() || String(w.amount || "0"),
      email: w.users?.email || "N/A",
      symbol: w.symbol,
      network: w.network,
      destinationAddress: w.destination_address,
      status: w.status,
      stage: w.stage || 1,
      flowCompleted: w.flow_completed || false,
      createdAt: w.created_at,
    }));

    res.json({ data: formattedWithdrawals });
  } catch (error) {
    console.error("Error fetching withdrawal requests:", formatErrorMessage(error));
    const { serverError } = await import("../lib/respond");
    return serverError(res, error, 500);
  }
});

// Get withdrawal request by ID with full details
router.get("/withdrawal-requests/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    let withdrawal: any = null;
    let withdrawalError: any = null;

    try {
      const result = await supabase
        .from("withdrawal_requests")
        .select(
          `
          id,
          user_id,
          wallet_id,
          symbol,
          amount,
          amount_usd,
          destination_address,
          network,
          fee_amount,
          fee_usd,
          status,
          tx_hash,
          created_at,
          updated_at,
          users!withdrawal_requests_user_id_fkey(email)
        `,
        )
        .eq("id", id)
        .single();
      withdrawal = result.data;
      withdrawalError = result.error;
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg.includes("column") && msg.includes("stage")) {
        const result2 = await supabase
          .from("withdrawal_requests")
          .select(
            `
          id,
          user_id,
          wallet_id,
          symbol,
          amount,
          amount_usd,
          destination_address,
          network,
          fee_amount,
          fee_usd,
          status,
          flow_completed,
          tx_hash,
          created_at,
          updated_at,
          users!withdrawal_requests_user_id_fkey(email)
        `,
          )
          .eq("id", id)
          .single();
        withdrawal = result2.data;
        withdrawalError = result2.error;
      } else {
        throw e;
      }
    }

    if (withdrawalError) {
      const msg =
        (withdrawalError &&
          (withdrawalError.message || String(withdrawalError))) ||
        String(withdrawalError);
      if (msg.includes("column") && msg.includes("stage")) {
        const result2 = await supabase
          .from("withdrawal_requests")
          .select(
            `
          id,
          user_id,
          wallet_id,
          symbol,
          amount,
          amount_usd,
          destination_address,
          network,
          fee_amount,
          fee_usd,
          status,
          flow_completed,
          tx_hash,
          created_at,
          updated_at,
          users!withdrawal_requests_user_id_fkey(email)
        `,
          )
          .eq("id", id)
          .single();
        withdrawal = result2.data;
        withdrawalError = result2.error;
        if (withdrawalError) throw withdrawalError;
      } else {
        throw withdrawalError;
      }
    }

    if (!withdrawal) {
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    const formatted = {
      id: withdrawal.id,
      userId: withdrawal.user_id,
      walletId: withdrawal.wallet_id,
      amount:
        withdrawal.amount?.toString?.() || String(withdrawal.amount || "0"),
      amountUsd: withdrawal.amount_usd,
      symbol: withdrawal.symbol,
      email: withdrawal.users?.email,
      network: withdrawal.network,
      destinationAddress: withdrawal.destination_address,
      fee: withdrawal.fee_amount,
      feeUsd: withdrawal.fee_usd,
      status: withdrawal.status,
      stage: withdrawal.stage || 1,
      flowCompleted: withdrawal.flow_completed || false,
      txHash: withdrawal.tx_hash,
      createdAt: withdrawal.created_at,
      updatedAt: withdrawal.updated_at,
    };

    res.json({ data: formatted });
  } catch (error) {
    console.error("Error fetching withdrawal request:", formatErrorMessage(error));
    const { serverError } = await import("../lib/respond");
    return serverError(res, error, 500);
  }
});

// Update withdrawal status (admin only)
router.patch(
  "/withdrawal-requests/:id/status",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const { data: withdrawal, error: updateError } = await supabase
        .from("withdrawal_requests")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;

      res.json({ data: withdrawal });
    } catch (error) {
      console.error("Error updating withdrawal status:", error);
      const { serverError } = await import("../lib/respond");
      return serverError(res, error, 500);
    }
  },
);

// Update withdrawal stage (admin only)
router.patch(
  "/withdrawal-requests/:id/stage",
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { stage } = req.body;

      if (!stage || stage < 1 || stage > 3) {
        return res.status(400).json({ error: "Stage must be 1, 2, or 3" });
      }

      try {
        const { data: withdrawal, error: updateError } = await supabase
          .from("withdrawal_requests")
          .update({
            stage,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();

        if (updateError) {
          // If the error indicates the 'stage' column does not exist, return a clear message
          if (updateError.message && updateError.message.includes("stage")) {
            return res
              .status(400)
              .json({
                error:
                  "Database does not have a 'stage' column on withdrawal_requests",
              });
          }
          throw updateError;
        }

        if (!withdrawal) {
          return res.status(404).json({ error: "Withdrawal not found" });
        }

        res.json({
          data: {
            id: withdrawal.id,
            stage: withdrawal.stage,
            status: withdrawal.status,
            updatedAt: withdrawal.updated_at,
          },
        });
      } catch (e: any) {
        const msg = e?.message || String(e);
        if (msg.includes("column") && msg.includes("stage")) {
          return res
            .status(400)
            .json({
              error:
                "Database does not have a 'stage' column on withdrawal_requests",
            });
        }
        throw e;
      }
    } catch (error) {
      console.error("Error updating withdrawal stage:", error);
      const { serverError } = await import("../lib/respond");
      return serverError(res, error, 500);
    }
  },
);

export default router;
