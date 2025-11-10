import { RequestHandler } from "express";
import { createWithdrawalRequest, getWalletAssets } from "../../shared/lib/supabase";
import { supabase } from "../../shared/lib/supabase";
import { z } from "zod";
import type { User, Asset, WithdrawalRequest as WithdrawalRequestType } from "../../shared/types/database";

// Validation schema for withdrawal request
const withdrawalSchema = z.object({
  walletId: z.string().uuid("Invalid wallet ID"),
  symbol: z.string().min(1).max(20),
  amount: z.number().positive("Amount must be positive"),
  destinationAddress: z.string().min(1),
  network: z.string().min(1),
  email: z.string().email(),
  flowCompleted: z.boolean().optional().default(false),
});

type WithdrawalRequest = z.infer<typeof withdrawalSchema>;

interface WithdrawalResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    status: string;
    amount: number;
    amountUsd: number;
    fee: number;
  };
  error?: string;
}

export const handleWithdraw: RequestHandler<
  unknown,
  WithdrawalResponse,
  WithdrawalRequest
> = async (req, res) => {
  try {
    // Get authenticated user
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Missing or invalid authorization header",
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const { data: userData, error: authError } =
      await supabase.auth.getUser(token);
    if (authError || !userData.user) {
      res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
      return;
    }

    const userId = userData.user.id;

    // Validate request body
    let withdrawalData: WithdrawalRequest;
    try {
      withdrawalData = withdrawalSchema.parse(req.body);
    } catch (validationError) {
      res.status(400).json({
        success: false,
        error: "Invalid request data",
      });
      return;
    }

    const { walletId, symbol, amount, destinationAddress, network, email, flowCompleted } =
      withdrawalData;

    // Get user from database
    const { data: userRaw, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("auth_id", userId)
      .single();
    const user = userRaw as User;

    if (userError || !user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    // Verify wallet belongs to user
    const { data: walletRaw, error: walletError } = await supabase
      .from("wallets")
      .select("id, user_id")
      .eq("id", walletId)
      .eq("user_id", user.id)
      .single();

    if (walletError || !walletRaw) {
      res.status(403).json({
        success: false,
        error: "Wallet not found or does not belong to user",
      });
      return;
    }

    const wallet = walletRaw;

    // Get wallet assets to check balance
    const assetsRaw = await getWalletAssets(walletId);
    const assets = assetsRaw as Asset[];
    const asset = assets.find(
      (a) => a.symbol.toUpperCase() === symbol.toUpperCase(),
    );

    if (!asset) {
      res.status(400).json({
        success: false,
        error: `${symbol} not found in wallet`,
      });
      return;
    }

    if (asset.balance < amount) {
      res.status(400).json({
        success: false,
        error: `Insufficient balance. Available: ${asset.balance} ${symbol}`,
      });
      return;
    }

    // Calculate fees (1% of amount, minimum 0.0001)
    const feeAmount = Math.max(amount * 0.01, 0.0001);
    const feeUsd = feeAmount * (asset.price_usd || 0);
    const totalAmount = amount + feeAmount;

    if (asset.balance < totalAmount) {
      res.status(400).json({
        success: false,
        error: `Insufficient balance including fees. Required: ${totalAmount} ${symbol}`,
      });
      return;
    }

    // Create withdrawal request
    const withdrawalRaw = await createWithdrawalRequest(
      user.id,
      walletId,
      symbol,
      amount,
      amount * (asset.price_usd || 0),
      destinationAddress,
      network,
      feeAmount,
      feeUsd,
    );
    const withdrawal = withdrawalRaw as WithdrawalRequestType;

    // Log audit event
    // @ts-ignore
    await supabase.rpc("log_audit_event", {
      p_user_id: user.id,
      p_action: "WITHDRAWAL_REQUESTED",
      p_entity_type: "withdrawal_requests",
      p_entity_id: withdrawal.id,
      p_new_values: {
        symbol,
        amount,
        destination_address: destinationAddress,
        network,
        fee_usd: feeUsd,
      },
    } as Record<string, any>);

    res.status(201).json({
      success: true,
      message: "Withdrawal request created successfully",
      data: {
        id: withdrawal.id,
        status: withdrawal.status,
        amount,
        amountUsd: amount * (asset.price_usd || 0),
        fee: feeAmount,
      },
    });
  } catch (err) {
    console.error("Withdrawal error:", err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Internal server error",
    });
  }
};
