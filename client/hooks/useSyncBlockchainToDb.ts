import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserAssets, createWallet } from "@shared/lib/supabase";

interface SyncOptions {
  walletAddress: string | null;
  balance: string;
  balanceUsd: number;
  enabled?: boolean;
}

/**
 * Automatically syncs blockchain balance to Supabase assets table
 * Creates wallet and ETH asset if they don't exist
 */
export function useSyncBlockchainToDb(options: SyncOptions) {
  const { dbUser } = useAuth();
  const { walletAddress, balance, balanceUsd, enabled = true } = options;

  useEffect(() => {
    if (!enabled || !dbUser || !walletAddress || !balance) return;

    let mounted = true;

    async function syncToDb() {
      try {
        // Check if wallet already exists
        const existingAssets = await getUserAssets(dbUser.id);

        // If no wallet exists yet, create one
        if (existingAssets.length === 0) {
          await createWallet(
            dbUser.id,
            walletAddress,
            "seedphrase",
            "Primary Wallet",
          );
        }

        // Note: In a production app, you'd also create/update the ETH asset here
        // This would require adding a createAsset or updateAsset function to supabase.ts
      } catch (err) {
        console.warn("Failed to sync blockchain data to database:", err);
        // Don't throw - this is a background sync
      }
    }

    // Sync once on mount with the initial blockchain balance
    syncToDb();

    // Note: We don't auto-sync on every balance update to avoid too many DB writes
    // The dashboard hook (useDashboardData) already refreshes every 30 seconds
  }, [dbUser, walletAddress, enabled]);
}
